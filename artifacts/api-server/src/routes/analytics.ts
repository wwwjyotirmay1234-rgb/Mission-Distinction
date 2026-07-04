import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizAnswersTable, questionsTable, quizzesTable, examsTable, studyPlansTable, dailyQuestionsTable, usersTable } from "@workspace/db";
import { sendPushToUser } from "./push";
import { adminMiddleware } from "../middlewares/auth";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import rateLimit from "express-rate-limit";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Weak-topic tracker ──────────────────────────────────────────────────────
router.get("/weak-topics", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const rows = await db
      .select({
        subject: quizAnswersTable.subject,
        total: sql<number>`count(*)::int`,
        correctCount: sql<number>`sum(case when ${quizAnswersTable.correct} then 1 else 0 end)::int`,
      })
      .from(quizAnswersTable)
      .where(eq(quizAnswersTable.userId, user.id))
      .groupBy(quizAnswersTable.subject);

    const subjects = rows
      .map(r => ({
        subject: r.subject,
        total: r.total,
        accuracy: r.total > 0 ? Math.round((r.correctCount / r.total) * 100) : 0,
      }))
      .filter(r => r.total >= 3)
      .sort((a, b) => a.accuracy - b.accuracy);

    const weakSubjects = subjects.filter(s => s.accuracy < 60).slice(0, 5);

    res.json({ subjects, weakSubjects });
  } catch (err) {
    console.error("weak-topics error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Mistake notebook ─────────────────────────────────────────────────────────
router.get("/mistakes", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const subjectFilter = typeof req.query.subject === "string" ? req.query.subject : undefined;

    const conditions = [eq(quizAnswersTable.userId, user.id), eq(quizAnswersTable.correct, false)];
    if (subjectFilter) conditions.push(eq(quizAnswersTable.subject, subjectFilter));

    const wrongAnswers = await db
      .select()
      .from(quizAnswersTable)
      .where(and(...conditions))
      .orderBy(desc(quizAnswersTable.createdAt))
      .limit(100);

    if (wrongAnswers.length === 0) { res.json({ mistakes: [] }); return; }

    const questionIds = [...new Set(wrongAnswers.map(w => w.questionId))];
    const questions = await db.select().from(questionsTable).where(sql`${questionsTable.id} = ANY(${questionIds})`);
    const questionMap = new Map(questions.map(q => [q.id, q]));

    const quizIds = [...new Set(wrongAnswers.map(w => w.quizId))];
    const quizzes = await db.select().from(quizzesTable).where(sql`${quizzesTable.id} = ANY(${quizIds})`);
    const quizMap = new Map(quizzes.map(q => [q.id, q]));

    const mistakes = wrongAnswers
      .map(w => {
        const q = questionMap.get(w.questionId);
        const quiz = quizMap.get(w.quizId);
        if (!q) return null;
        return {
          id: w.id,
          questionId: q.id,
          questionText: q.text,
          options: q.options,
          correctOption: q.correctOption,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          questionType: q.questionType,
          subject: w.subject,
          quizTitle: quiz?.title ?? "Quiz",
          quizId: w.quizId,
          createdAt: w.createdAt,
        };
      })
      .filter(Boolean);

    // Group by subject for convenience
    const bySubject: Record<string, typeof mistakes> = {};
    for (const m of mistakes) {
      if (!m) continue;
      (bySubject[m.subject] ??= []).push(m);
    }

    res.json({ mistakes, bySubject });
  } catch (err) {
    console.error("mistakes error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Exam-readiness score ─────────────────────────────────────────────────────
router.get("/exam-readiness", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const rows = await db
      .select({
        total: sql<number>`count(*)::int`,
        correctCount: sql<number>`sum(case when ${quizAnswersTable.correct} then 1 else 0 end)::int`,
      })
      .from(quizAnswersTable)
      .where(eq(quizAnswersTable.userId, user.id));

    const total = rows[0]?.total ?? 0;
    const correctCount = rows[0]?.correctCount ?? 0;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // Recent trend: last 20 vs previous 20
    const recentAnswers = await db
      .select({ correct: quizAnswersTable.correct, createdAt: quizAnswersTable.createdAt })
      .from(quizAnswersTable)
      .where(eq(quizAnswersTable.userId, user.id))
      .orderBy(desc(quizAnswersTable.createdAt))
      .limit(40);

    const last20 = recentAnswers.slice(0, 20);
    const prev20 = recentAnswers.slice(20, 40);
    const last20Acc = last20.length ? Math.round((last20.filter(a => a.correct).length / last20.length) * 100) : accuracy;
    const prev20Acc = prev20.length ? Math.round((prev20.filter(a => a.correct).length / prev20.length) * 100) : last20Acc;
    const trend = last20Acc - prev20Acc;

    // Coverage: how many distinct subjects practiced with >=3 attempts vs total known subjects attempted
    const subjectCoverage = await db
      .select({ subject: quizAnswersTable.subject, total: sql<number>`count(*)::int` })
      .from(quizAnswersTable)
      .where(eq(quizAnswersTable.userId, user.id))
      .groupBy(quizAnswersTable.subject);
    const coveredSubjects = subjectCoverage.filter(s => s.total >= 3).length;
    const attemptedSubjects = subjectCoverage.length || 1;
    const coverageRatio = coveredSubjects / attemptedSubjects;

    // Volume factor: more attempted questions -> more confident score (caps at 150 questions)
    const volumeFactor = Math.min(total / 150, 1);

    const rawScore = accuracy * 0.55 + last20Acc * 0.25 + coverageRatio * 100 * 0.1 + volumeFactor * 100 * 0.1;
    const score = total >= 5 ? Math.round(Math.max(0, Math.min(100, rawScore))) : null;

    let band = "Not enough data yet";
    if (score !== null) {
      if (score >= 80) band = "Exam Ready";
      else if (score >= 60) band = "On Track";
      else if (score >= 40) band = "Needs Focus";
      else band = "High Risk";
    }

    res.json({
      score,
      band,
      accuracy,
      totalQuestionsAttempted: total,
      trend,
      recentAccuracy: last20Acc,
    });
  } catch (err) {
    console.error("exam-readiness error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Personalized daily study plan ────────────────────────────────────────────
router.post("/study-plan/generate", authMiddleware, aiLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const rows = await db
      .select({
        subject: quizAnswersTable.subject,
        total: sql<number>`count(*)::int`,
        correctCount: sql<number>`sum(case when ${quizAnswersTable.correct} then 1 else 0 end)::int`,
      })
      .from(quizAnswersTable)
      .where(eq(quizAnswersTable.userId, user.id))
      .groupBy(quizAnswersTable.subject);

    const subjectStats = rows
      .map(r => ({ subject: r.subject, total: r.total, accuracy: r.total > 0 ? Math.round((r.correctCount / r.total) * 100) : 0 }))
      .sort((a, b) => a.accuracy - b.accuracy);
    const weakSubjects = subjectStats.filter(s => s.total >= 3 && s.accuracy < 70).slice(0, 5).map(s => s.subject);

    const upcomingExams = await db
      .select()
      .from(examsTable)
      .where(gte(examsTable.examDate, new Date()))
      .orderBy(examsTable.examDate)
      .limit(5);

    const examSummary = upcomingExams.length > 0
      ? upcomingExams.map(e => `${e.title} (${e.subject}) on ${e.examDate.toISOString().slice(0, 10)}`).join("; ")
      : "No specific exam date set — build a general revision plan.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert MBBS academic advisor for 1st Year students in India preparing for university exams and NEET PG/INI-CET foundation. Build realistic, motivating daily revision plans.",
        },
        {
          role: "user",
          content: `Student's weak subjects (lowest accuracy first): ${weakSubjects.length ? weakSubjects.join(", ") : "none identified yet — assume general 1st Year MBBS subjects (Anatomy, Physiology, Biochemistry)"}.
Upcoming exams: ${examSummary}
Build a 7-day study plan starting tomorrow. Return ONLY valid JSON:
{ "summary": string (1-2 sentence encouraging overview), "days": [ { "day": string (e.g. "Day 1 - Mon"), "focus": string (main subject/topic), "tasks": string[] (3-4 concrete tasks, e.g. "Revise Brachial Plexus - 45 min", "Attempt 10 MCQs on Renal Physiology") } ] }`,
        },
      ],
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) { res.status(500).json({ error: "No response from AI" }); return; }
    const plan = JSON.parse(content);

    const [saved] = await db.insert(studyPlansTable).values({
      userId: user.id,
      planJson: plan,
      weakSubjects,
    }).returning();

    res.json({ plan, weakSubjects, id: saved?.id, generatedAt: saved?.generatedAt });
  } catch (err: any) {
    console.error("study-plan generate error:", err);
    res.status(500).json({ error: err?.message || "Failed to generate study plan. Please try again." });
  }
});

router.get("/study-plan/latest", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const [plan] = await db
      .select()
      .from(studyPlansTable)
      .where(eq(studyPlansTable.userId, user.id))
      .orderBy(desc(studyPlansTable.generatedAt))
      .limit(1);
    res.json({ plan: plan ?? null });
  } catch (err) {
    console.error("study-plan latest error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Question of the day ──────────────────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getOrCreateDailyQuestion(userId: number) {
  const dateKey = todayKey();
  const [existing] = await db
    .select()
    .from(dailyQuestionsTable)
    .where(and(eq(dailyQuestionsTable.userId, userId), eq(dailyQuestionsTable.dateKey, dateKey)));
  if (existing) return existing;

  const rows = await db
    .select({
      subject: quizAnswersTable.subject,
      total: sql<number>`count(*)::int`,
      correctCount: sql<number>`sum(case when ${quizAnswersTable.correct} then 1 else 0 end)::int`,
    })
    .from(quizAnswersTable)
    .where(eq(quizAnswersTable.userId, userId))
    .groupBy(quizAnswersTable.subject);

  const stats = rows
    .map(r => ({ subject: r.subject, total: r.total, accuracy: r.total > 0 ? Math.round((r.correctCount / r.total) * 100) : 0 }))
    .filter(r => r.total >= 3)
    .sort((a, b) => a.accuracy - b.accuracy);

  const subject = stats[0]?.subject || "Anatomy";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 1.0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are an expert Indian medical educator writing one high-yield NEET PG style MCQ per day for a 1st Year MBBS student." },
      {
        role: "user",
        content: `Write ONE high-yield single-best-answer MCQ for Subject: ${subject}. Return ONLY valid JSON: { "text": string, "options": string[4], "correctOption": number (0-3 index), "explanation": string }`,
      },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  const question = content ? JSON.parse(content) : { text: "Question unavailable today.", options: [], correctOption: 0, explanation: "" };

  const [saved] = await db.insert(dailyQuestionsTable).values({
    userId, dateKey, subject, questionJson: question,
  }).onConflictDoNothing().returning();

  if (saved) return saved;
  const [fallback] = await db.select().from(dailyQuestionsTable).where(and(eq(dailyQuestionsTable.userId, userId), eq(dailyQuestionsTable.dateKey, dateKey)));
  return fallback;
}

router.get("/question-of-day", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const q = await getOrCreateDailyQuestion(user.id);
    if (!q) { res.status(500).json({ error: "Failed to generate today's question" }); return; }
    res.json(q);
  } catch (err: any) {
    console.error("question-of-day error:", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

router.post("/question-of-day/:id/answer", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseInt(String(req.params.id));
    const { selectedOption } = req.body;
    const [q] = await db.select().from(dailyQuestionsTable).where(and(eq(dailyQuestionsTable.id, id), eq(dailyQuestionsTable.userId, user.id)));
    if (!q) { res.status(404).json({ error: "Not found" }); return; }
    const correctOption = (q.questionJson as any)?.correctOption;
    const wasCorrect = selectedOption === correctOption;
    await db.update(dailyQuestionsTable).set({ answered: true, wasCorrect }).where(eq(dailyQuestionsTable.id, id));
    res.json({ wasCorrect, correctOption });
  } catch (err) {
    console.error("question-of-day answer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin/cron-triggered broadcast: generates + pushes today's question to every subscribed student.
// Since this environment has no background scheduler, trigger this daily via an external cron
// (e.g. a scheduled deployment or third-party uptime-cron) hitting this endpoint with an admin JWT.
router.post("/question-of-day/broadcast", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const students = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "student"));
    let sent = 0;
    for (const s of students) {
      try {
        const q = await getOrCreateDailyQuestion(s.id);
        if (!q) continue;
        const ok = await sendPushToUser(s.id, "🧠 Today's high-yield question", `Subject: ${q.subject} — tap to answer and keep your streak going!`, "/ai-tools");
        if (ok) sent++;
      } catch (e) {
        console.error(`question-of-day broadcast failed for user ${s.id}:`, e);
      }
    }
    res.json({ totalStudents: students.length, pushesSent: sent });
  } catch (err) {
    console.error("question-of-day broadcast error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as analyticsRouter };
