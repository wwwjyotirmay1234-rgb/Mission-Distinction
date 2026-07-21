/**
 * visceral-web-import.mjs
 *
 * Reads /tmp/visceral_urls.json (output from imageSearch in code_execution),
 * downloads each candidate, checks with GPT-4o-mini for quality + label leaks,
 * and uploads clean images to the anatomy viva images DB via the admin API.
 *
 * Usage:
 *   node visceral-web-import.mjs <apiBase> <adminToken> [--offset=N] [--limit=N]
 */

const OPENAI_PKG = "/home/runner/workspace/node_modules/.pnpm/openai@6.44.0_ws@8.21.0_zod@3.25.76/node_modules/openai/index.js";
const { default: OpenAI } = await import(OPENAI_PKG);
import fs from "node:fs/promises";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const API_BASE = process.argv[2] || "http://localhost:8080";
const ADMIN_TOKEN = process.argv[3];
const OFFSET = parseInt(process.argv.find(a => a.startsWith("--offset="))?.split("=")[1] || "0", 10);
const LIMIT = parseInt(process.argv.find(a => a.startsWith("--limit="))?.split("=")[1] || "9999", 10);

if (!ADMIN_TOKEN) {
  console.error("Usage: node visceral-web-import.mjs <apiBase> <adminToken> [--offset=N] [--limit=N]");
  process.exit(1);
}

async function checkImage(dataUrl) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a medical anatomy image quality reviewer. Output only valid JSON." },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this image for a medical gross anatomy visceral spotter exam where students identify organs from specimens.

Return JSON: {"isRealSpecimen": boolean, "hasLeak": boolean, "isHighQuality": boolean, "reason": string}
- isRealSpecimen: true ONLY if this is a PHOTOGRAPH of a real anatomical specimen (cadaveric, formalin-preserved, or fresh organ/organ system). Must be a real photo — NOT a diagram, line drawing, illustration, textbook figure, 3D render, cartoon, or digital artwork. Gray's Anatomy-style engravings = false.
- hasLeak: true if ANY text label, annotation, or caption in the image names the organ, its parts, or its identity (would give away the answer in a viva)
- isHighQuality: true if the image is clear, well-lit, properly shows gross anatomy features, and is at reasonable resolution`
          },
          { type: "image_url", image_url: { url: dataUrl, detail: "low" } }
        ]
      }
    ]
  });
  try { return JSON.parse(completion.choices[0]?.message?.content || "{}"); }
  catch { return { isRealSpecimen: false, hasLeak: true, isHighQuality: false, reason: "parse error" }; }
}

async function downloadImage(url) {
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    if (!resp.ok) return null;
    const ct = resp.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 30000) return null; // skip < 30KB
    return { base64: buf.toString("base64"), contentType: ct.split(";")[0], size: buf.length };
  } catch { return null; }
}

async function uploadImage(organ, base64, contentType) {
  const ext = contentType.includes("png") ? "png" : "jpg";
  const slug = organ.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const sf = `web-visceral-${slug}.${ext}`;
  const resp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ADMIN_TOKEN}` },
    body: JSON.stringify({
      category: "Visceral",
      title: organ,
      notes: "Web-sourced gross anatomy specimen photograph (unlabeled)",
      sourceFileName: sf,
      imageBase64: `data:${contentType};base64,${base64}`
    })
  });
  if (!resp.ok) { const t = await resp.text(); console.log(`  upload failed ${resp.status}: ${t.slice(0, 80)}`); return null; }
  return await resp.json();
}

async function processOrgan(organ, urls) {
  let uploaded = 0;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stdout.write(`  [${i+1}/${urls.length}] downloading… `);
    const img = await downloadImage(url);
    if (!img) { process.stdout.write("skip (download)\n"); continue; }
    process.stdout.write(`${Math.round(img.size/1024)}KB, checking… `);
    const dataUrl = `data:${img.contentType};base64,${img.base64}`;
    const check = await checkImage(dataUrl);
    if (!check.isRealSpecimen) { process.stdout.write(`skip (not real specimen: ${check.reason?.slice(0,60)})\n`); continue; }
    if (check.hasLeak) { process.stdout.write(`skip (LEAK: ${check.reason?.slice(0,60)})\n`); continue; }
    if (!check.isHighQuality) { process.stdout.write(`skip (low quality: ${check.reason?.slice(0,60)})\n`); continue; }
    process.stdout.write(`✓ uploading… `);
    const result = await uploadImage(organ, img.base64, img.contentType);
    if (result?.success) {
      process.stdout.write(`UPLOADED id=${result.image?.id}\n`);
      uploaded++;
      if (uploaded >= 2) break; // max 2 per organ
    } else {
      process.stdout.write(`upload failed\n`);
    }
  }
  return uploaded;
}

async function main() {
  const urlMap = JSON.parse(await fs.readFile("/tmp/visceral_urls.json", "utf8"));
  const organs = Object.keys(urlMap).slice(OFFSET, OFFSET + LIMIT);
  console.log(`Processing ${organs.length} organs (offset=${OFFSET} limit=${LIMIT}) of ${Object.keys(urlMap).length} total\n`);

  let totalAdded = 0, skipped = 0;
  for (const organ of organs) {
    const urls = urlMap[organ] || [];
    console.log(`\n[${organ}] — ${urls.length} candidates`);
    const count = await processOrgan(organ, urls);
    totalAdded += count;
    if (count === 0) { console.log(`  → no clean image found for: ${organ}`); skipped++; }
    else console.log(`  → ${count} image(s) added for: ${organ}`);
  }

  console.log(`\n═══ Import complete ═══`);
  console.log(`Images added: ${totalAdded}  Organs with no match: ${skipped}`);
}

main();
