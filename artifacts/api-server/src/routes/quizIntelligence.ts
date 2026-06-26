import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizAttemptsTable, quizzesTable, questionsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

// Overall quiz performance stats
router.get("/overview", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const quizStats = await db.select({
      quizId: quizzesTable.id,
      quizTitle: quizzesTable.title,
      subject: quizzesTable.subject,
      attempts: sql<number>`COUNT(${quizAttemptsTable.id})`,
      avgScore: sql<number>`ROUND(AVG(${quizAttemptsTable.percentage}))`,
      passCount: sql<number>`COUNT(CASE WHEN ${quizAttemptsTable.percentage} >= 60 THEN 1 END)`,
      failCount: sql<number>`COUNT(CASE WHEN ${quizAttemptsTable.percentage} < 60 THEN 1 END)`,
    })
    .from(quizzesTable)
    .leftJoin(quizAttemptsTable, eq(quizAttemptsTable.quizId, quizzesTable.id))
    .groupBy(quizzesTable.id, quizzesTable.title, quizzesTable.subject)
    .orderBy(desc(sql`COUNT(${quizAttemptsTable.id})`))
    .limit(50);

    const [totals] = await db.select({
      totalAttempts: sql<number>`COUNT(*)`,
      avgScore: sql<number>`ROUND(AVG(${quizAttemptsTable.percentage}))`,
      passRate: sql<number>`ROUND(AVG(CASE WHEN ${quizAttemptsTable.percentage} >= 60 THEN 100 ELSE 0 END))`,
    }).from(quizAttemptsTable);

    res.json({
      quizzes: quizStats.map(q => ({
        ...q,
        attempts: Number(q.attempts),
        avgScore: Number(q.avgScore ?? 0),
        passCount: Number(q.passCount),
        failCount: Number(q.failCount),
        passRate: Number(q.attempts) > 0 ? Math.round((Number(q.passCount) / Number(q.attempts)) * 100) : 0,
      })),
      totals: {
        totalAttempts: Number(totals?.totalAttempts ?? 0),
        avgScore: Number(totals?.avgScore ?? 0),
        passRate: Number(totals?.passRate ?? 0),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load quiz intelligence" });
  }
});

// Score distribution for a specific quiz
router.get("/quiz/:id/distribution", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const quizId = parseId(req.params.id);
    const attempts = await db.select({
      percentage: quizAttemptsTable.percentage,
      createdAt: quizAttemptsTable.createdAt,
    }).from(quizAttemptsTable).where(eq(quizAttemptsTable.quizId, quizId)).limit(500);

    const buckets: Record<string, number> = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    for (const a of attempts) {
      const p = Number(a.percentage ?? 0);
      if (p <= 20) buckets["0-20"]++;
      else if (p <= 40) buckets["21-40"]++;
      else if (p <= 60) buckets["41-60"]++;
      else if (p <= 80) buckets["61-80"]++;
      else buckets["81-100"]++;
    }

    res.json({ distribution: Object.entries(buckets).map(([range, count]) => ({ range, count })), totalAttempts: attempts.length });
  } catch { res.status(500).json({ error: "Failed to load distribution" }); }
});

// Feature usage stats
router.get("/feature-usage", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const [quizCount, doubtCount, confessionCount, roomCount, mnemonicCount] = await Promise.all([
      db.select({ c: sql<number>`COUNT(*)` }).from(quizAttemptsTable),
      db.execute(sql`SELECT COUNT(*) as c FROM doubts`),
      db.execute(sql`SELECT COUNT(*) as c FROM confessions`),
      db.execute(sql`SELECT COUNT(*) as c FROM study_rooms`),
      db.execute(sql`SELECT COUNT(*) as c FROM mnemonics`),
    ]);

    const aiResult = await db.execute(sql`SELECT COUNT(*) as c FROM activity WHERE type = 'ai'`).catch(() => null);
    const flashcardResult = await db.execute(sql`SELECT COUNT(*) as c FROM flashcard_decks`).catch(() => null);
    const aiCount = (aiResult as any)?.rows?.[0] ?? (aiResult as any)?.[0] ?? { c: 0 };
    const flashcardCount = (flashcardResult as any)?.rows?.[0] ?? (flashcardResult as any)?.[0] ?? { c: 0 };

    res.json([
      { feature: "Quiz Attempts", count: Number((quizCount[0] as any)?.c ?? 0), color: "#7c3aed" },
      { feature: "Doubts Posted", count: Number((doubtCount as any)?.rows?.[0]?.c ?? (doubtCount as any)?.[0]?.c ?? 0), color: "#2563eb" },
      { feature: "Study Rooms", count: Number((roomCount as any)?.rows?.[0]?.c ?? (roomCount as any)?.[0]?.c ?? 0), color: "#059669" },
      { feature: "Confessions", count: Number((confessionCount as any)?.rows?.[0]?.c ?? (confessionCount as any)?.[0]?.c ?? 0), color: "#d97706" },
      { feature: "Mnemonics", count: Number((mnemonicCount as any)?.rows?.[0]?.c ?? (mnemonicCount as any)?.[0]?.c ?? 0), color: "#dc2626" },
      { feature: "Flashcard Decks", count: Number((flashcardCount as any)?.c ?? 0), color: "#7c3aed" },
    ]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load feature usage" });
  }
});

// Engagement heatmap (activity per day, last 90 days)
router.get("/heatmap", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const rows = await db.execute(sql`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM activity
      WHERE created_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);

    res.json(Array.isArray(rows) ? rows : (rows as any).rows ?? []);
  } catch { res.status(500).json({ error: "Failed to load heatmap" }); }
});

// Student performance report
router.get("/student-report/:userId", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = parseId(req.params.userId);

    const [quizStats, recentAttempts, activityBreakdown] = await Promise.all([
      db.select({
        total: sql<number>`COUNT(*)`,
        avgScore: sql<number>`ROUND(AVG(${quizAttemptsTable.percentage}))`,
        best: sql<number>`MAX(${quizAttemptsTable.percentage})`,
        passed: sql<number>`COUNT(CASE WHEN ${quizAttemptsTable.percentage} >= 60 THEN 1 END)`,
      }).from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, userId)),

      db.select({
        score: quizAttemptsTable.score,
        total: quizAttemptsTable.total,
        percentage: quizAttemptsTable.percentage,
        createdAt: quizAttemptsTable.createdAt,
      }).from(quizAttemptsTable)
        .where(eq(quizAttemptsTable.userId, userId))
        .orderBy(desc(quizAttemptsTable.createdAt))
        .limit(10),

      db.execute(sql`
        SELECT type, COUNT(*) as count
        FROM activity WHERE user_id = ${userId}
        GROUP BY type ORDER BY count DESC
      `),
    ]);

    res.json({
      quizStats: {
        total: Number(quizStats[0]?.total ?? 0),
        avgScore: Number(quizStats[0]?.avgScore ?? 0),
        best: Number(quizStats[0]?.best ?? 0),
        passed: Number(quizStats[0]?.passed ?? 0),
      },
      recentAttempts,
      activityBreakdown: Array.isArray(activityBreakdown) ? activityBreakdown : (activityBreakdown as any).rows ?? [],
    });
  } catch { res.status(500).json({ error: "Failed to load student report" }); }
});

export { router as quizIntelligenceRouter };
