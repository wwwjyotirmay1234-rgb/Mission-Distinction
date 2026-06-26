import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { pdfsTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { updateStreak } from "../lib/streak";
import { stripHtml } from "../lib/sanitize";
import { awardXp, XP_VALUES } from "../lib/xp";
import rateLimit from "express-rate-limit";

const router = Router();

const downloadCountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 500 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many download count increments for this PDF. Try again later." },
  keyGenerator: (req) => `pdf-dl-${(req as any).user?.id}-${req.params.id}`,
});

function isValidHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch { return false; }
}


/** Normalize "1st Year" / "1st Year MBBS" → "1st", "2nd Year" → "2nd" etc. */
function normalizeYear(y: string | null | undefined): string {
  if (!y) return "";
  return y.trim().toLowerCase().replace(/\s+year(\s+mbbs)?$/i, "").trim();
}

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, professor, search } = req.query;
    const userYear = normalizeYear((req as any).user?.year);

    let pdfs = await db.select().from(pdfsTable).limit(500);

    // Year filter: show PDFs with no year set (available to all) OR matching user's year
    if (userYear) {
      pdfs = pdfs.filter(p => !p.year || normalizeYear(p.year) === userYear);
    }

    if (subject) pdfs = pdfs.filter(p => p.subject.toLowerCase() === (subject as string).toLowerCase());
    if (professor) pdfs = pdfs.filter(p => p.professor?.toLowerCase().includes((professor as string).toLowerCase()));
    if (search) {
      const q = (search as string).toLowerCase();
      pdfs = pdfs.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        (p.professor?.toLowerCase().includes(q) ?? false)
      );
    }
    res.json(pdfs);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { title, subject, professor, year, url, thumbnailUrl, pages, size } = req.body;
    if (!title || !subject || !url) { res.status(400).json({ error: "Missing fields" }); return; }
    if (!isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    if (thumbnailUrl && !isValidHttpsUrl(thumbnailUrl)) {
      res.status(400).json({ error: "thumbnailUrl must be a valid HTTPS URL" }); return;
    }
    const safeTitle = stripHtml(String(title));
    const safeSubject = stripHtml(String(subject));
    const safeProfessor = professor ? stripHtml(String(professor)) : null;
    const safeYear = year ? stripHtml(String(year)) : null;
    if (!safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (!safeSubject) { res.status(400).json({ error: "Invalid subject" }); return; }
    const [pdf] = await db.insert(pdfsTable).values({
      title: safeTitle, subject: safeSubject, professor: safeProfessor, year: safeYear,
      url, thumbnailUrl, pages, size,
      createdBy: admin.id,
    }).returning();
    res.status(201).json(pdf);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [pdf] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));
    if (!pdf) { res.status(404).json({ error: "Not found" }); return; }
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.createdBy !== null && existing.createdBy !== admin.id) {
      res.status(403).json({ error: "You can only edit PDFs you uploaded" }); return;
    }
    const { title, subject, professor, year, url, thumbnailUrl, pages, size } = req.body;
    if (url && !isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    if (thumbnailUrl && !isValidHttpsUrl(thumbnailUrl)) {
      res.status(400).json({ error: "thumbnailUrl must be a valid HTTPS URL" }); return;
    }
    const safeTitle = title !== undefined ? stripHtml(String(title)) : undefined;
    const safeSubject = subject !== undefined ? stripHtml(String(subject)) : undefined;
    const safeProfessor = professor !== undefined ? (professor ? stripHtml(String(professor)) : null) : undefined;
    const safeYear = year !== undefined ? (year ? stripHtml(String(year)) : null) : undefined;
    if (safeTitle !== undefined && !safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (safeSubject !== undefined && !safeSubject) { res.status(400).json({ error: "Invalid subject" }); return; }
    const thumbnailVal = thumbnailUrl !== undefined ? (thumbnailUrl || null) : undefined;
    const [pdf] = await db.update(pdfsTable)
      .set({ title: safeTitle, subject: safeSubject, professor: safeProfessor, year: safeYear, url, thumbnailUrl: thumbnailVal, pages, size })
      .where(eq(pdfsTable.id, id))
      .returning();
    res.json(pdf);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/download", authMiddleware, downloadCountLimiter, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const user = (req as any).user;
    const [pdf] = await db
      .update(pdfsTable)
      .set({ downloadCount: sql`${pdfsTable.downloadCount} + 1` })
      .where(eq(pdfsTable.id, id))
      .returning();
    if (!pdf) { res.status(404).json({ error: "Not found" }); return; }
    await db.insert(activityTable).values({
      userId: user.id,
      type: "pdf",
      description: `Downloaded PDF: ${pdf.title}`,
    });
    await updateStreak(user.id);
    awardXp(user.id, XP_VALUES.PDF_DOWNLOAD, "pdf_download", `Downloaded PDF: ${pdf.title}`).catch(() => {});
    res.json({ downloadCount: pdf.downloadCount });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/pdfs/:id/proxy
 * Server-side fetch of the PDF bytes — avoids browser CORS restrictions on
 * Google Drive / Cloudinary URLs so the client can store them in IndexedDB
 * for offline reading.
 */
router.get("/:id/proxy", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [pdf] = await db.select({ url: pdfsTable.url, title: pdfsTable.title })
      .from(pdfsTable).where(eq(pdfsTable.id, id));
    if (!pdf) { res.status(404).json({ error: "Not found" }); return; }
    if (!isValidHttpsUrl(pdf.url)) { res.status(422).json({ error: "PDF URL is not fetchable" }); return; }

    const upstream = await fetch(pdf.url, {
      headers: { "User-Agent": "Mozilla/5.0 Mission-Distinction-Offline-Cache/1.0" },
    });
    if (!upstream.ok) {
      res.status(502).json({ error: `Upstream returned ${upstream.status}` });
      return;
    }

    const contentType = upstream.headers.get("content-type") ?? "application/pdf";
    const contentLength = upstream.headers.get("content-length");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(pdf.title)}.pdf"`);
    res.setHeader("Cache-Control", "private, max-age=86400");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    const reader = upstream.body?.getReader();
    if (!reader) { res.status(502).json({ error: "No response body" }); return; }

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value); // nosemgrep: javascript.express.security.audit.xss.direct-response-write -- binary PDF bytes piped from cloud storage, Content-Type is application/pdf, not HTML
      }
      res.end();
    };
    await pump();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: "Failed to proxy PDF" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (!admin.isSuperAdmin && existing.createdBy !== null && existing.createdBy !== admin.id) {
      res.status(403).json({ error: "You can only delete PDFs you uploaded" }); return;
    }
    await db.delete(pdfsTable).where(eq(pdfsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
