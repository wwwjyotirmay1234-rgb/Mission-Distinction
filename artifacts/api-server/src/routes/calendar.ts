import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { calendarEventsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import rateLimit from "express-rate-limit";

const router = Router();

const MAX_EVENTS_PER_USER = 200;

const calendarWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: "Too many calendar requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const events = await db
      .select()
      .from(calendarEventsTable)
      .where(eq(calendarEventsTable.userId, user.id))
      .limit(200);
    res.json(events.map(e => ({
      ...e,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
      createdAt: e.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authMiddleware, calendarWriteLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, subject, startTime, endTime, color } = req.body;
    if (!title || !startTime || !endTime) {
      res.status(400).json({ error: "title, startTime and endTime are required" }); return;
    }

    const start = parseDate(startTime);
    const end = parseDate(endTime);
    if (!start) { res.status(400).json({ error: "startTime is not a valid date" }); return; }
    if (!end) { res.status(400).json({ error: "endTime is not a valid date" }); return; }
    if (end <= start) { res.status(400).json({ error: "endTime must be after startTime" }); return; }

    const safeTitle = stripHtml(String(title));
    if (!safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (safeTitle.length > 200) { res.status(400).json({ error: "Title must be under 200 characters" }); return; }
    const safeDescription = description ? stripHtml(String(description)) : null;
    const safeSubject = subject ? stripHtml(String(subject)) : null;
    const safeColor = color ? stripHtml(String(color)).slice(0, 20) : null;

    const [{ total }] = await db
      .select({ total: count() })
      .from(calendarEventsTable)
      .where(eq(calendarEventsTable.userId, user.id));
    if (Number(total) >= MAX_EVENTS_PER_USER) {
      res.status(400).json({ error: `Calendar event limit reached (max ${MAX_EVENTS_PER_USER})` }); return;
    }

    const [event] = await db.insert(calendarEventsTable).values({
      userId: user.id,
      title: safeTitle,
      description: safeDescription,
      subject: safeSubject,
      startTime: start,
      endTime: end,
      color: safeColor,
    }).returning();
    res.status(201).json({
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      createdAt: event.createdAt.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", authMiddleware, calendarWriteLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid event ID" }); return; }
    const [existing] = await db.select().from(calendarEventsTable)
      .where(and(eq(calendarEventsTable.id, id), eq(calendarEventsTable.userId, user.id)));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    const { title, description, subject, startTime, endTime, color } = req.body;
    const start = startTime ? parseDate(startTime) : undefined;
    const end = endTime ? parseDate(endTime) : undefined;
    if (startTime && !start) { res.status(400).json({ error: "startTime is not a valid date" }); return; }
    if (endTime && !end) { res.status(400).json({ error: "endTime is not a valid date" }); return; }
    if (start && end && end <= start) { res.status(400).json({ error: "endTime must be after startTime" }); return; }

    const safeTitle = title !== undefined ? stripHtml(String(title)) : undefined;
    if (safeTitle !== undefined && !safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }

    const [event] = await db.update(calendarEventsTable).set({
      title: safeTitle,
      description: description !== undefined ? (description ? stripHtml(String(description)) : null) : undefined,
      subject: subject !== undefined ? (subject ? stripHtml(String(subject)) : null) : undefined,
      startTime: start ?? undefined,
      endTime: end ?? undefined,
      color: color !== undefined ? (color ? stripHtml(String(color)).slice(0, 20) : null) : undefined,
    }).where(and(eq(calendarEventsTable.id, id), eq(calendarEventsTable.userId, user.id))).returning();
    res.json({ ...event, startTime: event.startTime.toISOString(), endTime: event.endTime.toISOString(), createdAt: event.createdAt.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authMiddleware, calendarWriteLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid event ID" }); return; }
    await db.delete(calendarEventsTable).where(and(eq(calendarEventsTable.id, id), eq(calendarEventsTable.userId, user.id)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
