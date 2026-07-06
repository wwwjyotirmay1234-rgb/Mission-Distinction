import fs from "node:fs";
import path from "node:path";

const OPENAI_PKG = "/home/runner/workspace/node_modules/.pnpm/openai@6.44.0_ws@8.21.0_zod@3.25.76/node_modules/openai/index.js";
const { default: OpenAI } = await import(OPENAI_PKG);

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const API_BASE = process.argv[2] || "http://localhost:8080";
const ADMIN_TOKEN = process.argv[3];
const OUT_DIR = process.argv[4] || "/tmp/viva_audit";
const OFFSET = parseInt(process.argv[5] || "0", 10);
const LIMIT = process.argv[6] ? parseInt(process.argv[6], 10) : null;

if (!ADMIN_TOKEN) {
  console.error("Usage: node viva-audit.mjs <apiBase> <adminToken> [outDir] [offset] [limit]");
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const PROMPT = `This is a cropped photograph meant to be used as a "spot the structure" image in a medical viva exam — the student must identify the anatomical structure shown WITHOUT any hint.

Carefully inspect the ENTIRE image, including thin strips near the edges, corners, and any faint/small text.

Does this image contain ANY of the following that would give away or hint at the answer?
- The name of the structure, organ, or bone written anywhere (even partially, faint, or cut off)
- Labels, arrows, or leader lines pointing to parts of the structure
- A caption or figure number describing what it is
- Any other text that reveals or strongly hints at the identity of the structure

Ignore: scale bars/rulers with no text, generic orientation markers (e.g. a plain letter "A"/"B" or "L"/"R" not tied to a label), color-coding legends unrelated to naming the main structure, watermarks/logos unrelated to anatomy naming.

Return ONLY valid JSON: {"hasLeak": boolean, "leakDescription": string|null, "confidence": "high"|"medium"|"low"}`;

async function checkImage(dataUrl) {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a meticulous exam-integrity reviewer for medical viva images. Output only valid JSON." },
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });
  const raw = completion.choices[0]?.message?.content || "{}";
  try { return JSON.parse(raw); } catch { return { hasLeak: null, leakDescription: "PARSE_ERROR", confidence: "low" }; }
}

async function main() {
  const listResp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/list`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  const { images: allImages } = await listResp.json();
  const images = LIMIT != null ? allImages.slice(OFFSET, OFFSET + LIMIT) : allImages.slice(OFFSET);
  console.log(`Auditing ${images.length} of ${allImages.length} images (offset=${OFFSET})...`);

  const resultPath = path.join(OUT_DIR, "_audit_result.json");
  const prior = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, "utf8")) : { flagged: [], clean: [], errors: [] };
  const flagged = prior.flagged;
  const clean = prior.clean;
  const errors = prior.errors;

  for (const img of images) {
    try {
      const imgResp = await fetch(`${API_BASE}/api/anatomy-viva-images/serve/${img.id}?token=${ADMIN_TOKEN}`);
      if (!imgResp.ok) { errors.push({ id: img.id, error: `download failed ${imgResp.status}` }); continue; }
      const buf = Buffer.from(await imgResp.arrayBuffer());
      fs.writeFileSync(path.join(OUT_DIR, `${img.id}_${img.category}.png`), buf);
      const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
      const result = await checkImage(dataUrl);
      if (result.hasLeak) {
        flagged.push({ id: img.id, category: img.category, title: img.title, sourceFileName: img.sourceFileName, sourcePage: img.sourcePage, ...result });
        console.log(`FLAGGED [${img.category}] id=${img.id} "${img.title}" (${result.confidence}): ${result.leakDescription}`);
      } else {
        clean.push(img.id);
      }
    } catch (err) {
      errors.push({ id: img.id, error: err?.message || String(err) });
      console.error(`ERROR id=${img.id}`, err?.message || err);
    }
  }

  console.log(`\nDone. Clean=${clean.length} Flagged=${flagged.length} Errors=${errors.length}`);
  fs.writeFileSync(path.join(OUT_DIR, "_audit_result.json"), JSON.stringify({ flagged, clean, errors }, null, 2));
}

main();
