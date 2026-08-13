import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { clinicalCasesTable, clinicalCaseAttemptsTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { awardXp } from "../lib/xp";
import rateLimit from "express-rate-limit";
import { gradeClinicalAnswer } from "../lib/aiGrading";

const router = Router();

const attemptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait." },
});

// ─── GET /grand-rounds — list all Grand Round cases ──────────────────────────
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const cases = await db
      .select()
      .from(clinicalCasesTable)
      .where(eq(clinicalCasesTable.isGrandRound, true))
      .orderBy(desc(clinicalCasesTable.createdAt))
      .limit(50);

    if (cases.length === 0) {
      res.json({ cases: [] });
      return;
    }

    // Get user's own attempts for these cases
    const myAttempts = await db
      .select()
      .from(clinicalCaseAttemptsTable)
      .where(eq(clinicalCaseAttemptsTable.userId, user.id));

    const attemptMap = new Map(myAttempts.map(a => [a.caseId, a]));

    // For each case with a featured attempt, get the winner's name
    const featuredIds = cases
      .filter(c => c.featuredAttemptId)
      .map(c => c.featuredAttemptId!);

    let featuredMap = new Map<number, { userName: string; answerText: string; aiFeedback: any }>();
    if (featuredIds.length > 0) {
      const featuredAttempts = await db
        .select({
          id: clinicalCaseAttemptsTable.id,
          caseId: clinicalCaseAttemptsTable.caseId,
          answerText: clinicalCaseAttemptsTable.answerText,
          aiFeedback: clinicalCaseAttemptsTable.aiFeedback,
          userName: usersTable.fullName,
        })
        .from(clinicalCaseAttemptsTable)
        .innerJoin(usersTable, eq(clinicalCaseAttemptsTable.userId, usersTable.id))
        .where(sql`${clinicalCaseAttemptsTable.id} = ANY(${featuredIds}::int[])`);

      for (const fa of featuredAttempts) {
        featuredMap.set(fa.id, { userName: fa.userName, answerText: fa.answerText, aiFeedback: fa.aiFeedback });
      }
    }

    const result = cases.map(c => ({
      ...c,
      modelAnswer: undefined,
      attempted: attemptMap.has(c.id),
      myAttempt: attemptMap.get(c.id) ?? null,
      featuredAnswer: c.featuredAttemptId ? (featuredMap.get(c.featuredAttemptId) ?? null) : null,
    }));

    res.json({ cases: result });
  } catch (err) {
    console.error("grand-rounds list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /grand-rounds/:id — single case details ─────────────────────────────
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseInt(String(req.params.id));
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [c] = await db
      .select()
      .from(clinicalCasesTable)
      .where(and(eq(clinicalCasesTable.id, id), eq(clinicalCasesTable.isGrandRound, true)))
      .limit(1);

    if (!c) { res.status(404).json({ error: "Grand Round case not found" }); return; }

    const [myAttempt] = await db
      .select()
      .from(clinicalCaseAttemptsTable)
      .where(and(
        eq(clinicalCaseAttemptsTable.userId, user.id),
        eq(clinicalCaseAttemptsTable.caseId, id)
      ))
      .orderBy(desc(clinicalCaseAttemptsTable.createdAt))
      .limit(1);

    let featuredAnswer = null;
    if (c.featuredAttemptId) {
      const [fa] = await db
        .select({
          id: clinicalCaseAttemptsTable.id,
          answerText: clinicalCaseAttemptsTable.answerText,
          aiFeedback: clinicalCaseAttemptsTable.aiFeedback,
          createdAt: clinicalCaseAttemptsTable.createdAt,
          userName: usersTable.fullName,
        })
        .from(clinicalCaseAttemptsTable)
        .innerJoin(usersTable, eq(clinicalCaseAttemptsTable.userId, usersTable.id))
        .where(eq(clinicalCaseAttemptsTable.id, c.featuredAttemptId))
        .limit(1);
      featuredAnswer = fa ?? null;
    }

    // Leaderboard for this case (top 10 by AI score)
    const leaderboard = await db
      .select({
        id: clinicalCaseAttemptsTable.id,
        aiFeedback: clinicalCaseAttemptsTable.aiFeedback,
        createdAt: clinicalCaseAttemptsTable.createdAt,
        userName: usersTable.fullName,
      })
      .from(clinicalCaseAttemptsTable)
      .innerJoin(usersTable, eq(clinicalCaseAttemptsTable.userId, usersTable.id))
      .where(eq(clinicalCaseAttemptsTable.caseId, id))
      .orderBy(desc(clinicalCaseAttemptsTable.createdAt))
      .limit(50);

    // Sort by score extracted from aiFeedback JSONB
    const ranked = leaderboard
      .map(r => ({
        id: r.id,
        userName: r.userName,
        score: (r.aiFeedback as any)?.score ?? 0,
        verdict: (r.aiFeedback as any)?.verdict ?? "",
        createdAt: r.createdAt,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({
      ...c,
      modelAnswer: undefined,
      attempted: !!myAttempt,
      myAttempt: myAttempt ?? null,
      featuredAnswer,
      leaderboard: ranked,
    });
  } catch (err) {
    console.error("grand-rounds detail error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /grand-rounds/:id/attempt — submit answer with AI grading ──────────
router.post("/:id/attempt", authMiddleware, attemptLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const caseId = parseInt(String(req.params.id));
    if (!caseId) { res.status(400).json({ error: "Invalid case ID" }); return; }

    const { answerText } = req.body;
    if (!answerText?.trim()) { res.status(400).json({ error: "answerText is required" }); return; }
    if (String(answerText).length > 8000) { res.status(400).json({ error: "Answer too long (max 8000 chars)" }); return; }

    const [clinicalCase] = await db
      .select()
      .from(clinicalCasesTable)
      .where(and(eq(clinicalCasesTable.id, caseId), eq(clinicalCasesTable.isGrandRound, true)))
      .limit(1);

    if (!clinicalCase) { res.status(404).json({ error: "Grand Round case not found" }); return; }

    // Allow re-attempts on Grand Rounds (they can revise and improve)
    const [existing] = await db
      .select()
      .from(clinicalCaseAttemptsTable)
      .where(and(
        eq(clinicalCaseAttemptsTable.userId, user.id),
        eq(clinicalCaseAttemptsTable.caseId, caseId)
      ))
      .limit(1);

    if (existing) {
      res.json({ feedback: existing.aiFeedback, alreadyAttempted: true, id: existing.id });
      return;
    }

    const dateKey = new Date().toISOString().slice(0, 10);
    const [saved] = await db.insert(clinicalCaseAttemptsTable).values({
      userId: user.id,
      caseId,
      dateKey,
      answerText: String(answerText).slice(0, 8000),
      aiFeedback: null,
    }).returning();

    // AI grading (synchronous)
    let aiFeedback: object | null = null;
    try {
      const feedback = await gradeClinicalAnswer(
        clinicalCase.scenario,
        clinicalCase.subject,
        clinicalCase.modelAnswer ?? "",
        String(answerText)
      );
      if (feedback && saved) {
        aiFeedback = feedback;
        await db.update(clinicalCaseAttemptsTable)
          .set({ aiFeedback: feedback })
          .where(eq(clinicalCaseAttemptsTable.id, saved.id));
      }
    } catch (aiErr) {
      console.error("[grand-rounds] AI grading failed:", aiErr);
    }

    // Award XP: base 15 + grade bonus
    const score = (aiFeedback as any)?.score ?? 0;
    const gradeXp = score >= 8 ? 25 : score >= 6 ? 15 : score >= 4 ? 5 : 0;
    awardXp(user.id, 15 + gradeXp, "grand_round_attempt", `Grand Round attempt on "${clinicalCase.subject}" case`).catch(() => {});

    res.json({ feedback: aiFeedback, id: saved.id });
  } catch (err: any) {
    console.error("grand-rounds attempt error:", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// ─── Admin: GET /grand-rounds/admin/submissions — all submissions for a case ──
router.get("/admin/submissions/:caseId", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const caseId = parseInt(String(req.params.caseId));
    if (!caseId) { res.status(400).json({ error: "Invalid case ID" }); return; }

    const rows = await db
      .select({
        id: clinicalCaseAttemptsTable.id,
        answerText: clinicalCaseAttemptsTable.answerText,
        aiFeedback: clinicalCaseAttemptsTable.aiFeedback,
        createdAt: clinicalCaseAttemptsTable.createdAt,
        userName: usersTable.fullName,
        userEmail: usersTable.email,
        userId: usersTable.id,
      })
      .from(clinicalCaseAttemptsTable)
      .innerJoin(usersTable, eq(clinicalCaseAttemptsTable.userId, usersTable.id))
      .where(eq(clinicalCaseAttemptsTable.caseId, caseId))
      .orderBy(desc(clinicalCaseAttemptsTable.createdAt))
      .limit(200);

    const ranked = rows
      .map(r => ({ ...r, score: (r.aiFeedback as any)?.score ?? 0 }))
      .sort((a, b) => b.score - a.score);

    res.json({ submissions: ranked });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin: POST /grand-rounds/admin/:caseId/feature — feature best answer ───
router.post("/admin/:caseId/feature", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const caseId = parseInt(String(req.params.caseId));
    const { attemptId } = req.body;
    if (!caseId || !attemptId) { res.status(400).json({ error: "caseId and attemptId are required" }); return; }

    // Verify the attempt belongs to this case
    const [attempt] = await db
      .select()
      .from(clinicalCaseAttemptsTable)
      .where(and(
        eq(clinicalCaseAttemptsTable.id, parseInt(String(attemptId))),
        eq(clinicalCaseAttemptsTable.caseId, caseId)
      ))
      .limit(1);

    if (!attempt) { res.status(404).json({ error: "Attempt not found for this case" }); return; }

    const [updated] = await db
      .update(clinicalCasesTable)
      .set({ featuredAttemptId: attempt.id, winnerAnnouncedAt: new Date() })
      .where(eq(clinicalCasesTable.id, caseId))
      .returning();

    // Award bonus XP to winner
    awardXp(attempt.userId, 100, "grand_round_featured", `Your answer was featured as the Best Grand Round Answer!`).catch(() => {});

    res.json({ case: updated, message: "Answer featured and 100 XP awarded to winner!" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin: POST — create Grand Round case ────────────────────────────────────
router.post("/admin/create", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { scenario, subject, modelAnswer, explanation, grandRoundWeek, dateAssigned } = req.body;

    if (!scenario?.trim() || !subject?.trim() || !modelAnswer?.trim() || !explanation?.trim()) {
      res.status(400).json({ error: "scenario, subject, modelAnswer, and explanation are required" });
      return;
    }

    const [created] = await db.insert(clinicalCasesTable).values({
      scenario: String(scenario).slice(0, 3000),
      subject: String(subject),
      modelAnswer: String(modelAnswer).slice(0, 8000),
      explanation: String(explanation).slice(0, 8000),
      dateAssigned: dateAssigned ? String(dateAssigned) : null,
      createdBy: admin.id,
      isGrandRound: true,
      grandRoundWeek: grandRoundWeek ? String(grandRoundWeek) : null,
    }).returning();

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as grandRoundsRouter };
