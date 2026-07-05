import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "@workspace/db";
import { vivaSourcesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

export { router as vivaSourcesRouter };
