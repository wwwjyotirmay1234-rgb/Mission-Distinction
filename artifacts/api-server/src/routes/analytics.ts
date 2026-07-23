import { Router, Request, Response } from "express";
import { db, quizAnswersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/weak-topics", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const rows = await db
      .select({
        subject: quizAnswersTable.subject,
        total: sql<number>`count(*)::int`,
        correctCount: sql<number>`
          sum(case when ${quizAnswersTable.correct}
          then 1 else 0 end)::int
        `,
      })
      .from(quizAnswersTable)
      .where(eq(quizAnswersTable.userId, user.id))
      .groupBy(quizAnswersTable.subject);

    const subjects = rows.map((r) => ({
      subject: r.subject,
      total: r.total,
      accuracy:
        r.total > 0
          ? Math.round((r.correctCount / r.total) * 100)
          : 0,
    }));

    res.json({
      subjects,
      weakSubjects: subjects.filter(
        (s) => s.accuracy < 60
      ),
    });

  } catch (error) {
    console.error("weak-topics error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export { router as analyticsRouter };