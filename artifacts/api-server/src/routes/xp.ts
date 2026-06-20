import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { xpTransactionsTable, rankUnlocksTable, usersTable } from "@workspace/db/schema";
import { eq, desc, and, count, gte } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { XP_RANKS, XP_VALUES, awardXp, getRankForXp, getNextRank } from "../lib/xp";
import rateLimit from "express-rate-limit";

const activityLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  keyGenerator: (req) => String((req as any).user?.id ?? req.ip),
  message: { error: "Too many XP activity requests. Slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const ACTIVITY_DAILY_LIMITS: Record<string, number> = {
  stopwatch_session: 6,
  alarm_used: 4,
};

const router = Router();

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const [user] = await db
      .select({ totalXp: usersTable.totalXp, currentRank: usersTable.currentRank })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    const xp = user?.totalXp ?? 0;
    const currentRank = getRankForXp(xp);
    const nextRank = getNextRank(xp);

    const progressPercent = nextRank
      ? Math.min(100, Math.round(((xp - currentRank.min) / (nextRank.min - currentRank.min)) * 100))
      : 100;

    const recentHistory = await db
      .select()
      .from(xpTransactionsTable)
      .where(eq(xpTransactionsTable.userId, userId))
      .orderBy(desc(xpTransactionsTable.createdAt))
      .limit(20);

    res.json({
      totalXp: xp,
      currentRankLevel: currentRank.level,
      currentRankName: currentRank.name,
      nextRankName: nextRank?.name ?? null,
      nextRankMin: nextRank?.min ?? null,
      progressPercent,
      recentHistory,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaderboard", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        college: usersTable.college,
        year: usersTable.year,
        totalXp: usersTable.totalXp,
        currentRank: usersTable.currentRank,
        studyStreak: usersTable.studyStreak,
      })
      .from(usersTable)
      .where(eq(usersTable.role, "student"))
      .orderBy(desc(usersTable.totalXp))
      .limit(50);

    const result = users.map(u => ({
      ...u,
      totalXp: u.totalXp ?? 0,
      currentRank: u.currentRank ?? 1,
      rankName: getRankForXp(u.totalXp ?? 0).name,
    }));

    res.json(result);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const history = await db
      .select()
      .from(xpTransactionsTable)
      .where(eq(xpTransactionsTable.userId, userId))
      .orderBy(desc(xpTransactionsTable.createdAt))
      .limit(50);
    res.json(history);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/ranks", authMiddleware, async (_req: Request, res: Response) => {
  res.json(XP_RANKS);
});

router.post("/activity", authMiddleware, activityLimiter, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { type } = req.body;
    const ALLOWED: Record<string, { amount: number; description: string }> = {
      stopwatch_session: { amount: XP_VALUES.STOPWATCH_SESSION, description: "Completed a stopwatch session (5+ min)" },
      alarm_used: { amount: XP_VALUES.ALARM_USED, description: "Used the study alarm" },
    };
    const entry = ALLOWED[type];
    if (!entry) { res.status(400).json({ error: "Invalid activity type" }); return; }

    const dailyLimit = ACTIVITY_DAILY_LIMITS[type] ?? 0;
    if (dailyLimit > 0) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      const [{ total }] = await db
        .select({ total: count() })
        .from(xpTransactionsTable)
        .where(and(
          eq(xpTransactionsTable.userId, userId),
          eq(xpTransactionsTable.type, type),
          gte(xpTransactionsTable.createdAt, dayStart),
        ));
      if ((total ?? 0) >= dailyLimit) {
        res.json({ rankUp: false, newRankName: null, newXp: 0, limitReached: true });
        return;
      }
    }

    const result = await awardXp(userId, entry.amount, type, entry.description);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as xpRouter };
