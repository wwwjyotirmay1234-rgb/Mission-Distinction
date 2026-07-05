import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { anatomyVivaImagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { adminMiddleware, pdfAuthMiddleware } from "../middlewares/auth";
import { gcsClient } from "../lib/gcs";
import { loadPdfDocument, renderPageRangeFromDoc } from "./aiDoubt";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ANATOMY_IMAGE_CATEGORIES, isAnatomyImageCategory } from "../lib/anatomyVivaImages";

const router = Router();

// Every book the admin has already uploaded via "Manage PDFs" lives under this
// GCS prefix (see upload.ts's pdf/request-upload-url). Extraction reuses those
// files directly instead of requiring a separate re-upload flow, per the
// user's note that all required books are already in the system.
const PDF_PREFIX = "pdfs/";
const IMAGE_PREFIX = "anatomy-viva-images/";

// Bounded per-PDF page cap for cost/latency, consistent with the OCR-fallback
// cap used for scanned-book RAG ingestion (vivaSources.ts).
const MAX_PAGES_PER_PDF = 150;
const CLASSIFY_BATCH_PAGES = 4;
const CLASSIFY_CONCURRENCY = 3;

function sseHeaders(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

function sendEvent(res: Response, payload: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

// Admin: list PDFs already uploaded to the shared bucket, so the admin can
// pick which book(s) to run through automatic image extraction.
router.get("/admin/available-pdfs", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Storage not configured" }); return; }
    const bucket = gcsClient.bucket(bucketId);
    const [files] = await bucket.getFiles({ prefix: PDF_PREFIX });
    const pdfs = files
      .filter((f) => f.name.toLowerCase().endsWith(".pdf"))
      .map((f) => ({
        objectName: f.name,
        displayName: f.name.slice(PDF_PREFIX.length).replace(/^\d+_/, ""),
        size: Number(f.metadata.size ?? 0),
        updated: f.metadata.updated ?? null,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    res.json({ pdfs });
  } catch (err: any) {
    console.error("Anatomy viva images: available-pdfs error", err);
    res.status(500).json({ error: err?.message || "Failed to list available PDFs" });
  }
});

// Admin: list extracted images, optionally filtered by category, newest first.
router.get("/admin/list", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === "string" ? req.query.category : null;
    const rows = category && isAnatomyImageCategory(category)
      ? await db.select().from(anatomyVivaImagesTable).where(eq(anatomyVivaImagesTable.category, category)).orderBy(desc(anatomyVivaImagesTable.createdAt))
      : await db.select().from(anatomyVivaImagesTable).orderBy(desc(anatomyVivaImagesTable.createdAt));
    res.json({ images: rows });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to list images" });
  }
});

// Admin: delete an image (removes both the DB row and the GCS object).
router.delete("/admin/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const [row] = await db.select().from(anatomyVivaImagesTable).where(eq(anatomyVivaImagesTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (bucketId) {
      try {
        await gcsClient.bucket(bucketId).file(row.objectName).delete();
      } catch (err: any) {
        console.error("Anatomy viva images: GCS delete failed (continuing)", err?.message || err);
      }
    }
    await db.delete(anatomyVivaImagesTable).where(eq(anatomyVivaImagesTable.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to delete image" });
  }
});

// Serve an extracted image (used both by the admin gallery and by the
// student's live viva session). Mirrors upload.ts's pdf/serve pattern:
// pdfAuthMiddleware accepts ?token= since <img> tags can't set headers.
router.get("/serve/:id", pdfAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) { res.status(404).end(); return; }
    const [row] = await db.select().from(anatomyVivaImagesTable).where(eq(anatomyVivaImagesTable.id, id));
    if (!row) { res.status(404).end(); return; }
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).end(); return; }
    const fileRef = gcsClient.bucket(bucketId).file(row.objectName);
    const stream = fileRef.createReadStream();
    // GCS stream errors surface asynchronously via 'error', not a sync throw —
    // without this handler an unhandled stream error crashes the whole server.
    stream.on("error", (err: any) => {
      console.error("Anatomy viva image serve stream error:", err?.message || err);
      if (!res.headersSent) res.status(err?.code === 404 ? 404 : 500).end();
      else res.destroy();
    });
    stream.on("response", () => {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    });
    stream.pipe(res);
  } catch (err) {
    console.error("Anatomy viva image serve error:", err);
    if (!res.headersSent) res.status(404).end();
  }
});

interface ClassifiedPage {
  page: number;
  category: string;
  title: string;
  side: string | null;
  region: string | null;
  notes: string | null;
}

async function classifyBatch(pdfDoc: any, fileName: string, start: number, end: number): Promise<ClassifiedPage[]> {
  const images = await renderPageRangeFromDoc(pdfDoc, start, end);
  const pageNumbers = Array.from({ length: images.length }, (_, i) => start + i);
  const prompt = `These are pages ${start}-${end} (in order) of an MBBS Anatomy reference book/atlas titled "${fileName}". For EACH page image, decide if it is a genuine specimen/plate/photograph suitable for a practical viva spotter station — NOT a page of plain body text, a table of contents, an index, or a line-drawing textbook diagram with lots of labels/text overlaid.

If it qualifies, classify it into exactly ONE of these categories:
- "Histology": a microscope slide / histology section image.
- "Bone": a photograph of an isolated bone or bone specimen.
- "Visceral": a photograph of a thoracic or abdominal internal organ specimen.
- "Section Anatomy": a photograph of a sagittal/cross-sectional cut (e.g. pelvis, brain, head-neck sections).
- "Prosection": a cadaveric dissection/prosection photograph of limb muscles, nerves, vessels, or other dissected structures.

If the page does not qualify as any of the above (plain text, diagrams, tables, cover pages, etc.), use category "none".

For qualifying pages only, also determine:
- title: concise specific identification (e.g. "Right Femur", "Kidney (coronal section)", "Median nerve, cubital fossa").
- side: "Right", "Left", "Bilateral", "Median", or null if not applicable/not determinable.
- region: the anatomical region (e.g. "Upper Limb", "Thorax", "Pelvis", "Head and Neck", "Abdomen", "Lower Limb", "Brain").
- notes: 1-3 sentences of key identifying facts a viva examiner would want to know about this exact structure (distinguishing features, key relations, embryological origin where relevant).

Return ONLY valid JSON: { "pages": [ { "page": number, "category": string, "title": string|null, "side": string|null, "region": string|null, "notes": string|null } ] } with one entry per input page, page numbers matching: ${pageNumbers.join(", ")}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a meticulous medical anatomy atlas cataloguer. Output only valid JSON." },
        {
          role: "user",
          content: [
            { type: "text" as const, text: prompt },
            ...images.map((img) => ({ type: "image_url" as const, image_url: { url: img } })),
          ] as any,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const pages = Array.isArray(parsed.pages) ? parsed.pages : [];
    return pages
      .filter((p: any) => typeof p?.page === "number" && typeof p?.category === "string")
      .map((p: any) => ({
        page: p.page,
        category: p.category,
        title: typeof p.title === "string" ? p.title : "",
        side: typeof p.side === "string" ? p.side : null,
        region: typeof p.region === "string" ? p.region : null,
        notes: typeof p.notes === "string" ? p.notes : null,
      }));
  } catch (err: any) {
    console.error(`Anatomy viva extraction: batch ${start}-${end} failed`, err?.message || err);
    return [];
  }
}

// Admin: run automatic extraction+classification+labeling over selected
// already-uploaded PDFs. Fully automatic, no review gate — accepted pages are
// inserted as soon as classified, per the admin's stated preference.
router.post("/admin/extract", adminMiddleware, async (req: Request, res: Response) => {
  const objectNames = Array.isArray(req.body?.objectNames) ? req.body.objectNames.filter((n: any) => typeof n === "string") : [];
  if (objectNames.length === 0) {
    res.status(400).json({ error: "objectNames (array of GCS pdf object names) is required" });
    return;
  }
  const admin = (req as any).user;
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) { res.status(500).json({ error: "Storage not configured" }); return; }

  sseHeaders(res);
  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  try {
    for (const objectName of objectNames) {
      const sourceFileName = objectName.slice(PDF_PREFIX.length).replace(/^\d+_/, "");
      sendEvent(res, { type: "file_start", fileName: sourceFileName });
      try {
        const bucket = gcsClient.bucket(bucketId);
        const [buffer] = await bucket.file(objectName).download();
        const pdfDoc = await loadPdfDocument(buffer);
        const pagesToRead = Math.min(pdfDoc.numPages, MAX_PAGES_PER_PDF);
        const numBatches = Math.ceil(pagesToRead / CLASSIFY_BATCH_PAGES);
        const batchRanges = Array.from({ length: numBatches }, (_, b) => {
          const start = b * CLASSIFY_BATCH_PAGES + 1;
          const end = Math.min(start + CLASSIFY_BATCH_PAGES - 1, pagesToRead);
          return { start, end };
        });

        let processedPages = 0;
        await mapWithConcurrency(batchRanges, CLASSIFY_CONCURRENCY, async ({ start, end }) => {
          const classified = await classifyBatch(pdfDoc, sourceFileName, start, end);
          for (const page of classified) {
            if (!isAnatomyImageCategory(page.category) || !page.title) {
              totalSkipped++;
              continue;
            }
            try {
              const [fullResImage] = await renderPageRangeFromDoc(pdfDoc, page.page, page.page);
              const base64 = fullResImage.split(",")[1];
              const imgBuffer = Buffer.from(base64, "base64");
              const imgObjectName = `${IMAGE_PREFIX}${Date.now()}_${page.page}_${sourceFileName.replace(/[^a-zA-Z0-9._-]/g, "_")}.png`;
              await bucket.file(imgObjectName).save(imgBuffer, { metadata: { contentType: "image/png" } });
              await db.insert(anatomyVivaImagesTable).values({
                category: page.category,
                title: page.title,
                side: page.side,
                region: page.region,
                notes: page.notes,
                objectName: imgObjectName,
                sourceFileName,
                sourcePage: page.page,
                createdBy: admin?.id ?? null,
              });
              totalInserted++;
            } catch (insertErr: any) {
              console.error("Anatomy viva extraction: failed to save page", page.page, insertErr?.message || insertErr);
              totalSkipped++;
            }
          }
          processedPages += (end - start + 1);
          sendEvent(res, { type: "progress", fileName: sourceFileName, processedPages, totalPages: pagesToRead });
        });

        sendEvent(res, { type: "file_done", fileName: sourceFileName, pagesRead: pagesToRead, totalPagesInFile: pdfDoc.numPages });
      } catch (fileErr: any) {
        console.error("Anatomy viva extraction: file failed", objectName, fileErr?.message || fileErr);
        errors.push(`${sourceFileName}: ${fileErr?.message || "failed"}`);
        sendEvent(res, { type: "file_error", fileName: sourceFileName, error: fileErr?.message || "Failed to process this file" });
      }
    }

    sendEvent(res, { type: "complete", inserted: totalInserted, skipped: totalSkipped, errors });
  } catch (err: any) {
    console.error("Anatomy viva extraction error:", err);
    sendEvent(res, { type: "error", error: err?.message || "Extraction failed" });
  } finally {
    res.end();
  }
});

export { router as anatomyVivaImagesRouter, ANATOMY_IMAGE_CATEGORIES };
