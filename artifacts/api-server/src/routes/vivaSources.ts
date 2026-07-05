import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "@workspace/db";
import { vivaSourcesTable, vivaSourceDocumentsTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { adminMiddleware } from "../middlewares/auth";
import { stripHtml } from "../lib/sanitize";
import { VIVA_SUBJECTS } from "./practicalHub";
import { extractPdfBuffer } from "./aiDoubt";

const router = Router();

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

// Admin: upload one or more full reference book/textbook PDFs for a subject
// in a single request (up to MAX_BOOK_FILES_PER_REQUEST at once, to cut down
// on round-trips for bulk uploads). The FULL extracted text of each file is
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
        const { text, pages, warning } = await extractPdfBuffer(file.buffer);
        const cleaned = stripHtml(text).trim();
        if (!cleaned) {
          failed.push({
            fileName: file.originalname,
            error: warning || "No extractable text was found in this PDF (it may be scanned/image-only).",
          });
          continue;
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
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete book" });
  }
});

export { router as vivaSourcesRouter };
