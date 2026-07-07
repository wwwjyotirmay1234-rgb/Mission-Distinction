import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizAnswersTable, questionsTable, quizzesTable, examsTable, studyPlansTable, dailyQuestionsTable, usersTable, vivaHistoryTable, pyqsTable, pyqInsightsCacheTable } from "@workspace/db";
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

    const [rows, recentAnswers, subjectCoverage, vivaRows, upcomingExams] = await Promise.all([
      db.select({
        total: sql<number>`count(*)::int`,
        correctCount: sql<number>`sum(case when ${quizAnswersTable.correct} then 1 else 0 end)::int`,
      }).from(quizAnswersTable).where(eq(quizAnswersTable.userId, user.id)),
      db.select({ correct: quizAnswersTable.correct, createdAt: quizAnswersTable.createdAt })
        .from(quizAnswersTable)
        .where(eq(quizAnswersTable.userId, user.id))
        .orderBy(desc(quizAnswersTable.createdAt))
        .limit(40),
      db.select({ subject: quizAnswersTable.subject, total: sql<number>`count(*)::int` })
        .from(quizAnswersTable)
        .where(eq(quizAnswersTable.userId, user.id))
        .groupBy(quizAnswersTable.subject),
      db.select({ score: vivaHistoryTable.score })
        .from(vivaHistoryTable)
        .where(eq(vivaHistoryTable.userId, user.id))
        .orderBy(desc(vivaHistoryTable.createdAt))
        .limit(20),
      db.select({ examDate: examsTable.examDate })
        .from(examsTable)
        .where(and(eq(examsTable.isGlobal, true), gte(examsTable.examDate, new Date())))
        .orderBy(examsTable.examDate)
        .limit(1),
    ]);

    const total = rows[0]?.total ?? 0;
    const correctCount = rows[0]?.correctCount ?? 0;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const last20 = recentAnswers.slice(0, 20);
    const prev20 = recentAnswers.slice(20, 40);
    const last20Acc = last20.length ? Math.round((last20.filter(a => a.correct).length / last20.length) * 100) : accuracy;
    const prev20Acc = prev20.length ? Math.round((prev20.filter(a => a.correct).length / prev20.length) * 100) : last20Acc;
    const trend = last20Acc - prev20Acc;

    const coveredSubjects = subjectCoverage.filter(s => s.total >= 3).length;
    const attemptedSubjects = subjectCoverage.length || 1;
    const coverageRatio = coveredSubjects / attemptedSubjects;
    const volumeFactor = Math.min(total / 150, 1);

    // Viva factor (0-100): average viva score if any sessions exist
    const vivaAvgScore = vivaRows.length > 0
      ? Math.round(vivaRows.reduce((sum, r) => sum + r.score, 0) / vivaRows.length)
      : null;
    const vivaBonus = vivaAvgScore !== null ? (vivaAvgScore / 100) * 5 : 0;

    const rawScore = accuracy * 0.50 + last20Acc * 0.25 + coverageRatio * 100 * 0.10 + volumeFactor * 100 * 0.10 + vivaBonus * 0.05;
    const score = total >= 5 ? Math.round(Math.max(0, Math.min(100, rawScore))) : null;

    // Projected score: where will you be at exam time given current trend?
    const projectedScore = score !== null
      ? Math.round(Math.max(0, Math.min(100, score + Math.sign(trend) * Math.min(Math.abs(trend) * 1.5, 12))))
      : null;

    let band = "Not enough data yet";
    if (score !== null) {
      if (score >= 80) band = "Exam Ready";
      else if (score >= 60) band = "On Track";
      else if (score >= 40) band = "Needs Focus";
      else band = "High Risk";
    }

    // Weeks to nearest upcoming global exam
    let weeksToExam: number | null = null;
    if (upcomingExams[0]) {
      const msToExam = upcomingExams[0].examDate.getTime() - Date.now();
      weeksToExam = Math.max(0, Math.round(msToExam / (7 * 24 * 60 * 60 * 1000)));
    }

    // How many extra quiz sessions are needed this week to reach 75%?
    const TARGET = 75;
    let sessionsNeededThisWeek = 0;
    if (projectedScore !== null && projectedScore < TARGET) {
      const gap = TARGET - projectedScore;
      sessionsNeededThisWeek = Math.min(Math.ceil(gap / 2), 7);
    }

    res.json({
      score,
      band,
      accuracy,
      totalQuestionsAttempted: total,
      trend,
      recentAccuracy: last20Acc,
      projectedScore,
      vivaAvgScore,
      vivaCount: vivaRows.length,
      weeksToExam,
      sessionsNeededThisWeek,
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

// ── Per-quiz accuracy breakdown ──────────────────────────────────────────────
router.get("/per-quiz-breakdown", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const rows = await db
      .select({
        quizId: quizAnswersTable.quizId,
        subject: quizAnswersTable.subject,
        total: sql<number>`count(*)::int`,
        correctCount: sql<number>`sum(case when ${quizAnswersTable.correct} then 1 else 0 end)::int`,
      })
      .from(quizAnswersTable)
      .where(eq(quizAnswersTable.userId, user.id))
      .groupBy(quizAnswersTable.quizId, quizAnswersTable.subject);

    const filtered = rows.filter(r => r.total >= 3);
    if (filtered.length === 0) { res.json({ breakdown: [] }); return; }

    const quizIds = [...new Set(filtered.map(r => r.quizId))];
    const quizzes = await db
      .select({ id: quizzesTable.id, title: quizzesTable.title })
      .from(quizzesTable)
      .where(sql`${quizzesTable.id} = ANY(${quizIds})`);
    const quizMap = new Map(quizzes.map(q => [q.id, q.title]));

    const breakdown = filtered
      .map(r => ({
        quizId: r.quizId,
        quizTitle: quizMap.get(r.quizId) ?? `Quiz #${r.quizId}`,
        subject: r.subject,
        total: r.total,
        accuracy: Math.round((r.correctCount / r.total) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    res.json({ breakdown });
  } catch (err) {
    console.error("per-quiz-breakdown error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PYQ Pattern Analyzer ─────────────────────────────────────────────────────
router.get("/pyq-patterns", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const [allPyqs, subjectAccuracy] = await Promise.all([
      db.select({ id: pyqsTable.id, subject: pyqsTable.subject, year: pyqsTable.year, topicTags: pyqsTable.topicTags }).from(pyqsTable),
      db.select({
        subject: quizAnswersTable.subject,
        total: sql<number>`count(*)::int`,
        correctCount: sql<number>`sum(case when ${quizAnswersTable.correct} then 1 else 0 end)::int`,
      }).from(quizAnswersTable).where(eq(quizAnswersTable.userId, user.id)).groupBy(quizAnswersTable.subject),
    ]);

    // Build tag → { subject, years set } map
    const tagMap = new Map<string, { subject: string; years: Set<string>; pyqCount: number }>();
    for (const pyq of allPyqs) {
      const tags = (pyq.topicTags as string[]) ?? [];
      for (const tag of tags) {
        if (!tagMap.has(tag)) tagMap.set(tag, { subject: pyq.subject, years: new Set(), pyqCount: 0 });
        const entry = tagMap.get(tag)!;
        entry.years.add(pyq.year);
        entry.pyqCount++;
      }
    }

    // Build subject → accuracy map
    const subjectAccMap = new Map<string, number>();
    for (const row of subjectAccuracy) {
      subjectAccMap.set(row.subject, row.total > 0 ? Math.round((row.correctCount / row.total) * 100) : 0);
    }

    // Total distinct years in DB for context
    const allYears = new Set(allPyqs.map(p => p.year));
    const totalYears = allYears.size || 1;

    const patterns = Array.from(tagMap.entries())
      .map(([tag, { subject, years, pyqCount }]) => ({
        tag,
        subject,
        pyqFrequency: pyqCount,
        distinctYears: years.size,
        totalYears,
        studentSubjectAccuracy: subjectAccMap.get(subject) ?? null,
      }))
      .sort((a, b) => b.distinctYears - a.distinctYears || b.pyqFrequency - a.pyqFrequency);

    res.json({ patterns, totalYears, hasTags: patterns.length > 0 });
  } catch (err) {
    console.error("pyq-patterns error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PYQ AI Insights (cached 24h) ─────────────────────────────────────────────
router.get("/pyq-insights", authMiddleware, aiLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

    // Serve cache if fresh
    const [cached] = await db.select().from(pyqInsightsCacheTable).where(eq(pyqInsightsCacheTable.userId, user.id));
    if (cached && Date.now() - cached.generatedAt.getTime() < CACHE_TTL_MS) {
      res.json({ insights: cached.insightsJson as string[], cached: true, generatedAt: cached.generatedAt });
      return;
    }

    // Fetch patterns to build AI prompt
    const [allPyqs, subjectAccuracy] = await Promise.all([
      db.select({ subject: pyqsTable.subject, year: pyqsTable.year, topicTags: pyqsTable.topicTags }).from(pyqsTable),
      db.select({
        subject: quizAnswersTable.subject,
        total: sql<number>`count(*)::int`,
        correctCount: sql<number>`sum(case when ${quizAnswersTable.correct} then 1 else 0 end)::int`,
      }).from(quizAnswersTable).where(eq(quizAnswersTable.userId, user.id)).groupBy(quizAnswersTable.subject),
    ]);

    const tagMap = new Map<string, { subject: string; years: Set<string> }>();
    for (const pyq of allPyqs) {
      for (const tag of ((pyq.topicTags as string[]) ?? [])) {
        if (!tagMap.has(tag)) tagMap.set(tag, { subject: pyq.subject, years: new Set() });
        tagMap.get(tag)!.years.add(pyq.year);
      }
    }

    const subjectAccMap = new Map<string, number>();
    for (const row of subjectAccuracy) {
      subjectAccMap.set(row.subject, row.total > 0 ? Math.round((row.correctCount / row.total) * 100) : 0);
    }

    const totalYears = new Set(allPyqs.map(p => p.year)).size || 1;
    const topPatterns = Array.from(tagMap.entries())
      .map(([tag, { subject, years }]) => ({
        tag, subject, years: years.size,
        acc: subjectAccMap.get(subject) ?? null,
      }))
      .sort((a, b) => b.years - a.years)
      .slice(0, 12);

    let insights: string[] = [
      "Complete more quizzes to unlock personalised PYQ insights. Each quiz session helps the AI calibrate your strengths and gaps.",
    ];

    if (topPatterns.length > 0) {
      const patternSummary = topPatterns
        .map(p => `"${p.tag}" (${p.subject}): appeared in ${p.years}/${totalYears} exam years${p.acc !== null ? `, your ${p.subject} accuracy: ${p.acc}%` : ""}`)
        .join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an expert MBBS academic advisor for 1st Year Indian medical students. Analyse PYQ frequency data and the student's quiz accuracy to generate honest, specific, actionable study insights.",
          },
          {
            role: "user",
            content: `Here is the PYQ frequency data and this student's quiz accuracy:\n${patternSummary}\n\nGenerate 3-5 concise, specific, actionable insight bullets. Each bullet should mention the topic name, its exam frequency, and what the student should do. Be direct and honest about weaknesses. Return ONLY valid JSON: { "insights": string[] }`,
          },
        ],
      });
      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.insights) && parsed.insights.length > 0) {
          insights = parsed.insights;
        }
      }
    }

    // Upsert cache
    await db.insert(pyqInsightsCacheTable)
      .values({ userId: user.id, insightsJson: insights, generatedAt: new Date() })
      .onConflictDoUpdate({ target: pyqInsightsCacheTable.userId, set: { insightsJson: insights, generatedAt: new Date() } });

    res.json({ insights, cached: false, generatedAt: new Date() });
  } catch (err: any) {
    console.error("pyq-insights error:", err);
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

export { router as analyticsRouter };
