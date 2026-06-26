import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { notesTable, activityTable, xpTransactionsTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
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
    let notes = await db.select().from(notesTable).limit(500);
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
    const { title, subject, content, fileUrl, fileType } = req.body;
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
    }).returning();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [note] = await db.select().from(notesTable).where(eq(notesTable.id, id));
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
    const { title, subject, content, fileUrl, fileType } = req.body;
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
        updatedAt: new Date(),
      })
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
    const [note] = await db.select().from(notesTable).where(eq(notesTable.id, id));
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

export default router;
