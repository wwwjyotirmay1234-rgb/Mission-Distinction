import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizAttemptsTable, activityTable, notesTable, pdfsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const attempts = await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, user.id));
    const activity = await db.select().from(activityTable).where(eq(activityTable.userId, user.id));

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
      studyStreak: user.studyStreak || 0,
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
      .where(eq(activityTable.userId, user.id));
    res.json(activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
