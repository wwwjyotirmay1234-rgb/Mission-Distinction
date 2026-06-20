import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { xpTransactionsTable, rankUnlocksTable, usersTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { XP_RANKS, getRankForXp, getNextRank } from "../lib/xp";

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

export { router as xpRouter };
