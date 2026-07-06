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
if (!ADMIN_TOKEN) {
  console.error("Usage: node viva-fix-crops.mjs <apiBase> <adminToken>");
  process.exit(1);
}

const OUT_DIR = "/tmp/viva_fixed";
fs.mkdirSync(OUT_DIR, { recursive: true });

// Each job: the flagged DB row to replace (or remove), the source PDF (GCS
// pdfs/ object filename, no prefix), and the page to re-render.
const JOBS = [
  { id: 93, category: "Histology", title: "Cerebellar Cortex", region: "Head and Neck", notes: null, srcFile: "1783338496432_HistologySlides_New_Updated_Version.pdf", srcPage: 46, mode: "circle" },
];

async function loadPdfDocument(buffer) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
}

async function renderPage(doc, pageNum, scale) {
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return { canvas, width: canvas.width, height: canvas.height };
}

function bboxPrompt(mode) {
  if (mode === "circle") {
    return `This page contains ONE (or more) circular microscope-photo images, possibly alongside labeled diagrams, captions, headers, or page text elsewhere on the page. Find the bounding box of the SINGLE raw, unlabeled circular microscope photograph (the real photo, not any labeled/illustrated diagram). Be STRICT and CONSERVATIVE: your box must NOT include any text, captions, headers, page numbers, or region-label text near the image — it is much better to crop slightly INSIDE the black circular border (losing a sliver of the photo edge) than to include even a fragment of a letter or word. Return as percentages of the page width/height (0-100), (0,0)=top-left.
Return ONLY JSON: {"xPct": number, "yPct": number, "widthPct": number, "heightPct": number}`;
  }
  if (mode === "circle_strict") {
    return `This page has ONE circular photograph, with a caption line directly BELOW it (e.g. "Fig. X.X: <name>") and possibly a page header/footer above/below. Find the bounding box of ONLY the circular photo's interior — the box's BOTTOM edge must stop well above the top of the caption text line, with a comfortable safety margin (at least 3% of page height) so absolutely no part of any letter is included. The box's TOP edge must likewise stay clearly below any page header/running title text. Left/right edges should hug the circle closely. It is fine and expected to crop away a thin sliver of the circle's own top/bottom edge if that's what it takes to fully exclude all text — prioritize zero text over completeness of the circle. Return as percentages of page width/height (0-100), (0,0)=top-left.
Return ONLY JSON: {"xPct": number, "yPct": number, "widthPct": number, "heightPct": number}`;
  }
  return `This page contains one or more real specimen PHOTOGRAPHS (not illustrations/diagrams), possibly alongside other diagrams, captions, or body text. Find the bounding box of the SINGLE clearest real photographic specimen image on the page. Be STRICT: exclude any caption, heading, page number, or other diagram/illustration on the page — crop tightly to just the photo itself with a small margin, never including any text. Return as percentages of page width/height (0-100), (0,0)=top-left.
Return ONLY JSON: {"xPct": number, "yPct": number, "widthPct": number, "heightPct": number}`;
}

async function getBbox(dataUrl, mode) {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a meticulous medical atlas image cropper. Output only valid JSON." },
      { role: "user", content: [{ type: "text", text: bboxPrompt(mode) }, { type: "image_url", image_url: { url: dataUrl } }] },
    ],
  });
  try { return JSON.parse(completion.choices[0]?.message?.content || "{}"); } catch { return null; }
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

function cropCanvas(fullCanvas, width, height, bbox, shrinkPct) {
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
  return { x: Math.max(0, x), y: Math.max(0, y), w: Math.max(10, w), h: Math.max(10, h) };
}

async function main() {
  const pdfCache = new Map();

  for (const job of JOBS) {
    console.log(`\n=== id=${job.id} "${job.title}" (${job.category}) mode=${job.mode} ===`);

    if (job.mode === "remove") {
      const del = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/${job.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      console.log(`Removed id=${job.id} (no salvageable photo on source page): ${del.status}`);
      continue;
    }

    let buffer = pdfCache.get(job.srcFile);
    if (!buffer) {
      const resp = await fetch(`${API_BASE}/api/upload/pdf/serve/${job.srcFile}?token=${ADMIN_TOKEN}`);
      if (!resp.ok) { console.error(`FAILED to download source ${job.srcFile}: ${resp.status}`); continue; }
      buffer = Buffer.from(await resp.arrayBuffer());
      pdfCache.set(job.srcFile, buffer);
    }

    const doc = await loadPdfDocument(buffer);
    const { canvas, width, height } = await renderPage(doc, job.srcPage, 3.0);
    const fullDataUrl = `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`;
    const fullImg = await loadImage(canvas.toBuffer("image/png"));

    const bbox = await getBbox(fullDataUrl, job.mode);
    if (!bbox || !bbox.widthPct) { console.error(`No bbox returned for id=${job.id}`); continue; }

    let finalBuffer = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const shrink = attempt === 0 ? 0 : 0.03 * attempt;
      const { x, y, w, h } = cropCanvas(canvas, width, height, bbox, shrink);
      const cropC = createCanvas(w, h);
      const ctx = cropC.getContext("2d");
      ctx.drawImage(fullImg, x, y, w, h, 0, 0, w, h);
      const buf = cropC.toBuffer("image/png");
      const dataUrl = `data:image/png;base64,${buf.toString("base64")}`;
      const leak = await checkLeak(dataUrl);
      console.log(`  attempt ${attempt} (shrink=${shrink}): hasLeak=${leak.hasLeak} ${leak.leakDescription || ""}`);
      if (!leak.hasLeak) { finalBuffer = buf; break; }
    }

    if (!finalBuffer) {
      console.error(`  Could not produce a clean crop for id=${job.id} after retries — leaving old image in place for manual review.`);
      continue;
    }

    fs.writeFileSync(path.join(OUT_DIR, `${job.id}_fixed.png`), finalBuffer);

    const insertResp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
      body: JSON.stringify({
        category: job.category,
        title: job.title,
        side: null,
        region: job.region,
        notes: job.notes,
        sourceFileName: job.srcFile,
        sourcePage: job.srcPage,
        imageBase64: finalBuffer.toString("base64"),
      }),
    });
    if (!insertResp.ok) { console.error(`  Insert failed for id=${job.id}:`, insertResp.status, await insertResp.text()); continue; }

    const delResp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/${job.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    console.log(`  Replaced id=${job.id} -> new row inserted, old deleted (${delResp.status})`);
  }

  console.log("\nDone.");
}

main();
