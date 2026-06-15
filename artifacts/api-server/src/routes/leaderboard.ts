import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable, quizAttemptsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { getCache, setCache } from "../lib/cache";

const router = Router();

const CACHE_KEY = "leaderboard:all";
const CACHE_TTL_MS = 5 * 60 * 1000;

router.get("/", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const cached = getCache<{ topScorers: unknown[]; streakLeaders: unknown[] }>(CACHE_KEY);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.json(cached);
      return;
    }

    const [scoreStats, streakStats] = await Promise.all([
      db
        .select({
          userId: quizAttemptsTable.userId,
          avgScore: sql<number>`ROUND(AVG(${quizAttemptsTable.percentage}))`.as("avg_score"),
          quizzesAttempted: sql<number>`COUNT(*)`.as("quizzes_attempted"),
        })
        .from(quizAttemptsTable)
        .groupBy(quizAttemptsTable.userId)
        .orderBy(desc(sql`avg_score`))
        .limit(50),

      db
        .select({
          id: usersTable.id,
          fullName: usersTable.fullName,
          college: usersTable.college,
          year: usersTable.year,
          studyStreak: usersTable.studyStreak,
        })
        .from(usersTable)
        .where(eq(usersTable.role, "student"))
        .orderBy(desc(usersTable.studyStreak))
        .limit(20),
    ]);

    const userIds = scoreStats.map((s) => s.userId);
    const studentProfiles =
      userIds.length > 0
        ? await db
            .select({
              id: usersTable.id,
              fullName: usersTable.fullName,
              college: usersTable.college,
              year: usersTable.year,
              studyStreak: usersTable.studyStreak,
            })
            .from(usersTable)
            .where(eq(usersTable.role, "student"))
        : [];

    const profileMap = new Map(studentProfiles.map((u) => [u.id, u]));

    const topScorers = scoreStats
      .map((s) => {
        const profile = profileMap.get(s.userId);
        if (!profile) return null;
        return {
          id: profile.id,
          fullName: profile.fullName,
          college: profile.college || "",
          year: profile.year || "",
          studyStreak: profile.studyStreak || 0,
          quizzesAttempted: Number(s.quizzesAttempted),
          avgScore: Number(s.avgScore),
        };
      })
      .filter(Boolean)
      .slice(0, 20);

    const streakLeaders = streakStats.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      college: u.college || "",
      year: u.year || "",
      studyStreak: u.studyStreak || 0,
      quizzesAttempted: 0,
      avgScore: 0,
    }));

    const result = { topScorers, streakLeaders };
    setCache(CACHE_KEY, result, CACHE_TTL_MS);
    res.setHeader("X-Cache", "MISS");
    res.json(result);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
