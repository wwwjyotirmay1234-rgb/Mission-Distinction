import { Router, Request, Response } from "express";
import { db, pool } from "@workspace/db";
import { clinicalCasesTable, clinicalCaseAttemptsTable } from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { awardXp } from "../lib/xp";
import rateLimit from "express-rate-limit";

const router = Router();

const attemptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait." },
});

// ─── Today's case ─────────────────────────────────────────────────────────────
router.get("/today", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const todayData = await getTodaysCase();
    if (!todayData) {
      res.status(404).json({ error: "No clinical cases available yet." });
      return;
    }
    const { todayCase, dateKey } = todayData;

    // Check if this user already attempted today's case (scoped to today's date_key)
    const [attempt] = await db
      .select()
      .from(clinicalCaseAttemptsTable)
      .where(
        and(
          eq(clinicalCaseAttemptsTable.userId, user.id),
          eq(clinicalCaseAttemptsTable.caseId, todayCase.id),
          eq(clinicalCaseAttemptsTable.dateKey, dateKey)
        )
      )
      .orderBy(desc(clinicalCaseAttemptsTable.createdAt))
      .limit(1);

    res.json({
      ...todayCase,
      attempted: !!attempt,
      myAttempt: attempt ?? null,
    });
  } catch (err) {
    console.error("clinical-cases today error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Helper: compute today's case (shared logic) ─────────────────────────────
async function getTodaysCase() {
  const dateKey = new Date().toISOString().slice(0, 10);

  let [todayCase] = await db
    .select()
    .from(clinicalCasesTable)
    .where(eq(clinicalCasesTable.dateAssigned, dateKey))
    .limit(1);

  if (!todayCase) {
    const allCases = await db.select().from(clinicalCasesTable).orderBy(clinicalCasesTable.id);
    if (allCases.length === 0) return null;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    todayCase = allCases[dayOfYear % allCases.length];
  }

  return { todayCase, dateKey };
}

// ─── Submit attempt + get AI feedback ────────────────────────────────────────
router.post("/:id/attempt", authMiddleware, attemptLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const caseId = parseInt(String(req.params.id));
    if (!caseId) { res.status(400).json({ error: "Invalid case ID" }); return; }

    const { answerText } = req.body;
    if (!answerText?.trim()) { res.status(400).json({ error: "answerText is required" }); return; }
    if (String(answerText).length > 5000) { res.status(400).json({ error: "Answer too long (max 5000 chars)" }); return; }

    // Validate the submitted case ID is actually today's case (prevents XP farming on arbitrary IDs)
    const todayData = await getTodaysCase();
    if (!todayData) { res.status(404).json({ error: "No clinical case available today" }); return; }
    const { todayCase, dateKey } = todayData;
    if (todayCase.id !== caseId) {
      res.status(403).json({ error: "You can only submit an attempt for today's clinical case" });
      return;
    }
    const clinicalCase = todayCase;

    // Check for duplicate attempt: same user + same case + same calendar day
    const [existing] = await db
      .select()
      .from(clinicalCaseAttemptsTable)
      .where(and(
        eq(clinicalCaseAttemptsTable.userId, user.id),
        eq(clinicalCaseAttemptsTable.caseId, caseId),
        eq(clinicalCaseAttemptsTable.dateKey, dateKey)
      ))
      .limit(1);
    if (existing) {
      res.json({ feedback: existing.aiFeedback, alreadyAttempted: true });
      return;
    }

    // Generate AI feedback
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a senior MBBS clinical tutor evaluating a 1st year student's answer to a clinical case scenario. Your job is to give structured, educational feedback. Be encouraging but clinically accurate. Always reference standard Indian medical textbook knowledge (Gray's, Guyton, Harper's, etc.).`,
        },
        {
          role: "user",
          content: `Clinical Case: ${clinicalCase.scenario}

Model Answer (confidential — do NOT reveal verbatim): ${clinicalCase.modelAnswer}

Student's Answer: ${answerText}

Evaluate the student's answer and return ONLY valid JSON:
{
  "score": number (0-10),
  "diagnosis": string (1-2 sentences on whether they identified the diagnosis/nerve/concept correctly),
  "pathway": string (1-2 sentences on anatomical/physiological pathway — correct or what was missed),
  "clinicalCorrelates": string (1-2 sentences on clinical relevance and application),
  "missedPoints": string[] (2-4 key points the student missed or got wrong),
  "strengths": string[] (1-3 things the student got right),
  "verdict": string (one motivating sentence: 'Good attempt!' or 'Needs revision — focus on...')
}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) { res.status(500).json({ error: "AI feedback unavailable" }); return; }
    const feedback = JSON.parse(content);

    const [saved] = await db.insert(clinicalCaseAttemptsTable).values({
      userId: user.id,
      caseId,
      dateKey,
      answerText: String(answerText).slice(0, 5000),
      aiFeedback: feedback,
    }).returning();

    // Award XP for attempting
    awardXp(user.id, 15, "clinical_case_attempt", `Attempted Clinical Case of the Day`).catch(() => {});
    if (feedback.score >= 7) {
      awardXp(user.id, 10, "clinical_case_bonus", `High score on clinical case (${feedback.score}/10)`).catch(() => {});
    }

    res.json({ feedback, id: saved?.id });
  } catch (err: any) {
    console.error("clinical-cases attempt error:", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// ─── Admin: List all cases ────────────────────────────────────────────────────
router.get("/", authMiddleware, adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const cases = await db
      .select()
      .from(clinicalCasesTable)
      .orderBy(desc(clinicalCasesTable.createdAt));
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin: Create case ───────────────────────────────────────────────────────
router.post("/", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { scenario, subject, modelAnswer, explanation, dateAssigned } = req.body;
    if (!scenario?.trim() || !subject?.trim() || !modelAnswer?.trim() || !explanation?.trim()) {
      res.status(400).json({ error: "scenario, subject, modelAnswer, and explanation are required" });
      return;
    }
    const [created] = await db.insert(clinicalCasesTable).values({
      scenario: String(scenario).slice(0, 2000),
      subject: String(subject),
      modelAnswer: String(modelAnswer).slice(0, 5000),
      explanation: String(explanation).slice(0, 5000),
      dateAssigned: dateAssigned ? String(dateAssigned) : null,
      createdBy: user.id,
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin: Update case ───────────────────────────────────────────────────────
router.put("/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { scenario, subject, modelAnswer, explanation, dateAssigned } = req.body;
    const [updated] = await db
      .update(clinicalCasesTable)
      .set({
        ...(scenario && { scenario: String(scenario).slice(0, 2000) }),
        ...(subject && { subject: String(subject) }),
        ...(modelAnswer && { modelAnswer: String(modelAnswer).slice(0, 5000) }),
        ...(explanation && { explanation: String(explanation).slice(0, 5000) }),
        dateAssigned: dateAssigned ? String(dateAssigned) : null,
      })
      .where(eq(clinicalCasesTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin: Delete case ───────────────────────────────────────────────────────
router.delete("/:id", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id));
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(clinicalCaseAttemptsTable).where(eq(clinicalCaseAttemptsTable.caseId, id));
    await db.delete(clinicalCasesTable).where(eq(clinicalCasesTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as clinicalCasesRouter };
