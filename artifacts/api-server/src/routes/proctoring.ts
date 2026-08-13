import { Router, Request, Response } from "express";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { db, pool } from "@workspace/db";
import { proctoringLogsTable, quizAttemptsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import rateLimit from "express-rate-limit";

const router = Router();

const logLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: "Too many proctoring log events." },
  standardHeaders: true,
  legacyHeaders: false,
});

const MINOR_EVENTS = new Set(["session_started", "camera_error", "right_click"]);

router.post("/log", authMiddleware, logLimiter, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { sessionId, quizId, eventType, details, aiAnalysis } = req.body;
    if (!sessionId || !quizId || !eventType) { res.status(400).json({ error: "Missing fields" }); return; }

    await db.insert(proctoringLogsTable).values({
      sessionId,
      userId,
      quizId,
      eventType,
      details: details ?? null,
      aiAnalysis: aiAnalysis ?? null,
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI frame analysis removed — always returns safe
router.post("/analyze-frame", authMiddleware, (_req: Request, res: Response) => {
  res.json({ safe: true, issues: [], analysis: "Frame analysis is currently unavailable." });
});

router.post("/link", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { sessionId, quizId } = req.body;
    if (!sessionId || !quizId) { res.status(400).json({ error: "Missing fields" }); return; }

    const [attempt] = await db.select().from(quizAttemptsTable)
      .where(and(eq(quizAttemptsTable.userId, userId), eq(quizAttemptsTable.quizId, quizId)))
      .orderBy(desc(quizAttemptsTable.createdAt))
      .limit(1);
    if (!attempt) { res.status(404).json({ error: "Attempt not found" }); return; }

    const logs = await db.select().from(proctoringLogsTable)
      .where(and(eq(proctoringLogsTable.sessionId, sessionId), eq(proctoringLogsTable.userId, userId)));

    const seriousViolations = logs.filter(l => !MINOR_EVENTS.has(l.eventType)).length;

    await db.update(proctoringLogsTable)
      .set({ attemptId: attempt.id })
      .where(and(eq(proctoringLogsTable.sessionId, sessionId), eq(proctoringLogsTable.userId, userId)));

    await db.update(quizAttemptsTable)
      .set({
        proctoringSessionId: sessionId,
        violationCount: seriousViolations,
        isFlagged: seriousViolations >= 5,
        proctoringFlaggedAt: seriousViolations >= 5 ? new Date() : null,
      })
      .where(eq(quizAttemptsTable.id, attempt.id));

    res.json({ ok: true, violationCount: seriousViolations });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/all-attempts", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          qa.id AS attempt_id,
          qa.quiz_title,
          qa.subject,
          qa.score,
          qa.total,
          qa.percentage,
          qa.violation_count,
          qa.is_flagged,
          qa.proctoring_flagged_at,
          qa.created_at,
          u.id AS user_id,
          u.full_name AS student_name,
          u.email AS student_email
        FROM quiz_attempts qa
        LEFT JOIN users u ON u.id = qa.user_id
        WHERE qa.proctoring_session_id IS NOT NULL
        ORDER BY qa.is_flagged DESC, qa.created_at DESC
        LIMIT 200`
      );
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sessions/:sessionId", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const logs = await db.select().from(proctoringLogsTable)
      .where(eq(proctoringLogsTable.sessionId, sessionId))
      .orderBy(proctoringLogsTable.createdAt);
    res.json(logs);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attempts/:attemptId/report", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const attemptId = parseInt(req.params.attemptId as string);
    if (isNaN(attemptId)) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [attempt] = await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.id, attemptId));
    if (!attempt) { res.status(404).json({ error: "Not found" }); return; }

    const logs = await db.select().from(proctoringLogsTable)
      .where(eq(proctoringLogsTable.attemptId, attemptId))
      .orderBy(proctoringLogsTable.createdAt);

    res.json({ attempt, logs });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/attempts/:attemptId/flag", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const attemptId = parseInt(req.params.attemptId as string);
    if (isNaN(attemptId)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { isFlagged } = req.body;
    await db.update(quizAttemptsTable).set({ isFlagged: !!isFlagged }).where(eq(quizAttemptsTable.id, attemptId));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as proctoringRouter };
