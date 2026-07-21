import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "@workspace/db";
import { vivaSourcesTable, vivaSourceDocumentsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { adminMiddleware } from "../middlewares/auth";
import { stripHtml } from "../lib/sanitize";
//import { VIVA_SUBJECTS, invalidateBookChunkCache } from "./practicalHub";
//import { extractPdfBuffer, loadPdfDocument, renderPageRangeFromDoc } from "./aiDoubt";
import { gcsClient } from "../lib/gcs";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const REPLIT_SIDECAR = "http://127.0.0.1:1106";

// Reference books can run to several hundred MB — far above the Replit
// proxy's body-size limit for requests routed through the Node server (the
// old multipart bookUpload path below silently failed for anything above
// ~100MB even though multer itself allowed 500MB, because the request never
// made it past the proxy). Large files must go browser → GCS directly via a
// signed URL, bypassing the proxy entirely; the server then streams the
// object back down from GCS for text extraction. See upload.ts's
// signPdfUploadURL for the same pattern used elsewhere in this codebase.
async function signBookUploadURL(bucketId: string, objectName: string): Promise<string> {
  const body = {
    bucket_name: bucketId,
    object_name: objectName,
    method: "PUT",
    // Matched to upload.ts's signPdfUploadURL window — 15-30min was too tight for
    // large textbook PDFs on slower connections, causing the signed URL to expire
    // mid-upload once files got much past ~200MB.
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
  const resp = await fetch(`${REPLIT_SIDECAR}/object-storage/signed-object-url`, { // nosemgrep: react-insecure-request
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) throw new Error(`Sidecar returned ${resp.status}`);
  const { signed_url } = (await resp.json()) as { signed_url: string };
  return signed_url;
}

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed."));
  },
});

// Full textbooks are much bigger than PDFs used for quick notes, so allow a
// much larger upload for the book-library endpoint specifically. Multiple
// files can be selected/uploaded in a single request to cut down on
// round-trips when an admin is bulk-adding a subject's reference shelf.
const MAX_BOOK_FILES_PER_REQUEST = 10;
const bookUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024, files: MAX_BOOK_FILES_PER_REQUEST },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed."));
  },
});

// A 1000-1500 page medical textbook runs ~1-1.5M extracted characters (based
// on real uploads averaging ~850 chars/page). The default extractPdfBuffer
// cap (350k chars, tuned for ~140-page PYQ compilations) would silently chop
// off most of a full textbook, so book-library uploads get a much larger cap.
// Gold-standard references like Gray's Anatomy run 2000+ dense pages and can
// exceed even several million characters — per the schema's design intent
// (viva_source_documents.full_text is meant to be unbounded; only the
// per-question RAG excerpt in practicalHub.ts is cost/latency-bounded, not
// storage), this cap is set high enough to act only as a sanity ceiling
// against corrupt/pathological PDFs, never as a real-world truncation limit.
const BOOK_MAX_TEXT_CHARS = 20_000_000;

// Scanned/image-only reference books (very common for older/photocopied
// textbooks — this is also *why* those uploads are huge in the first place:
// raster page images with no embedded text layer) used to be rejected
// outright with a 422 here, even though aiDoubt.ts/pyqs.ts already have an
// established vision-OCR fallback for exactly this case. Read up to this many
// pages via vision so large-but-scanned books still produce usable RAG text
// instead of failing every time. Higher than PYQ's 20-page cap (books are
// much longer) but bounded to keep upload latency/cost reasonable.
const BOOK_SCANNED_MAX_PAGES = 150;
const BOOK_SCANNED_BATCH_PAGES = 6;
const BOOK_SCANNED_BATCH_CONCURRENCY = 3;

// Some scanned/image-only PDFs still have a sliver of embedded text (page
// numbers, running headers, a stray caption) that slips past the `!cleaned`
// check below, so extractPdfBuffer "succeeds" with near-zero real content
// (e.g. Osteology.pdf: 178 chars over 39 pages, Radiology.pdf: 795 chars
// over 21 pages — both silently skipped OCR and produced useless grounding
// text). Treat anything averaging under this many chars/page as effectively
// scanned and route it through OCR too.
const MIN_AVG_CHARS_PER_PAGE = 40;

function isEffectivelyScanned(cleaned: string, pages: number | null | undefined): boolean {
  if (!cleaned) return true;
  if (!pages) return false;
  return cleaned.length / pages < MIN_AVG_CHARS_PER_PAGE;
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

// Transcribes a scanned/image-only book PDF page-by-page via vision calls
// (small batches, bounded concurrency) and returns the concatenated text as
// if it had been extracted normally, so it flows through the same
// fullText/charCount persistence + RAG-lite chunking as text-based PDFs.
async function ocrScannedBook(
  buffer: Buffer,
  totalPages: number,
  subject: string,
  fileName: string,
): Promise<{ text: string; warning?: string }> {
  const pagesToRead = Math.min(totalPages, BOOK_SCANNED_MAX_PAGES);
  const pdfDoc = await loadPdfDocument(buffer);
  const numBatches = Math.ceil(pagesToRead / BOOK_SCANNED_BATCH_PAGES);
  const batchRanges = Array.from({ length: numBatches }, (_, b) => {
    const start = b * BOOK_SCANNED_BATCH_PAGES + 1;
    const end = Math.min(start + BOOK_SCANNED_BATCH_PAGES - 1, pagesToRead);
    return { start, end };
  });

  const batchResults = await mapWithConcurrency(batchRanges, BOOK_SCANNED_BATCH_CONCURRENCY, async ({ start, end }) => {
    try {
      const images = await renderPageRangeFromDoc(pdfDoc, start, end);
      const prompt = `These are pages ${start}-${end} of a scanned ${subject} reference textbook titled "${fileName}". Transcribe the readable text content of these pages as accurately as possible, preserving headings and paragraph structure. Skip pure decorative elements (page borders, publisher logos) but include all body text, tables (as plain text), and captions. Return ONLY the transcribed text — no commentary, no markdown code fences.`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.1,
        messages: [
          { role: "system", content: "You are a meticulous medical-textbook transcriptionist. Output only the transcribed text." },
          {
            role: "user",
            content: [
              { type: "text" as const, text: prompt },
              ...images.map((img) => ({ type: "image_url" as const, image_url: { url: img } })),
            ] as any,
          },
        ],
      });
      const content = completion.choices[0]?.message?.content?.trim() ?? "";
      return { text: content, warning: null as string | null };
    } catch (batchErr: any) {
      return { text: "", warning: `pages ${start}-${end}: ${batchErr?.message || "request failed"}` };
    }
  });

  const text = batchResults.map((r) => r.text).filter(Boolean).join("\n\n");
  const batchWarnings = batchResults.map((r) => r.warning).filter((w): w is string => !!w);
  const warnings: string[] = [];
  if (pagesToRead < totalPages) {
    warnings.push(`This is a large scanned book (${totalPages} pages) — only the first ${pagesToRead} pages were read via OCR.`);
  }
  if (batchWarnings.length) {
    warnings.push(`Some pages could not be read: ${batchWarnings.join("; ")}`);
  }
  return { text, warning: warnings.length ? warnings.join(" ") : undefined };
}

// Grounding notes are injected into every viva examiner prompt, so cap
// extracted PDF text well below the raw 8000-char sourceText limit to leave
// room for the admin's own notes to be appended alongside it.
const MAX_PDF_EXTRACT_CHARS = 6000;

// Admin: list source notes for all subjects (fills in subjects with no row yet)
router.get("/", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(vivaSourcesTable);
    const bySubject = new Map(rows.map((r) => [r.subject, r]));
    const result = VIVA_SUBJECTS.map((subject) => {
      const row = bySubject.get(subject);
      return {
        subject,
        sourceText: row?.sourceText ?? "",
        updatedAt: row?.updatedAt ?? null,
      };
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to load source notes" });
  }
});

// Admin: upsert source notes for a subject
router.put("/:subject", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const subject = String(req.params.subject);
    if (!(VIVA_SUBJECTS as readonly string[]).includes(subject)) {
      res.status(400).json({ error: `subject must be one of ${VIVA_SUBJECTS.join(", ")}` });
      return;
    }
    const safeSourceText = stripHtml(String(req.body?.sourceText ?? "")).trim().slice(0, 8000) || null;

    const [existing] = await db.select().from(vivaSourcesTable).where(eq(vivaSourcesTable.subject, subject));
    const [saved] = existing
      ? await db
          .update(vivaSourcesTable)
          .set({ sourceText: safeSourceText, updatedBy: admin.id, updatedAt: new Date() })
          .where(eq(vivaSourcesTable.subject, subject))
          .returning()
      : await db
          .insert(vivaSourcesTable)
          .values({ subject, sourceText: safeSourceText, updatedBy: admin.id })
          .returning();

    res.json(saved);
  } catch {
    res.status(500).json({ error: "Failed to save source notes" });
  }
});

// Admin: extract text from an uploaded PDF (textbook/reference) for grounding.
// Does NOT persist anything — returns the extracted text so the admin can
// review/edit it in the notes textarea before saving via PUT /:subject.
router.post("/extract-pdf", adminMiddleware, (req: Request, res: Response, next) => {
  pdfUpload.single("file")(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ error: err.message || "Upload failed." });
      return;
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    const { text, pages, warning } = await extractPdfBuffer(req.file.buffer);
    const cleaned = stripHtml(text).trim();
    if (!cleaned) {
      res.status(422).json({ error: warning || "No extractable text was found in this PDF (it may be scanned/image-only)." });
      return;
    }
    const truncated = cleaned.length > MAX_PDF_EXTRACT_CHARS;
    const safeText = truncated
      ? cleaned.slice(0, MAX_PDF_EXTRACT_CHARS) + `\n\n[Truncated at ${MAX_PDF_EXTRACT_CHARS.toLocaleString()} characters]`
      : cleaned;
    res.json({ text: safeText, pages, truncated });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Failed to extract text from PDF." });
  }
});

// Admin: list uploaded reference books for a subject (metadata only — full
// text can be large, so it's never sent to the admin UI's list view).
router.get("/:subject/documents", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const subject = String(req.params.subject);
    if (!(VIVA_SUBJECTS as readonly string[]).includes(subject)) {
      res.status(400).json({ error: `subject must be one of ${VIVA_SUBJECTS.join(", ")}` });
      return;
    }
    const rows = await db
      .select({
        id: vivaSourceDocumentsTable.id,
        fileName: vivaSourceDocumentsTable.fileName,
        charCount: vivaSourceDocumentsTable.charCount,
        pages: vivaSourceDocumentsTable.pages,
        createdAt: vivaSourceDocumentsTable.createdAt,
      })
      .from(vivaSourceDocumentsTable)
      .where(eq(vivaSourceDocumentsTable.subject, subject))
      .orderBy(asc(vivaSourceDocumentsTable.createdAt));
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to load uploaded books" });
  }
});

// Admin: get a signed URL so the browser can upload a large book PDF
// directly to GCS, bypassing the Replit proxy's request body-size limit
// entirely (that limit — not multer's 500MB config — was the real reason
// uploads over roughly 100MB were failing).
router.post("/:subject/documents/request-upload-url", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const subject = String(req.params.subject);
    if (!(VIVA_SUBJECTS as readonly string[]).includes(subject)) {
      res.status(400).json({ error: `subject must be one of ${VIVA_SUBJECTS.join(", ")}` });
      return;
    }
    const rawName = String(req.body?.fileName ?? "book.pdf");
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      res.status(500).json({ error: "Storage not configured" });
      return;
    }
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectName = `viva-books-tmp/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
    const signedUrl = await signBookUploadURL(bucketId, objectName);
    res.json({ signedUrl, objectName, fileName: rawName });
  } catch (err: any) {
    console.error("Book upload-url error:", err);
    res.status(500).json({ error: "Failed to prepare upload. Please try again." });
  }
});

// Admin: extract + persist a book that was already uploaded directly to GCS
// via the signed URL above. Downloads the object into memory, runs the same
// extraction pipeline as the legacy multipart endpoint, then deletes the
// temp GCS object — only the extracted text is kept long-term (see
// vivaSourceDocumentsTable, which has no fileUrl column).
router.post("/:subject/documents/process-uploaded", adminMiddleware, async (req: Request, res: Response) => {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  const objectName = String(req.body?.objectName ?? "");
  const fileName = String(req.body?.fileName ?? "book.pdf");
  let fileRef: ReturnType<ReturnType<typeof gcsClient.bucket>["file"]> | null = null;
  try {
    const admin = (req as any).user;
    const subject = String(req.params.subject);
    if (!(VIVA_SUBJECTS as readonly string[]).includes(subject)) {
      res.status(400).json({ error: `subject must be one of ${VIVA_SUBJECTS.join(", ")}` });
      return;
    }
    if (!bucketId) {
      res.status(500).json({ error: "Storage not configured" });
      return;
    }
    if (!objectName || !objectName.startsWith("viva-books-tmp/")) {
      res.status(400).json({ error: "Invalid upload reference." });
      return;
    }

    const bucket = gcsClient.bucket(bucketId);
    fileRef = bucket.file(objectName);
    const [buffer] = await fileRef.download();

    const { text, pages, warning } = await extractPdfBuffer(buffer, BOOK_MAX_TEXT_CHARS);
    let cleaned = stripHtml(text).trim();
    let ocrWarning: string | undefined;
    if (isEffectivelyScanned(cleaned, pages) && pages) {
      // Scanned/image-only PDF — extractPdfBuffer already detected this and
      // gave up. Fall back to reading the pages via vision OCR instead of
      // rejecting the upload outright (this is why "large book" uploads kept
      // failing: scanned books are the ones most likely to be huge files).
      const ocrResult = await ocrScannedBook(buffer, pages, subject, fileName);
      cleaned = stripHtml(ocrResult.text).trim();
      ocrWarning = ocrResult.warning;
    }
    if (!cleaned) {
      res.status(422).json({
        error: ocrWarning || warning || "No extractable text was found in this PDF (it may be scanned/image-only).",
      });
      return;
    }
    const truncated = cleaned.length > BOOK_MAX_TEXT_CHARS;
    if (truncated) {
      cleaned = cleaned.slice(0, BOOK_MAX_TEXT_CHARS) + `\n\n[Truncated at ${BOOK_MAX_TEXT_CHARS.toLocaleString()} characters]`;
    }

    const [row] = await db
      .insert(vivaSourceDocumentsTable)
      .values({
        subject,
        fileName: fileName.slice(0, 255),
        fullText: cleaned,
        charCount: cleaned.length,
        pages: pages || null,
        createdBy: admin.id,
      })
      .returning({
        id: vivaSourceDocumentsTable.id,
        fileName: vivaSourceDocumentsTable.fileName,
        charCount: vivaSourceDocumentsTable.charCount,
        pages: vivaSourceDocumentsTable.pages,
        createdAt: vivaSourceDocumentsTable.createdAt,
      });

    invalidateBookChunkCache(subject as (typeof VIVA_SUBJECTS)[number]);
    res.json({ saved: row, warning: ocrWarning });
  } catch (err: any) {
    console.error("Book process-uploaded error:", err);
    res.status(400).json({ error: err?.message || "Failed to process this file." });
  } finally {
    if (fileRef) {
      fileRef.delete({ ignoreNotFound: true }).catch((err: any) => {
        console.error("Failed to clean up temp book upload:", objectName, err?.message || err);
      });
    }
  }
});

// Admin: upload one or more full reference book/textbook PDFs for a subject
// in a single request (up to MAX_BOOK_FILES_PER_REQUEST at once, to cut down
// on round-trips for bulk uploads). Kept for small files (well under the
// proxy body-size limit) — the frontend now prefers the direct-to-GCS flow
// above for anything large. The FULL extracted text of each file is
// stored (no small truncation) so the AI examiner can draw on every part of
// the book — see practicalHub.ts's excerpt-retrieval helper for how relevant
// sections are pulled into each viva question's prompt without dumping the
// entire book into every AI call. Files are processed sequentially (not in
// parallel) to keep peak memory usage bounded for very large PDFs.
router.post("/:subject/documents", adminMiddleware, (req: Request, res: Response, next) => {
  bookUpload.array("files", MAX_BOOK_FILES_PER_REQUEST)(req, res, (err: any) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "One of the files is larger than the 500MB limit."
          : err.code === "LIMIT_FILE_COUNT"
            ? `You can upload at most ${MAX_BOOK_FILES_PER_REQUEST} files at once.`
            : err.message || "Upload failed.";
      res.status(400).json({ error: message });
      return;
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const subject = String(req.params.subject);
    if (!(VIVA_SUBJECTS as readonly string[]).includes(subject)) {
      res.status(400).json({ error: `subject must be one of ${VIVA_SUBJECTS.join(", ")}` });
      return;
    }
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const saved: Array<{ id: number; fileName: string; charCount: number; pages: number | null; createdAt: Date }> = [];
    const failed: Array<{ fileName: string; error: string }> = [];

    for (const file of files) {
      try {
        const { text, pages, warning } = await extractPdfBuffer(file.buffer, BOOK_MAX_TEXT_CHARS);
        let cleaned = stripHtml(text).trim();
        if (isEffectivelyScanned(cleaned, pages) && pages) {
          const ocrResult = await ocrScannedBook(file.buffer, pages, subject, file.originalname);
          cleaned = stripHtml(ocrResult.text).trim();
        }
        if (!cleaned) {
          failed.push({
            fileName: file.originalname,
            error: warning || "No extractable text was found in this PDF (it may be scanned/image-only).",
          });
          continue;
        }
        if (cleaned.length > BOOK_MAX_TEXT_CHARS) {
          cleaned = cleaned.slice(0, BOOK_MAX_TEXT_CHARS) + `\n\n[Truncated at ${BOOK_MAX_TEXT_CHARS.toLocaleString()} characters]`;
        }
        const [row] = await db
          .insert(vivaSourceDocumentsTable)
          .values({
            subject,
            fileName: file.originalname.slice(0, 255),
            fullText: cleaned,
            charCount: cleaned.length,
            pages: pages || null,
            createdBy: admin.id,
          })
          .returning({
            id: vivaSourceDocumentsTable.id,
            fileName: vivaSourceDocumentsTable.fileName,
            charCount: vivaSourceDocumentsTable.charCount,
            pages: vivaSourceDocumentsTable.pages,
            createdAt: vivaSourceDocumentsTable.createdAt,
          });
        saved.push(row);
      } catch (err: any) {
        failed.push({ fileName: file.originalname, error: err?.message || "Failed to process this file." });
      }
    }

    if (saved.length === 0) {
      res.status(422).json({ error: failed[0]?.error || "Failed to upload book(s).", failed });
      return;
    }
    invalidateBookChunkCache(subject as (typeof VIVA_SUBJECTS)[number]);
    res.json({ saved, failed });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || "Failed to upload book(s)." });
  }
});

// Admin: delete an uploaded reference book
router.delete("/:subject/documents/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const subject = String(req.params.subject);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid document id" });
      return;
    }
    await db
      .delete(vivaSourceDocumentsTable)
      .where(and(eq(vivaSourceDocumentsTable.id, id), eq(vivaSourceDocumentsTable.subject, subject)));
    invalidateBookChunkCache(subject as (typeof VIVA_SUBJECTS)[number]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete book" });
  }
});

export { router as vivaSourcesRouter };
