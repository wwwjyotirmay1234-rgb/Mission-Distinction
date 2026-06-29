import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { pdfsTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { updateStreak } from "../lib/streak";
import { stripHtml } from "../lib/sanitize";
import { awardXp, XP_VALUES } from "../lib/xp";
import { getGcsBucket } from "../lib/gcs";
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
 * Streams PDF bytes to the client so they can be cached in IndexedDB for
 * offline reading / download.
 *
 * Handles three URL types:
 *  1. /api/upload/pdf/serve/:fileName  → stream directly from GCS (no re-auth needed)
 *  2. drive.google.com                 → convert to direct usercontent download URL
 *  3. Any other HTTPS URL              → forward as-is
 */
router.get("/:id/proxy", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [pdf] = await db.select({ url: pdfsTable.url, title: pdfsTable.title })
      .from(pdfsTable).where(eq(pdfsTable.id, id));
    if (!pdf) { res.status(404).json({ error: "Not found" }); return; }

    const safeTitle = `${pdf.title.replace(/[^a-z0-9 ._-]/gi, "_")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(safeTitle)}"`);
    res.setHeader("Cache-Control", "private, max-age=86400");

    // ── Case 1: PDF stored in GCS — stream directly (no HTTP round-trip needed) ─
    const serveMatch = pdf.url.match(/\/api\/upload\/pdf\/serve\/([^?#]+)/);
    if (serveMatch) {
      try {
        const bucket = getGcsBucket();
        const fileRef = bucket.file(`pdfs/${serveMatch[1]}`);
        fileRef.createReadStream()
          .on("error", (err: any) => {
            if (!res.headersSent) res.status(502).json({ error: "GCS stream error" });
            else res.destroy(err);
          })
          .pipe(res);
      } catch {
        if (!res.headersSent) res.status(500).json({ error: "Storage not configured" });
      }
      return;
    }

    // ── Case 2: Google Drive — convert to direct usercontent download URL ───────
    let fetchUrl = pdf.url;
    const driveMatch = pdf.url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      fetchUrl = `https://drive.usercontent.google.com/download?id=${driveMatch[1]}&export=download&authuser=0&confirm=t`;
    }

    if (!isValidHttpsUrl(fetchUrl)) {
      res.status(422).json({ error: "PDF URL is not fetchable" });
      return;
    }

    // ── Case 3: Generic HTTPS URL ────────────────────────────────────────────────
    const upstream = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Mission-Distinction/1.0)",
        "Accept": "application/pdf,*/*",
      },
      redirect: "follow",
    });
    if (!upstream.ok) {
      res.status(502).json({ error: `Upstream returned ${upstream.status}` });
      return;
    }

    // Read the first chunk and verify it starts with %PDF (PDF magic bytes).
    // Google Drive sometimes returns an HTML warning/consent page instead of the
    // actual file — streaming that as application/pdf produces a corrupt download.
    const reader = upstream.body?.getReader();
    if (!reader) { res.status(502).json({ error: "No response body" }); return; }

    const first = await reader.read();
    if (first.done || !first.value || first.value.length === 0) {
      res.status(502).json({ error: "Empty response from upstream" });
      return;
    }

    // Check PDF magic bytes: %PDF
    const magic = String.fromCharCode(first.value[0], first.value[1], first.value[2], first.value[3]);
    if (magic !== "%PDF") {
      res.status(422).json({ error: "Upstream did not return a valid PDF. The file may be restricted or require a sign-in." });
      return;
    }

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    // Stream the first chunk + remainder
    res.write(first.value); // nosemgrep: javascript.express.security.audit.xss.direct-response-write -- binary PDF bytes piped from cloud storage, Content-Type is application/pdf, not HTML
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value); // nosemgrep: javascript.express.security.audit.xss.direct-response-write -- binary PDF bytes piped from cloud storage, Content-Type is application/pdf, not HTML
    }
    res.end();
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
