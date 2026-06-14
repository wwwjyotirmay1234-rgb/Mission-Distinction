import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable, quizAttemptsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const [users, attempts] = await Promise.all([
      db.select().from(usersTable),
      db.select().from(quizAttemptsTable),
    ]);

    const statsMap: Record<number, { totalPct: number; count: number }> = {};
    for (const a of attempts) {
      if (!statsMap[a.userId]) statsMap[a.userId] = { totalPct: 0, count: 0 };
      statsMap[a.userId].totalPct += a.percentage;
      statsMap[a.userId].count += 1;
    }

    const leaderboard = users
      .filter((u) => u.role === "student")
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        college: u.college || "",
        year: u.year || "",
        studyStreak: u.studyStreak || 0,
        quizzesAttempted: statsMap[u.id]?.count || 0,
        avgScore: statsMap[u.id]
          ? Math.round(statsMap[u.id].totalPct / statsMap[u.id].count)
          : 0,
        totalScore: statsMap[u.id] ? statsMap[u.id].totalPct : 0,
      }))
      .sort((a, b) => b.avgScore - a.avgScore || b.quizzesAttempted - a.quizzesAttempted);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
