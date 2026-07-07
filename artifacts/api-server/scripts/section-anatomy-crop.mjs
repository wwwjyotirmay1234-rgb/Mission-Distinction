/**
 * section-anatomy-crop.mjs
 *
 * Section Anatomy images are scanned from old anatomy textbooks, so each image
 * contains the actual figure AND the figure caption/body text that names the
 * structure — a direct answer leak in the viva exam.
 *
 * This script:
 *   1. Fetches each Section Anatomy image.
 *   2. Uses GPT vision to detect the tight bounding box of just the
 *      illustration(s), excluding all visible text below/around them.
 *   3. Crops the image to that box (with shrink retries on leak-check failure).
 *   4. If the cropped image still leaks after 4 attempts, the row is DELETED
 *      (these textbook pages can't be salvaged by cropping alone).
 *   5. Updates the DB row with the cropped image (DELETE + re-INSERT).
 *
 * Usage:
 *   node section-anatomy-crop.mjs <apiBase> <adminToken> [--dry-run]
 *   node section-anatomy-crop.mjs http://localhost:8080 <jwt>
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";

const OPENAI_PKG = "/home/runner/workspace/node_modules/.pnpm/openai@6.44.0_ws@8.21.0_zod@3.25.76/node_modules/openai/index.js";
const { default: OpenAI } = await import(OPENAI_PKG);

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const API_BASE = process.argv[2] || "http://localhost:8080";
const ADMIN_TOKEN = process.argv[3];
const DRY_RUN = process.argv.includes("--dry-run");
// Optional: resume from a specific row id (skip already-processed rows)
const START_FROM = parseInt(process.argv.find(a => a.startsWith("--from="))?.split("=")[1] || "0", 10);
// Optional: only process rows with id <= MAX_ID (skip freshly-inserted replacements)
const MAX_ID = parseInt(process.argv.find(a => a.startsWith("--max-id="))?.split("=")[1] || "999999", 10);

if (!ADMIN_TOKEN) {
  console.error("Usage: node section-anatomy-crop.mjs <apiBase> <adminToken> [--dry-run] [--from=<id>]");
  process.exit(1);
}

// ─── PNG chunk stripper (handles C2PA/caBX provenance chunks) ───────────────
const KNOWN_PNG_CHUNKS = new Set([
  "IHDR", "PLTE", "IDAT", "IEND", "tRNS", "gAMA", "cHRM", "sRGB", "iCCP",
  "bKGD", "pHYs", "tEXt", "zTXt", "iTXt", "sBIT", "hIST", "sPLT", "tIME",
]);
function stripUnknownPngChunks(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) return buf;
  const parts = [buf.subarray(0, 8)];
  let pos = 8;
  let strippedAny = false;
  while (pos + 8 <= buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.subarray(pos + 4, pos + 8).toString("ascii");
    const total = 8 + length + 4;
    if (pos + total > buf.length) break;
    if (KNOWN_PNG_CHUNKS.has(type)) parts.push(buf.subarray(pos, pos + total));
    else strippedAny = true;
    pos += total;
    if (type === "IEND") break;
  }
  return strippedAny ? Buffer.concat(parts) : buf;
}

// ─── GPT prompts ─────────────────────────────────────────────────────────────
const ILLUS_PROMPT = `This is a page from an old anatomy textbook that has been stored as a viva exam "spot the structure" image. The problem is that the page contains both the anatomical figure/illustration AND its title caption / body text that directly names and describes the structure — this gives away the answer.

Your task: identify the tight bounding box that encloses ONLY the illustration(s)/figure(s) on this page — excluding ALL visible text (figure number, caption, titles, body paragraphs, page headers, page numbers, footnotes). If there are multiple small illustrations on the same page, draw ONE bounding box that encloses all of them as tightly as possible while still excluding the surrounding text.

Return the box as percentages of the full image: (0,0) = top-left, (100,100) = bottom-right.

IMPORTANT: err on the side of cutting more text — it is better to slightly clip an illustration edge than to include text that names the structure.

Return ONLY valid JSON:
{"hasIllustration": true, "bbox": {"xPct": number, "yPct": number, "widthPct": number, "heightPct": number}}
or, if the entire image is already pure illustration with no identifying text visible:
{"hasIllustration": true, "alreadyClean": true}
or, if the image is so text-heavy that no clean illustration can be recovered:
{"hasIllustration": false}`;

async function detectIllustrationBox(dataUrl) {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a meticulous medical exam image curator. Output only valid JSON." },
      { role: "user", content: [
        { type: "text", text: ILLUS_PROMPT },
        { type: "image_url", image_url: { url: dataUrl } },
      ]},
    ],
  });
  try {
    return JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch {
    return { hasIllustration: false };
  }
}

const LEAK_PROMPT = `This is a cropped image meant to be used as a "spot the structure" image in a medical viva exam. Does this image contain ANY visible text, figure numbers, captions, or labels that could hint at the structure's identity? Even a partial or cut-off word at an edge counts as a leak. Scale bars, unlabelled orientation arrows, or generic Roman numerals used ONLY as structural markers (not names) are acceptable.
Return ONLY JSON: {"hasLeak": boolean, "leakDescription": string|null}`;

async function checkLeak(dataUrl) {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a meticulous exam-integrity reviewer. Output only valid JSON." },
      { role: "user", content: [{ type: "text", text: LEAK_PROMPT }, { type: "image_url", image_url: { url: dataUrl } }] },
    ],
  });
  try { return JSON.parse(completion.choices[0]?.message?.content || "{}"); } catch { return { hasLeak: true, leakDescription: "PARSE_ERROR" }; }
}

function doCrop(width, height, bbox, extraShrinkPct) {
  const x = Math.round((bbox.xPct / 100) * width + width * extraShrinkPct);
  const y = Math.round((bbox.yPct / 100) * height + height * extraShrinkPct);
  const w = Math.round((bbox.widthPct / 100) * width - width * extraShrinkPct * 2);
  const h = Math.round((bbox.heightPct / 100) * height - height * extraShrinkPct * 2);
  return {
    x: Math.max(0, x), y: Math.max(0, y),
    w: Math.max(10, Math.min(width - x, w)), h: Math.max(10, Math.min(height - y, h)),
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const listResp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/list?category=Section%20Anatomy`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  if (!listResp.ok) { console.error("Failed to list images:", await listResp.text()); process.exit(1); }
  const listData = await listResp.json();
  const allRows = Array.isArray(listData) ? listData : (listData.images ?? []);

  const rows = allRows.filter(r => r.id >= START_FROM && r.id <= MAX_ID);
  console.log(`Found ${allRows.length} Section Anatomy images total, processing ${rows.length} (from id=${START_FROM}). DRY_RUN=${DRY_RUN}`);

  let cropped = 0, alreadyClean = 0, deleted = 0, failed = 0;

  for (const row of rows) {
    // ── Fetch image ──────────────────────────────────────────────────────────
    const imgResp = await fetch(`${API_BASE}/api/anatomy-viva-images/serve/${row.id}?token=${ADMIN_TOKEN}`);
    if (!imgResp.ok) { console.warn(`id=${row.id}: serve failed (${imgResp.status}) — skipping`); failed++; continue; }
    const rawBuf = Buffer.from(await imgResp.arrayBuffer());
    const cleanBuf = stripUnknownPngChunks(rawBuf);
    const dataUrl = `data:image/png;base64,${cleanBuf.toString("base64")}`;

    // ── Ask GPT where the illustration is ───────────────────────────────────
    let detection;
    try { detection = await detectIllustrationBox(dataUrl); }
    catch (e) { console.warn(`id=${row.id} "${row.title}": detection error — ${e.message}`); failed++; continue; }

    if (!detection.hasIllustration) {
      console.log(`id=${row.id} "${row.title}": no salvageable illustration — DELETING`);
      if (!DRY_RUN) {
        const del = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/${row.id}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        });
        if (del.ok) deleted++; else console.warn(`  DELETE failed: ${del.status}`);
      } else { deleted++; }
      continue;
    }

    if (detection.alreadyClean) {
      console.log(`id=${row.id} "${row.title}": already clean — skipping`);
      alreadyClean++;
      continue;
    }

    const { bbox } = detection;
    if (!bbox || bbox.widthPct <= 0 || bbox.heightPct <= 0) {
      console.warn(`id=${row.id} "${row.title}": bad bbox — skipping`);
      failed++;
      continue;
    }

    // ── Load image, crop, leak-check with up to 4 shrink retries ────────────
    let img;
    try { img = await loadImage(cleanBuf); }
    catch (e) { console.warn(`id=${row.id}: loadImage failed — ${e.message}`); failed++; continue; }
    const { width, height } = img;

    let finalBuf = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const extraShrink = attempt * 0.015; // shrink 1.5% per side per retry
      const { x, y, w, h } = doCrop(width, height, bbox, extraShrink);
      const cropC = createCanvas(w, h);
      const ctx = cropC.getContext("2d");
      ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
      const buf = cropC.toBuffer("image/png");
      const leakDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
      const leak = await checkLeak(leakDataUrl);
      if (!leak.hasLeak) { finalBuf = buf; break; }
      console.log(`  attempt ${attempt}: still leaks — ${leak.leakDescription}`);
    }

    if (!finalBuf) {
      console.log(`id=${row.id} "${row.title}": cannot crop cleanly — DELETING`);
      if (!DRY_RUN) {
        const del = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/${row.id}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
        });
        if (del.ok) deleted++; else console.warn(`  DELETE failed: ${del.status}`);
      } else { deleted++; }
      continue;
    }

    if (DRY_RUN) { console.log(`id=${row.id} "${row.title}": [DRY_RUN] would crop`); cropped++; continue; }

    // ── Upload cropped image, delete original ────────────────────────────────
    const b64 = finalBuf.toString("base64");
    const insertResp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
      body: JSON.stringify({
        title: row.title,
        category: row.category,
        imageBase64: b64,
        sourcePage: row.source_page ?? row.sourcePage ?? null,
      }),
    });
    if (!insertResp.ok) { console.warn(`id=${row.id}: insert failed — ${await insertResp.text()}`); failed++; continue; }

    const delResp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/${row.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    if (delResp.ok) {
      console.log(`id=${row.id} "${row.title}": cropped → new row inserted, old deleted`);
      cropped++;
    } else {
      console.warn(`id=${row.id}: new row inserted but DELETE failed (${delResp.status}) — manual cleanup needed`);
    }
  }

  console.log(`\nDone. cropped=${cropped} alreadyClean=${alreadyClean} deleted=${deleted} failed=${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
