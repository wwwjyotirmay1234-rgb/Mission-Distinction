import { Router, Request, Response } from "express";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { db } from "@workspace/db";
import { proctoringLogsTable, quizAttemptsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import rateLimit from "express-rate-limit";

const router = Router();

const analyzeFrameLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many frame analysis requests. Slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

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

router.post("/analyze-frame", authMiddleware, analyzeFrameLimiter, async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) { res.status(400).json({ error: "Missing imageBase64" }); return; }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 200,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `You are an AI exam proctor. Analyze this webcam frame from a student taking an online exam. Check ONLY for clear, obvious violations:
1. Is NO face visible at all? → "no_face"
2. Are multiple distinct faces visible? → "multiple_faces"
3. Is a mobile phone clearly visible? → "phone_detected"
4. Is the student clearly looking away from the screen? → "looking_away"

Respond ONLY in valid JSON: { "safe": boolean, "issues": string[], "analysis": "one brief sentence" }
Be lenient — only flag clear, unmistakable violations. Poor lighting or angle alone is NOT a violation.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" },
          },
        ],
      }],
    });

    const content = response.choices[0]?.message?.content ?? '{"safe":true,"issues":[],"analysis":"OK"}';
    let result: { safe: boolean; issues: string[]; analysis: string };
    try {
      const m = content.match(/\{[\s\S]*\}/);
      result = m ? JSON.parse(m[0]) : { safe: true, issues: [], analysis: content };
    } catch {
      result = { safe: true, issues: [], analysis: content };
    }

    res.json(result);
  } catch {
    res.json({ safe: true, issues: [], analysis: "Analysis unavailable" });
  }
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
