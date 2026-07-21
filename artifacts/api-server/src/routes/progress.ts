import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizAttemptsTable, activityTable } from "@workspace/db";
import { eq, desc, gte, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { updateStreak } from "../lib/streak";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const [attempts, activity, freshStreak] = await Promise.all([
      db.select().from(quizAttemptsTable)
        .where(eq(quizAttemptsTable.userId, user.id))
        .limit(500),
      db.select().from(activityTable)
        .where(eq(activityTable.userId, user.id))
        .limit(500),
      updateStreak(user.id),
    ]);

    const quizzesAttempted = attempts.length;
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : 0;

    const subjectMap: Record<string, { total: number; count: number }> = {};
    attempts.forEach(a => {
      if (!subjectMap[a.subject]) subjectMap[a.subject] = { total: 0, count: 0 };
      subjectMap[a.subject].total += a.percentage;
      subjectMap[a.subject].count += 1;
    });

    const subjectProgress = Object.entries(subjectMap).map(([subject, { total, count }]) => ({
      subject,
      percentage: Math.round(total / count),
    }));

    res.json({
      notesCompleted: activity.filter(a => a.type === "note").length,
      pdfsDownloaded: activity.filter(a => a.type === "pdf").length,
      quizzesAttempted,
      studyStreak: freshStreak,
      studyHoursWeek: Math.round(activity.length * 0.5 * 10) / 10,
      avgScore,
      subjectProgress,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activity", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const activity = await db.select().from(activityTable)
      .where(eq(activityTable.userId, user.id))
      .orderBy(desc(activityTable.createdAt))
      .limit(20);
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/progress/heatmap
 * Returns daily activity counts for the past 16 weeks (112 days).
 * Response: { "2026-06-01": 5, "2026-06-02": 2, ... }
 */
router.get("/heatmap", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const since = new Date(Date.now() - 112 * 24 * 60 * 60 * 1000);
    const activity = await db
      .select({ createdAt: activityTable.createdAt })
      .from(activityTable)
      .where(and(eq(activityTable.userId, user.id), gte(activityTable.createdAt, since)));

    const dayMap: Record<string, number> = {};
    for (const a of activity) {
      const day = a.createdAt.toISOString().split("T")[0];
      dayMap[day] = (dayMap[day] || 0) + 1;
    }
    res.json(dayMap);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
