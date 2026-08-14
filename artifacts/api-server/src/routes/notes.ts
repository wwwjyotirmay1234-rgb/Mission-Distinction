import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { notesTable, activityTable, xpTransactionsTable } from "@workspace/db";
import { eq, and, gte, count, or, isNull, inArray } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import { updateStreak } from "../lib/streak";
import { awardXp, XP_VALUES } from "../lib/xp";
import rateLimit from "express-rate-limit";

const router = Router();

// Max 30 note-read pings per hour per user (prevents XP spam)
const noteReadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 2000 : 30,
  keyGenerator: (req) => `note-read-${(req as any).user?.id ?? req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many note reads. Please slow down." },
  skip: () => false,
});

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, search } = req.query;
    const user = (req as any).user;
    const isAdmin = user?.role === "admin";

    const batchFilter = isAdmin
      ? undefined
      : user?.year
        ? or(isNull(notesTable.sessionYear), eq(notesTable.sessionYear, user.year))
        : isNull(notesTable.sessionYear);

    let notes = await db.select().from(notesTable).where(batchFilter).limit(500);
    if (subject) notes = notes.filter(n => n.subject.toLowerCase() === (subject as string).toLowerCase());
    if (search) notes = notes.filter(n => n.title.toLowerCase().includes((search as string).toLowerCase()));
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { title, subject, content, fileUrl, fileType, sessionYear } = req.body;
    if (!title || !subject) { res.status(400).json({ error: "Title and subject are required." }); return; }
    if (!content && !fileUrl) { res.status(400).json({ error: "Either text content or a file upload is required." }); return; }
    const safeTitle = stripHtml(String(title));
    const safeSubject = stripHtml(String(subject));
    if (!safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (!safeSubject) { res.status(400).json({ error: "Invalid subject" }); return; }
    const [note] = await db.insert(notesTable).values({
      title: safeTitle,
      subject: safeSubject,
      content: content || null,
      fileUrl: fileUrl || null,
      fileType: fileType || (content ? "text" : null),
      createdBy: admin.id,
      sessionYear: sessionYear || null,
    } as any).returning();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const user = (req as any).user;
    const isAdmin = user?.role === "admin";
    const batchCond = isAdmin
      ? eq(notesTable.id, id)
      : user?.year
        ? and(eq(notesTable.id, id), or(isNull(notesTable.sessionYear), eq(notesTable.sessionYear, user.year)))
        : and(eq(notesTable.id, id), isNull(notesTable.sessionYear));
    const [note] = await db.select().from(notesTable).where(batchCond);
    if (!note) { res.status(404).json({ error: "Not found" }); return; }
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(notesTable).where(eq(notesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.createdBy !== null && existing.createdBy !== admin.id) {
      res.status(403).json({ error: "You can only edit notes you created" }); return;
    }
    const { title, subject, content, fileUrl, fileType, sessionYear } = req.body;
    const safeTitle = title !== undefined ? stripHtml(String(title)) : undefined;
    const safeSubject = subject !== undefined ? stripHtml(String(subject)) : undefined;
    if (safeTitle !== undefined && !safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (safeSubject !== undefined && !safeSubject) { res.status(400).json({ error: "Invalid subject" }); return; }
    const [note] = await db.update(notesTable)
      .set({
        title: safeTitle,
        subject: safeSubject,
        content: content !== undefined ? (content || null) : existing.content,
        fileUrl: fileUrl !== undefined ? (fileUrl || null) : existing.fileUrl,
        fileType: fileType !== undefined ? (fileType || null) : existing.fileType,
        ...("sessionYear" in req.body ? { sessionYear: sessionYear || null } : {}),
        updatedAt: new Date(),
      } as any)
      .where(eq(notesTable.id, id))
      .returning();
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(notesTable).where(eq(notesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.createdBy !== null && existing.createdBy !== admin.id) {
      res.status(403).json({ error: "You can only delete notes you created" }); return;
    }
    await db.delete(notesTable).where(eq(notesTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/read", authMiddleware, noteReadLimiter, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const user = (req as any).user;
    const isAdmin = user?.role === "admin";
    const batchCond = isAdmin
      ? eq(notesTable.id, id)
      : user?.year
        ? and(eq(notesTable.id, id), or(isNull(notesTable.sessionYear), eq(notesTable.sessionYear, user.year)))
        : and(eq(notesTable.id, id), isNull(notesTable.sessionYear));
    const [note] = await db.select().from(notesTable).where(batchCond);
    if (!note) { res.status(404).json({ error: "Not found" }); return; }

    // Always update streak — reading a note is study activity regardless of XP cap
    await updateStreak(user.id);

    // Award XP at most 10 times per day across all notes (prevents farming)
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const [{ total }] = await db
      .select({ total: count() })
      .from(xpTransactionsTable)
      .where(and(
        eq(xpTransactionsTable.userId, user.id),
        eq(xpTransactionsTable.type, "note_read"),
        gte(xpTransactionsTable.createdAt, dayStart),
      ));

    const xpAwarded = Number(total) < 10;
    if (xpAwarded) {
      awardXp(user.id, XP_VALUES.NOTE_READ, "note_read", `Read note: ${note.title}`).catch(() => {});
    }

    // Log activity once per day per note to keep activity feed clean
    const [{ total: actTotal }] = await db
      .select({ total: count() })
      .from(activityTable)
      .where(and(
        eq(activityTable.userId, user.id),
        eq(activityTable.type, "note"),
        gte(activityTable.createdAt, dayStart),
      ));

    // Allow up to 10 activity log entries per day (one per unique note per day)
    if (Number(actTotal) < 20) {
      await db.insert(activityTable).values({ userId: user.id, type: "note", description: `Read note: ${note.title}` });
    }

    res.json({ ok: true, xpAwarded });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: bulk set academic year ────────────────────────────────────────────
router.patch("/bulk-year", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { ids, sessionYear } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "ids array required" }); return;
    }
    const year = sessionYear === "shared" ? null : String(sessionYear);
    await db.update(notesTable).set({ sessionYear: year } as any).where(inArray(notesTable.id, ids.map(Number)));
    res.json({ updated: ids.length });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: bulk-duplicate all notes from one batch to another ────────────────
router.post("/bulk-duplicate", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { fromBatch, toBatch } = req.body;
    if (!fromBatch || !toBatch) { res.status(400).json({ error: "fromBatch and toBatch are required" }); return; }
    const fromYear = fromBatch === "shared" ? null : String(fromBatch);
    const toYear   = toBatch   === "shared" ? null : String(toBatch);
    if (fromYear === toYear) { res.status(400).json({ error: "Source and target batch must be different" }); return; }

    const sources = await db.select().from(notesTable)
      .where(fromYear ? eq(notesTable.sessionYear, fromYear) : isNull(notesTable.sessionYear));

    const existingInTarget = await db
      .select({ title: notesTable.title, subject: notesTable.subject })
      .from(notesTable)
      .where(toYear ? eq(notesTable.sessionYear, toYear) : isNull(notesTable.sessionYear));
    const existingKeys = new Set(existingInTarget.map(e => `${e.subject}|||${e.title}`));

    let copied = 0, skipped = 0;
    for (const source of sources) {
      if (existingKeys.has(`${source.subject}|||${source.title}`)) { skipped++; continue; }
      await db.insert(notesTable).values({
        title: source.title, subject: source.subject, content: source.content,
        fileUrl: source.fileUrl, fileType: source.fileType,
        createdBy: admin.id, sessionYear: toYear,
      } as any);
      copied++;
    }
    res.json({ copied, skipped, total: sources.length });
  } catch (err) {
    console.error("bulk duplicate notes error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: duplicate note ────────────────────────────────────────────────────
router.post("/:id/duplicate", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { sessionYear } = req.body;
    const safeSessionYear = sessionYear === "shared" ? null : (sessionYear || null);

    const [source] = await db.select().from(notesTable).where(eq(notesTable.id, id));
    if (!source) { res.status(404).json({ error: "Not found" }); return; }

    const [note] = await db.insert(notesTable).values({
      title: `${source.title} (Copy)`,
      subject: source.subject,
      content: source.content,
      fileUrl: source.fileUrl,
      fileType: source.fileType,
      createdBy: admin.id,
      sessionYear: safeSessionYear,
    } as any).returning();
    res.status(201).json(note);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
