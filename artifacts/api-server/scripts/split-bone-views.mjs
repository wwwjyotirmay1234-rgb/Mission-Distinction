import fs from "node:fs";
import path from "node:path";
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
if (!ADMIN_TOKEN) {
  console.error("Usage: node split-bone-views.mjs <apiBase> <adminToken> [--dry-run]");
  process.exit(1);
}

const OUT_DIR = "/tmp/bone_split";
fs.mkdirSync(OUT_DIR, { recursive: true });

// Some stored PNGs carry a non-standard ancillary chunk (e.g. "caBX", a C2PA
// content-provenance blob) that @napi-rs/canvas's decoder cannot parse,
// causing a spurious "Unsupported image type" error even though the file is
// a perfectly valid PNG. Per spec, unrecognized ancillary chunks (lowercase
// first letter) are safe to drop — strip anything outside the well-known set.
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
    if (KNOWN_PNG_CHUNKS.has(type)) {
      parts.push(buf.subarray(pos, pos + total));
    } else {
      strippedAny = true;
    }
    pos += total;
    if (type === "IEND") break;
  }
  return strippedAny ? Buffer.concat(parts) : buf;
}

const SPLIT_PROMPT = `This is a specimen photograph used as a "spot the structure" image in a medical (MBBS) osteology/radiology viva exam. The current title given to this image is "{{TITLE}}".

Decide: does this single image actually contain TWO OR MORE clearly separate photographs/views of the specimen laid out side-by-side or stacked (e.g. an anterior view next to a posterior view, a superior view above a lateral view, two different bones/joints shown together), each of which could stand alone as its own spotter image?

If it is really just ONE photograph/view (even if the specimen itself is 3D and shows some depth, or has multiple small labeled sub-parts within one continuous photo), return {"multiView": false}.

If it genuinely contains 2 or more separate photographs, return the tight bounding box of EACH separate photograph, plus a short label for the specific view shown in that box (e.g. "Anterior view", "Posterior view", "Superior view", "Lateral view", "Medial view", "Right lateral view" — use standard anatomical view terms). Boxes must not overlap and must each be a single self-contained photo (exclude any shared caption/label text, arrows, or margins between the photos — crop tightly to just the specimen photo itself). Return as percentages of the full image width/height (0-100), (0,0)=top-left.

Return ONLY valid JSON:
{"multiView": true, "views": [{"label": string, "bbox": {"xPct": number, "yPct": number, "widthPct": number, "heightPct": number}}, ...]}
or
{"multiView": false}`;

async function classifySplit(dataUrl, title) {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a meticulous medical atlas image cataloguer. Output only valid JSON." },
      { role: "user", content: [{ type: "text", text: SPLIT_PROMPT.replace("{{TITLE}}", title) }, { type: "image_url", image_url: { url: dataUrl } }] },
    ],
  });
  try { return JSON.parse(completion.choices[0]?.message?.content || "{}"); } catch { return { multiView: false }; }
}

const LEAK_PROMPT = `This is a cropped photograph meant to be used as a "spot the structure" image in a medical viva exam. Does this image contain ANY visible text, labels, arrows, captions, or figure numbers anywhere (even a partial/cut-off letter or word at the edges) that could hint at the structure's identity? Ignore plain scale bars or generic unlabeled orientation letters not tied to naming. Return ONLY JSON: {"hasLeak": boolean, "leakDescription": string|null}`;

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

function cropCanvas(width, height, bbox, shrinkPct) {
  const cx = (bbox.xPct / 100) * width;
  const cy = (bbox.yPct / 100) * height;
  const cw = (bbox.widthPct / 100) * width;
  const ch = (bbox.heightPct / 100) * height;
  const sx = cw * shrinkPct;
  const sy = ch * shrinkPct;
  const x = Math.round(cx + sx);
  const y = Math.round(cy + sy);
  const w = Math.round(cw - sx * 2);
  const h = Math.round(ch - sy * 2);
  return { x: Math.max(0, x), y: Math.max(0, y), w: Math.max(10, Math.min(width - x, w)), h: Math.max(10, Math.min(height - y, h)) };
}

// Scoped to the osteology specimen rows whose titles explicitly say they
// combine multiple views into one photo (per the admin's request). The
// Radiology X-ray plates (already single-view per title) are excluded — a
// full-catalog test run showed the vision model hallucinating spurious
// duplicate "views" on those single genuine radiographs.
const TARGET_IDS = new Set([107, 108, 109, 111, 112, 115, 116, 117, 118, 119, 120, 121, 122, 124, 126, 129, 132, 135, 143]);

async function main() {
  const listResp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/list?category=Bone`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  if (!listResp.ok) { console.error("Failed to list Bone images:", listResp.status, await listResp.text()); process.exit(1); }
  const { images: allImages } = await listResp.json();
  const images = allImages.filter((r) => TARGET_IDS.has(r.id));
  console.log(`Found ${allImages.length} Bone images total, targeting ${images.length} known multi-view rows. DRY_RUN=${DRY_RUN}`);

  let split = 0, kept = 0, failed = 0;

  for (const row of images) {
    try {
      const imgResp = await fetch(`${API_BASE}/api/anatomy-viva-images/serve/${row.id}?token=${ADMIN_TOKEN}`);
      if (!imgResp.ok) { console.error(`id=${row.id} "${row.title}": fetch image FAILED ${imgResp.status}`); failed++; continue; }
      const rawBuffer = Buffer.from(await imgResp.arrayBuffer());
      const buffer = stripUnknownPngChunks(rawBuffer);
      const dataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
      const img = await loadImage(buffer);
      const width = img.width, height = img.height;

      const result = await classifySplit(dataUrl, row.title);
      if (!result.multiView || !Array.isArray(result.views) || result.views.length < 2) {
        console.log(`id=${row.id} "${row.title}": single view — keeping as-is`);
        kept++;
        continue;
      }

      console.log(`id=${row.id} "${row.title}": SPLITTING into ${result.views.length} views: ${result.views.map((v) => v.label).join(", ")}`);

      const newBuffers = [];
      for (const view of result.views) {
        if (!view.bbox || !view.bbox.widthPct) continue;
        let finalBuf = null;
        for (let attempt = 0; attempt < 4; attempt++) {
          const shrink = attempt === 0 ? 0 : 0.03 * attempt;
          const { x, y, w, h } = cropCanvas(width, height, view.bbox, shrink);
          const cropC = createCanvas(w, h);
          const ctx = cropC.getContext("2d");
          ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
          const buf = cropC.toBuffer("image/png");
          const leakDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
          const leak = await checkLeak(leakDataUrl);
          if (!leak.hasLeak) { finalBuf = buf; break; }
          console.log(`  "${view.label}" attempt ${attempt} leaked: ${leak.leakDescription}`);
        }
        // A view that keeps leaking text (e.g. a muscle-attachment diagram
        // panel with labels baked in) is dropped rather than failing the
        // whole row — partial success (the clean views) beats leaving the
        // entire combined image in place for exam use.
        if (finalBuf) newBuffers.push({ label: view.label, buf: finalBuf });
        else console.log(`  "${view.label}": dropped (could not produce a leak-free crop)`);
      }
      const allOk = true;

      if (newBuffers.length < 2) {
        console.error(`id=${row.id} "${row.title}": could not cleanly split all views — leaving original in place for manual review`);
        failed++;
        continue;
      }

      for (const { label, buf } of newBuffers) {
        fs.writeFileSync(path.join(OUT_DIR, `${row.id}_${label.replace(/\s+/g, "_")}.png`), buf);
      }

      if (!DRY_RUN) {
        for (const { label, buf } of newBuffers) {
          const baseTitle = row.title.replace(/,?\s*(anterior|posterior|superior|inferior|lateral|medial|various|multiple)([\w\s]*)?(and\s+\w+)?\s*views?\.?$/i, "").trim();
          const newTitle = `${baseTitle}, ${label}`;
          const insertResp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/manual`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
            body: JSON.stringify({
              category: "Bone",
              title: newTitle,
              side: row.side,
              region: row.region,
              notes: row.notes,
              sourceFileName: row.sourceFileName,
              sourcePage: row.sourcePage,
              imageBase64: buf.toString("base64"),
            }),
          });
          if (!insertResp.ok) { console.error(`  insert "${newTitle}" FAILED:`, insertResp.status, await insertResp.text()); allOk = false; }
        }
        if (allOk) {
          const delResp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/${row.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
          });
          console.log(`  replaced id=${row.id} -> ${newBuffers.length} new rows, old deleted (${delResp.status})`);
        }
      }
      split++;
    } catch (err) {
      console.error(`id=${row.id} "${row.title}": ERROR`, err?.message || err);
      failed++;
    }
  }

  console.log(`\nDone. split=${split} kept(single)=${kept} failed=${failed}`);
}

main();
