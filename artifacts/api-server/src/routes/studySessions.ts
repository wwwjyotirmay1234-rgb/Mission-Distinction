import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { studySessionsTable } from "@workspace/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

// Log a session
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);
    const { subject, durationMinutes, sessionType } = req.body;
    if (!durationMinutes || durationMinutes < 1) { res.status(400).json({ error: "durationMinutes must be >= 1" }); return; }
    const [row] = await db.insert(studySessionsTable).values({
      userId,
      subject: subject || "General",
      durationMinutes: Math.min(durationMinutes, 720),
      sessionType: sessionType || "pomodoro",
    }).returning();
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to log session" }); }
});

// Get stats
router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = ((req as any).user.id as number);

    // Today
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);

    const [todayRow] = await db.select({ total: sql<number>`COALESCE(SUM(duration_minutes), 0)` })
      .from(studySessionsTable).where(and(eq(studySessionsTable.userId, userId), gte(studySessionsTable.createdAt, todayStart)));
    const [weekRow] = await db.select({ total: sql<number>`COALESCE(SUM(duration_minutes), 0)` })
      .from(studySessionsTable).where(and(eq(studySessionsTable.userId, userId), gte(studySessionsTable.createdAt, weekStart)));

    // By subject (all time)
    const bySubject = await db.select({
      subject: studySessionsTable.subject,
      total: sql<number>`SUM(duration_minutes)`,
    }).from(studySessionsTable).where(eq(studySessionsTable.userId, userId)).groupBy(studySessionsTable.subject);

    // Recent sessions
    const recent = await db.select().from(studySessionsTable).where(eq(studySessionsTable.userId, userId)).orderBy(desc(studySessionsTable.createdAt)).limit(10);

    res.json({
      todayMinutes: Number(todayRow?.total ?? 0),
      weekMinutes: Number(weekRow?.total ?? 0),
      bySubject,
      recent,
    });
  } catch { res.status(500).json({ error: "Failed to get stats" }); }
});

export { router as studySessionsRouter };
