import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizAnswersTable, questionsTable, quizzesTable, examsTable, studyPlansTable, dailyQuestionsTable, usersTable, vivaHistoryTable, pyqsTable, pyqInsightsCacheTable } from "@workspace/db";
import { sendPushToUser } from "./push";
import { adminMiddleware } from "../middlewares/auth";
import { eq, and, gte, sql, desc, or, isNull } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

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
    // Apply batch filter when fetching quizzes — students only see their batch + shared
    const isAdmin = user?.role === "admin";
    const quizBatchCond = isAdmin
      ? sql`${quizzesTable.id} = ANY(${quizIds})`
      : user?.sessionYear
        ? and(sql`${quizzesTable.id} = ANY(${quizIds})`, or(isNull(quizzesTable.sessionYear), eq(quizzesTable.sessionYear, user.sessionYear)))
        : and(sql`${quizzesTable.id} = ANY(${quizIds})`, isNull(quizzesTable.sessionYear));
    const quizzes = await db.select().from(quizzesTable).where(quizBatchCond);
    const quizMap = new Map(quizzes.map(q => [q.id, q]));

    const mistakes = wrongAnswers
      .map(w => {
        const q = questionMap.get(w.questionId);
        const quiz = quizMap.get(w.quizId);
        // Exclude questions from quizzes outside the student's batch
        if (!q || (!isAdmin && !quiz)) return null;
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
      (() => {
        // Filter upcoming exams by batch — shared (NULL session_year) or matching; fail closed
        const examIsAdmin = (user as any)?.role === "admin";
        const examSessionCond = examIsAdmin
          ? undefined
          : (user as any)?.sessionYear
            ? or(isNull(examsTable.sessionYear), eq(examsTable.sessionYear, (user as any).sessionYear))
            : isNull(examsTable.sessionYear);
        return db.select({ examDate: examsTable.examDate })
          .from(examsTable)
          .where(and(eq(examsTable.isGlobal, true), gte(examsTable.examDate, new Date()), examSessionCond))
          .orderBy(examsTable.examDate)
          .limit(1);
      })(),
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
router.post("/study-plan/generate", authMiddleware, async (req: Request, res: Response) => {
  res.status(503).json({ error: "Study plan generation is currently unavailable." });
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

router.get("/question-of-day", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const dateKey = todayKey();
    const [existing] = await db
      .select()
      .from(dailyQuestionsTable)
      .where(and(eq(dailyQuestionsTable.userId, user.id), eq(dailyQuestionsTable.dateKey, dateKey)));
    if (!existing) {
      res.status(404).json({ error: "No question available today." });
      return;
    }
    res.json(existing);
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

router.post("/question-of-day/broadcast", authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  res.status(503).json({ error: "Question broadcast is currently unavailable." });
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
    const isAdmin = user?.role === "admin";
    const breakdownBatchCond = isAdmin
      ? sql`${quizzesTable.id} = ANY(${quizIds})`
      : user?.sessionYear
        ? and(sql`${quizzesTable.id} = ANY(${quizIds})`, or(isNull(quizzesTable.sessionYear), eq(quizzesTable.sessionYear, user.sessionYear)))
        : and(sql`${quizzesTable.id} = ANY(${quizIds})`, isNull(quizzesTable.sessionYear));
    const quizzes = await db
      .select({ id: quizzesTable.id, title: quizzesTable.title })
      .from(quizzesTable)
      .where(breakdownBatchCond);
    const quizMap = new Map(quizzes.map(q => [q.id, q.title]));

    // Only show breakdown rows for accessible quizzes
    const breakdown = filtered
      .filter(r => quizMap.has(r.quizId))
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

    // 1. All PYQs with their topic tags — batch-filtered so only accessible content is used
    const isAdmin = user?.role === "admin";
    const pyqBatchCond = isAdmin
      ? undefined
      : user?.sessionYear
        ? or(isNull(pyqsTable.sessionYear), eq(pyqsTable.sessionYear, user.sessionYear))
        : isNull(pyqsTable.sessionYear);
    const quizBatchCond = isAdmin
      ? undefined
      : user?.sessionYear
        ? or(isNull(quizzesTable.sessionYear), eq(quizzesTable.sessionYear, user.sessionYear))
        : isNull(quizzesTable.sessionYear);
    const allPyqs = await db.select({ subject: pyqsTable.subject, year: pyqsTable.year, topicTags: pyqsTable.topicTags })
      .from(pyqsTable).where(pyqBatchCond);

    // 2. Build PYQ tag → { subject, years } frequency map
    const tagPyqMap = new Map<string, { subject: string; years: Set<string>; pyqCount: number }>();
    for (const pyq of allPyqs) {
      for (const tag of ((pyq.topicTags as string[]) ?? [])) {
        if (!tagPyqMap.has(tag)) tagPyqMap.set(tag, { subject: pyq.subject, years: new Set(), pyqCount: 0 });
        const e = tagPyqMap.get(tag)!;
        e.years.add(pyq.year);
        e.pyqCount++;
      }
    }

    // If no tags exist yet, return early
    if (tagPyqMap.size === 0) {
      res.json({ patterns: [], totalYears: 0, hasTags: false });
      return;
    }

    // 3. Get quiz questions that carry any PYQ tag — only from accessible quizzes
    const taggedQuestions = await db
      .select({ id: questionsTable.id, topicTags: questionsTable.topicTags })
      .from(questionsTable)
      .innerJoin(quizzesTable, eq(questionsTable.quizId, quizzesTable.id))
      .where(and(
        sql`${questionsTable.topicTags} IS NOT NULL AND array_length(${questionsTable.topicTags}, 1) > 0`,
        quizBatchCond
      ));

    // 4. Build questionId → tags lookup
    const questionTagMap = new Map<number, string[]>();
    for (const q of taggedQuestions) {
      questionTagMap.set(q.id, (q.topicTags as string[]) ?? []);
    }

    // 5. Get this student's quiz answers for those questions
    const taggedQIds = taggedQuestions.map(q => q.id);
    let tagAccMap = new Map<string, { correct: number; total: number }>();

    if (taggedQIds.length > 0) {
      const studentAnswers = await db
        .select({ questionId: quizAnswersTable.questionId, correct: quizAnswersTable.correct })
        .from(quizAnswersTable)
        .where(and(eq(quizAnswersTable.userId, user.id), sql`${quizAnswersTable.questionId} = ANY(${taggedQIds})`));

      for (const ans of studentAnswers) {
        const tags = questionTagMap.get(ans.questionId) ?? [];
        for (const tag of tags) {
          if (!tagAccMap.has(tag)) tagAccMap.set(tag, { correct: 0, total: 0 });
          const acc = tagAccMap.get(tag)!;
          acc.total++;
          if (ans.correct) acc.correct++;
        }
      }
    }

    const totalYears = new Set(allPyqs.map(p => p.year)).size || 1;

    const patterns = Array.from(tagPyqMap.entries())
      .map(([tag, { subject, years, pyqCount }]) => {
        const acc = tagAccMap.get(tag);
        return {
          tag,
          subject,
          pyqFrequency: pyqCount,
          distinctYears: years.size,
          totalYears,
          studentQuestionAccuracy: acc && acc.total >= 1 ? Math.round((acc.correct / acc.total) * 100) : null,
          studentQuestionCount: acc?.total ?? 0,
        };
      })
      .sort((a, b) => b.distinctYears - a.distinctYears || b.pyqFrequency - a.pyqFrequency);

    res.json({ patterns, totalYears, hasTags: patterns.length > 0 });
  } catch (err) {
    console.error("pyq-patterns error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PYQ AI Insights — disabled (AI removed) ──────────────────────────────────
router.get("/pyq-insights", authMiddleware, async (req: Request, res: Response) => {
  res.status(503).json({ error: "PYQ AI insights are currently unavailable." });
});

export { router as analyticsRouter };
