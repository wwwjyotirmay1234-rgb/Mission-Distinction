import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { calendarEventsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const events = await db.select().from(calendarEventsTable).where(eq(calendarEventsTable.userId, user.id));
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

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, subject, startTime, endTime, color } = req.body;
    if (!title || !startTime || !endTime) { res.status(400).json({ error: "Missing fields" }); return; }
    const [event] = await db.insert(calendarEventsTable).values({
      userId: user.id,
      title,
      description: description || null,
      subject: subject || null,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      color: color || null,
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

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
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
