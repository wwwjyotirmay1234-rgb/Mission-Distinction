/**
 * category-audit.mjs
 *
 * Scans anatomy viva images for a specific category, detects answer leaks via
 * GPT-4o vision, and optionally auto-deletes flagged images.
 *
 * Usage:
 *   node category-audit.mjs <apiBase> <adminToken> <category> [--delete]
 *
 * Examples:
 *   node category-audit.mjs http://localhost:8080 <jwt> Visceral
 *   node category-audit.mjs http://localhost:8080 <jwt> Visceral --delete
 */

const OPENAI_PKG = "/home/runner/workspace/node_modules/.pnpm/openai@6.44.0_ws@8.21.0_zod@3.25.76/node_modules/openai/index.js";
const { default: OpenAI } = await import(OPENAI_PKG);

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const API_BASE = process.argv[2] || "http://localhost:8080";
const ADMIN_TOKEN = process.argv[3];
const CATEGORY = process.argv[4];
const AUTO_DELETE = process.argv.includes("--delete");
const OFFSET = parseInt(process.argv.find(a => a.startsWith("--offset="))?.split("=")[1] || "0", 10);
const LIMIT = parseInt(process.argv.find(a => a.startsWith("--limit="))?.split("=")[1] || "9999", 10);

if (!ADMIN_TOKEN || !CATEGORY) {
  console.error("Usage: node category-audit.mjs <apiBase> <adminToken> <category> [--delete] [--offset=N] [--limit=N]");
  console.error("Categories: Visceral | Bone | Histology | Prosection | Section Anatomy");
  process.exit(1);
}

const PROMPT = `This is an anatomical image used in a medical viva exam where students must identify the structure shown WITHOUT any textual hint.

Inspect the ENTIRE image carefully including edges, corners, figure captions and any faint text.

Does this image contain ANY of the following that would give away the answer?
- The name of the anatomical structure, bone, or organ written anywhere (even partially or faintly)
- Labels, letters with leader lines, or arrows pointing to named structures
- A figure caption or description that reveals what the structure is
- Any other text that names or strongly hints at what is shown

Ignore: scale bars with no anatomy text, orientation markers (plain "L"/"R" without structure names), watermarks/logos that don't name anatomy, figure numbers alone (e.g. "Fig. 6" with NO accompanying name).

Return ONLY valid JSON: {"hasLeak": boolean, "leakDescription": string|null, "confidence": "high"|"medium"|"low"}`;

async function checkImage(dataUrl) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a meticulous exam-integrity reviewer. Output only valid JSON." },
      {
        role: "user",
        content: [
          { type: "text", text: PROMPT },
          { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
        ],
      },
    ],
  });
  const raw = completion.choices[0]?.message?.content || "{}";
  try { return JSON.parse(raw); } catch { return { hasLeak: null, leakDescription: "PARSE_ERROR", confidence: "low" }; }
}

async function main() {
  console.log(`Auditing category: ${CATEGORY}${AUTO_DELETE ? " [AUTO-DELETE mode]" : " [dry-run]"}`);

  const listResp = await fetch(
    `${API_BASE}/api/anatomy-viva-images/admin/list?category=${encodeURIComponent(CATEGORY)}`,
    { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
  );
  if (!listResp.ok) { console.error("List failed:", listResp.status); process.exit(1); }
  const { images } = await listResp.json();
  const allImages = images.slice(OFFSET, OFFSET + LIMIT);
  console.log(`Found ${images.length} total; processing ${allImages.length} (offset=${OFFSET} limit=${LIMIT})\n`);
  const images2 = allImages; // reassign for loop below

  const flagged = [];
  const clean = [];
  const errors = [];
  let i = 0;

  for (const img of images2) {
    i++;
    process.stdout.write(`[${i}/${images.length}] id=${img.id} "${img.title.slice(0, 50)}" … `);
    try {
      const imgResp = await fetch(`${API_BASE}/api/anatomy-viva-images/serve/${img.id}?token=${ADMIN_TOKEN}`);
      if (!imgResp.ok) { console.log(`SKIP (download ${imgResp.status})`); errors.push({ id: img.id, error: `${imgResp.status}` }); continue; }
      const buf = Buffer.from(await imgResp.arrayBuffer());
      const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
      const result = await checkImage(dataUrl);

      if (result.hasLeak) {
        console.log(`LEAK [${result.confidence}] ${result.leakDescription}`);
        flagged.push({ id: img.id, category: img.category, title: img.title, sourcePage: img.sourcePage, ...result });

        if (AUTO_DELETE) {
          const delResp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/${img.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
          });
          if (delResp.ok) console.log(`  → DELETED id=${img.id}`);
          else console.log(`  → delete FAILED ${delResp.status}`);
        }
      } else {
        console.log(`clean`);
        clean.push(img.id);
      }
    } catch (err) {
      console.log(`ERROR: ${err?.message}`);
      errors.push({ id: img.id, error: err?.message });
    }
  }

  console.log(`\n═══ ${CATEGORY} audit complete ═══`);
  console.log(`Clean: ${clean.length}  Flagged: ${flagged.length}  Errors: ${errors.length}`);
  if (flagged.length) {
    console.log("\nFlagged images:");
    for (const f of flagged) {
      console.log(`  id=${f.id} [${f.confidence}] "${f.title}" — ${f.leakDescription}`);
    }
    if (!AUTO_DELETE) {
      console.log("\nRe-run with --delete to remove all flagged images.");
    }
  }
}

main();
