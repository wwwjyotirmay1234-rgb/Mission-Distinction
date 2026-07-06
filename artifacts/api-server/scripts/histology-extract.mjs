import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const OPENAI_PKG = "/home/runner/workspace/node_modules/.pnpm/openai@6.44.0_ws@8.21.0_zod@3.25.76/node_modules/openai/index.js";
const { default: OpenAI } = await import(OPENAI_PKG);

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const PDF_PATH = process.argv[2];
const API_BASE = process.argv[3] || "http://localhost:8080";
const ADMIN_TOKEN = process.argv[4];
const START_PAGE = parseInt(process.argv[5] || "2", 10);
const END_PAGE = process.argv[6] ? parseInt(process.argv[6], 10) : null;
const DRY_RUN = process.argv.includes("--dry-run");
const SOURCE_FILE_NAME = path.basename(PDF_PATH);

if (!PDF_PATH || !ADMIN_TOKEN) {
  console.error("Usage: node histology-extract.mjs <pdfPath> <apiBase> <adminToken> [startPage] [endPage] [--dry-run]");
  process.exit(1);
}

async function loadPdfDocument(buffer) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(buffer);
  return pdfjsLib.getDocument({ data }).promise;
}

async function renderPage(doc, pageNum, scale) {
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return { canvas, width: canvas.width, height: canvas.height };
}

const PROMPT = `This is a single page from a histology slide study PDF for MBBS students titled "Histology Slides". Each page (if it's a real slide page) contains, at the TOP of the page: a raw, UNLABELED circular microscope photograph on the top-left with a solid black background around the circle, and SOMETIMES ALSO a second, labeled reference diagram (with arrows/text pointing to structures) to its right for comparison. Below both images is a colored title box naming the structure, then bullet-point notes.

Your job:
1. If this page is not a slide page (e.g. a cover/title page, or a plain instructional note page with no microscope photo), return {"isSlide": false}.
2. Otherwise, return the bounding box of the SOLID BLACK RECTANGLE background behind the raw unlabeled circular photo (top-left one) — NOT the labeled diagram (if present), NOT the title box, NOT any bullet text. This black rectangle has hard geometric edges that are easy to find precisely. Err on the side of being SLIGHTLY GENEROUS (a few extra percent on each side) rather than tight — it is much worse to cut into the circular photo or clip its edge than to include a little extra black margin or a sliver of white page background. Double check that your box's bottom edge is below the lowest point of the black rectangle, and the right edge is to the right of the rightmost point, before answering. Return as percentages of the full page image width/height (0-100), with (0,0) at top-left.
3. Read the title heading from the colored title box (e.g. "Trachea", "Liver", "Testis").
4. Summarize the bullet notes below into 1-3 concise sentences of key identifying features (notes field) — keep the medically important identifying facts, drop marketing/branding text.
5. Determine anatomical region if identifiable (e.g. "Head and Neck", "Thorax", "Abdomen", "Pelvis", "Generic" if not organ-specific), else null.

Return ONLY valid JSON:
{"isSlide": true, "title": string, "region": string|null, "notes": string, "bbox": {"xPct": number, "yPct": number, "widthPct": number, "heightPct": number}}
or
{"isSlide": false}`;

async function classifyPage(dataUrl) {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a meticulous medical histology atlas cataloguer. Output only valid JSON." },
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
  try { return JSON.parse(raw); } catch { return { isSlide: false }; }
}

async function main() {
  const buffer = fs.readFileSync(PDF_PATH);
  const doc = await loadPdfDocument(buffer);
  const lastPage = Math.min(END_PAGE || doc.numPages, doc.numPages);
  console.log(`PDF has ${doc.numPages} pages. Processing ${START_PAGE}-${lastPage}. DRY_RUN=${DRY_RUN}`);

  let inserted = 0, skipped = 0;

  for (let p = START_PAGE; p <= lastPage; p++) {
    try {
      const { canvas, width, height } = await renderPage(doc, p, 2.0);
      const fullDataUrl = `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`;
      const result = await classifyPage(fullDataUrl);

      if (!result.isSlide || !result.bbox || !result.title) {
        console.log(`Page ${p}: SKIP (not a slide page)`);
        skipped++;
        continue;
      }

      const { xPct, yPct, widthPct, heightPct } = result.bbox;
      const PAD_PCT = 0.015;
      const rawX = (xPct / 100) * width;
      const rawY = (yPct / 100) * height;
      const rawW = (widthPct / 100) * width;
      const rawH = (heightPct / 100) * height;
      const padX = rawW * PAD_PCT;
      const padY = rawH * PAD_PCT;
      const cropX = Math.max(0, Math.round(rawX - padX));
      const cropY = Math.max(0, Math.round(rawY - padY));
      const cropW = Math.min(width - cropX, Math.round(rawW + padX * 2));
      const cropH = Math.min(height - cropY, Math.round(rawH + padY * 2));

      if (cropW < 50 || cropH < 50) {
        console.log(`Page ${p}: SKIP (invalid bbox ${JSON.stringify(result.bbox)})`);
        skipped++;
        continue;
      }

      const img = await loadImage(canvas.toBuffer("image/png"));
      const cropCanvas = createCanvas(cropW, cropH);
      const cropCtx = cropCanvas.getContext("2d");
      cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      const croppedBuffer = cropCanvas.toBuffer("image/png");

      const outDir = "/tmp/histo_cropped";
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `page_${p}.png`), croppedBuffer);

      console.log(`Page ${p}: "${result.title}" — cropped ${cropW}x${cropH}`);

      if (!DRY_RUN) {
        const resp = await fetch(`${API_BASE}/api/anatomy-viva-images/admin/manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
          body: JSON.stringify({
            category: "Histology",
            title: result.title,
            side: null,
            region: result.region || null,
            notes: result.notes || null,
            sourceFileName: SOURCE_FILE_NAME,
            sourcePage: p,
            imageBase64: croppedBuffer.toString("base64"),
          }),
        });
        if (!resp.ok) {
          console.error(`Page ${p}: INSERT FAILED`, resp.status, await resp.text());
          skipped++;
          continue;
        }
      }
      inserted++;
    } catch (err) {
      console.error(`Page ${p}: ERROR`, err?.message || err);
      skipped++;
    }
  }

  console.log(`Done. Inserted=${inserted} Skipped=${skipped}`);
}

main();
