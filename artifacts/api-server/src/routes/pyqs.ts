import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { pyqsTable } from "@workspace/db";
import { eq, and, gte, count, or, isNull } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import { awardXp, XP_VALUES } from "../lib/xp";
import { xpTransactionsTable } from "@workspace/db";

const router = Router();

const pyqAiLimiter = rateLimit({ windowMs: 60_000, max: 8, standardHeaders: true, legacyHeaders: false });

function isValidHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch { return false; }
}

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, year, search, college } = req.query;
    const user = (req as any).user;
    const isAdmin = user?.role === "admin";

    const batchFilter = isAdmin
      ? undefined
      : user?.sessionYear
        ? or(isNull(pyqsTable.sessionYear), eq(pyqsTable.sessionYear, user.sessionYear))
        : isNull(pyqsTable.sessionYear);

    let pyqs = await db.select().from(pyqsTable).where(batchFilter).orderBy(pyqsTable.createdAt).limit(500);
    if (subject) pyqs = pyqs.filter(p => p.subject.toLowerCase() === (subject as string).toLowerCase());
    if (year) pyqs = pyqs.filter(p => p.year === (year as string));
    if (college) pyqs = pyqs.filter(p => (p as any).college === (college as string));
    if (search) pyqs = pyqs.filter(p => p.title.toLowerCase().includes((search as string).toLowerCase()));
    res.json(pyqs);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const isAdmin = user?.role === "admin";
    const batchCond = isAdmin
      ? eq(pyqsTable.id, id)
      : user?.sessionYear
        ? and(eq(pyqsTable.id, id), or(isNull(pyqsTable.sessionYear), eq(pyqsTable.sessionYear, user.sessionYear)))
        : and(eq(pyqsTable.id, id), isNull(pyqsTable.sessionYear));
    const [pyq] = await db.select().from(pyqsTable).where(batchCond);
    if (!pyq) { res.status(404).json({ error: "PYQ not found" }); return; }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const type = `pyq_read_${id}`;
    const [{ total }] = await db
      .select({ total: count() })
      .from(xpTransactionsTable)
      .where(and(
        eq(xpTransactionsTable.userId, user.id),
        eq(xpTransactionsTable.type, type),
        gte(xpTransactionsTable.createdAt, dayStart),
      ));

    if (Number(total) === 0) {
      awardXp(user.id, XP_VALUES.BOOK_READ, type, `Opened PYQ: ${pyq.title.slice(0, 60)}`).catch(() => {});
    }

    await db.update(pyqsTable)
      .set({ downloadCount: (pyq.downloadCount ?? 0) + 1 })
      .where(eq(pyqsTable.id, id));

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { title, subject, year, url, college, sessionYear } = req.body;
    if (!title || !subject || !year || !url) { res.status(400).json({ error: "Missing fields" }); return; }
    if (!isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    const safeTitle = stripHtml(String(title));
    const safeSubject = stripHtml(String(subject));
    const safeYear = stripHtml(String(year));
    const safeCollege = college ? stripHtml(String(college)) : "VIMSAR";
    if (!safeTitle || !safeSubject || !safeYear) { res.status(400).json({ error: "Invalid fields" }); return; }
    const [pyq] = await db.insert(pyqsTable).values({
      title: safeTitle, subject: safeSubject, year: safeYear, url,
      college: safeCollege,
      createdBy: admin.id,
      sessionYear: sessionYear || null,
    } as any).returning();
    res.status(201).json(pyq);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(pyqsTable).where(eq(pyqsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const { title, subject, year, url, college, sessionYear } = req.body;
    if (url && !isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    const updates: any = {};
    if (title !== undefined) updates.title = stripHtml(String(title));
    if (subject !== undefined) updates.subject = stripHtml(String(subject));
    if (year !== undefined) updates.year = stripHtml(String(year));
    if (url !== undefined) updates.url = url;
    if (college !== undefined) updates.college = stripHtml(String(college));
    if ("sessionYear" in req.body) updates.sessionYear = sessionYear || null;
    const [pyq] = await db.update(pyqsTable).set(updates).where(eq(pyqsTable.id, id)).returning();
    res.json(pyq);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(pyqsTable).where(eq(pyqsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(pyqsTable).where(eq(pyqsTable.id, id));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI topic search — removed (returns 503)
router.post("/:id/search-topic", authMiddleware, pyqAiLimiter, (_req: Request, res: Response) => {
  res.status(503).json({ error: "AI topic search is currently unavailable." });
});

// AI repeated-questions analysis — removed (returns 503)
router.post("/:id/repeated-questions", authMiddleware, pyqAiLimiter, (_req: Request, res: Response) => {
  res.status(503).json({ error: "AI question analysis is currently unavailable." });
});

// ── Admin: update topic tags ────────────────────────────────────────────────
router.patch("/:id/tags", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { tags } = req.body;
    if (!Array.isArray(tags) || tags.some((t: unknown) => typeof t !== "string")) {
      res.status(400).json({ error: "tags must be an array of strings" }); return;
    }
    const cleaned = (tags as string[]).map(t => t.trim().toLowerCase()).filter(Boolean);
    const [updated] = await db
      .update(pyqsTable)
      .set({ topicTags: cleaned })
      .where(eq(pyqsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "PYQ not found" }); return; }
    res.json(updated);
  } catch (err) {
    console.error("pyqs/tags error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
