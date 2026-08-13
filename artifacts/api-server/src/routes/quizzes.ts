import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizzesTable, questionsTable, quizAttemptsTable, activityTable, questionReportsTable, quizSubmissionsTable, quizAnswersTable } from "@workspace/db";
import { eq, sql, desc, and, or, isNull } from "drizzle-orm";
import { authMiddleware, adminMiddleware, superAdminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { updateStreak } from "../lib/streak";
import { stripHtml } from "../lib/sanitize";
import { awardXp, XP_VALUES } from "../lib/xp";
import rateLimit from "express-rate-limit";
import { explainQuizAnswer } from "../lib/aiGrading";

const SUBJECTIVE_TYPES = ["short_answer", "long_answer"];

const router = Router();

const attemptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 500 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many quiz attempts. Please wait before trying again." },
});

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reports. Please wait." },
});

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, difficulty } = req.query;
    const user = (req as any).user;
    const isAdmin = user?.role === "admin";

    // Students only see quizzes for their batch + shared (NULL) quizzes; fail closed if sessionYear unknown
    const batchFilter = isAdmin
      ? undefined
      : user?.sessionYear
        ? or(isNull(quizzesTable.sessionYear), eq(quizzesTable.sessionYear, user.sessionYear))
        : isNull(quizzesTable.sessionYear);

    let quizzes = await db.select().from(quizzesTable).where(batchFilter).limit(500);
    if (subject) quizzes = quizzes.filter(q => q.subject.toLowerCase() === (subject as string).toLowerCase());
    if (difficulty) quizzes = quizzes.filter(q => q.difficulty === difficulty);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, subject, description, difficulty, durationMinutes, isFeatured, sessionYear } = req.body;
    if (!title || !subject || !difficulty) { res.status(400).json({ error: "Missing fields" }); return; }
    const safeTitle = stripHtml(String(title));
    const safeSubject = stripHtml(String(subject));
    const safeDescription = description ? stripHtml(String(description)) : null;
    if (!safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (!safeSubject) { res.status(400).json({ error: "Invalid subject" }); return; }
    const safeSessionYear = sessionYear ? String(sessionYear) : null;
    const [quiz] = await db.insert(quizzesTable).values({
      title: safeTitle, subject: safeSubject, description: safeDescription, difficulty,
      durationMinutes: durationMinutes || null,
      isFeatured: isFeatured || false,
      sessionYear: safeSessionYear || null,
    }).returning();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/attempts/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const attempts = await db.select().from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.userId, user.id))
      .orderBy(desc(quizAttemptsTable.id))
      .limit(100);
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const reports = await db.select().from(questionReportsTable)
      .orderBy(desc(questionReportsTable.id))
      .limit(200);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI parse removed
router.post("/ai-parse", adminMiddleware, (_req: Request, res: Response) => {
  res.status(503).json({ error: "AI question parsing is currently unavailable." });
});

// ─── Wrong-answer explainer ───────────────────────────────────────────────────
const explainLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many explanation requests. Please slow down." },
});

router.post("/explain", authMiddleware, explainLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { questionId } = req.body;
    const qid = parseId(String(questionId ?? ""));
    if (!qid) { res.status(400).json({ error: "questionId is required" }); return; }

    // Verify the caller has a completed, recorded wrong answer for this question
    const [wrongAnswer] = await db
      .select()
      .from(quizAnswersTable)
      .where(and(
        eq(quizAnswersTable.userId, user.id),
        eq(quizAnswersTable.questionId, qid),
        eq(quizAnswersTable.correct, false)
      ))
      .limit(1);

    if (!wrongAnswer) {
      res.status(403).json({ error: "Explanations are only available for questions you answered incorrectly in a completed quiz." });
      return;
    }

    // Fetch the question — also verify its parent quiz is accessible to this batch
    const isAdmin = user?.role === "admin";
    const quizBatchCond = isAdmin
      ? undefined
      : user?.sessionYear
        ? or(isNull(quizzesTable.sessionYear), eq(quizzesTable.sessionYear, user.sessionYear))
        : isNull(quizzesTable.sessionYear);

    const [question] = await db
      .select({
        id: questionsTable.id,
        text: questionsTable.text,
        questionType: questionsTable.questionType,
        options: questionsTable.options,
        correctOption: questionsTable.correctOption,
        correctAnswer: questionsTable.correctAnswer,
        explanation: questionsTable.explanation,
      })
      .from(questionsTable)
      .innerJoin(quizzesTable, eq(questionsTable.quizId, quizzesTable.id))
      .where(quizBatchCond
        ? and(eq(questionsTable.id, qid), quizBatchCond)
        : eq(questionsTable.id, qid));
    if (!question) { res.status(404).json({ error: "Question not found" }); return; }

    // Build a label for the correct answer only — we never reveal options via client data
    let correctLabel = "";
    if (question.questionType === "mcq" || question.questionType === "true-false") {
      const opts = (question.options as string[] | null) ?? [];
      const correctIdx = question.correctOption ?? 0;
      correctLabel = opts[correctIdx]
        ? `${String.fromCharCode(65 + correctIdx)}. ${opts[correctIdx]}`
        : String(correctIdx);
    } else {
      correctLabel = question.correctAnswer ?? "";
    }

    const explanation = await explainQuizAnswer(
      question.text,
      correctLabel,
      "", // no client-supplied wrong answer — explanation focuses on why correct is right
      question.explanation ?? null
    );

    if (!explanation) {
      res.status(503).json({ error: "Could not generate explanation. Please try again." });
      return;
    }

    res.json({ explanation });
  } catch (err) {
    console.error("quiz explain error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/reports/:id/status", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { status } = req.body;
    if (!["pending", "reviewed", "resolved"].includes(status)) {
      res.status(400).json({ error: "Invalid status" }); return;
    }
    const [report] = await db.update(questionReportsTable)
      .set({ status })
      .where(eq(questionReportsTable.id, id))
      .returning();
    if (!report) { res.status(404).json({ error: "Not found" }); return; }
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid quiz ID" }); return; }
    const requestingUser = (req as any).user;
    const isAdmin = requestingUser?.role === "admin";
    // Students may only access quizzes for their batch or shared; fail closed when sessionYear unknown
    const batchCond = isAdmin
      ? eq(quizzesTable.id, id)
      : requestingUser?.sessionYear
        ? and(eq(quizzesTable.id, id), or(isNull(quizzesTable.sessionYear), eq(quizzesTable.sessionYear, requestingUser.sessionYear)))
        : and(eq(quizzesTable.id, id), isNull(quizzesTable.sessionYear));
    const [quiz] = await db.select().from(quizzesTable).where(batchCond);
    if (!quiz) { res.status(404).json({ error: "Not found" }); return; }
    const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, id));
    const sanitizedQuestions = isAdmin
      ? questions
      : questions.map(({ correctOption, correctAnswer, explanation, ...rest }) => rest);
    res.json({ ...quiz, questions: sanitizedQuestions });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid quiz ID" }); return; }
    const caller = (req as any).user;
    const { title, subject, description, difficulty, durationMinutes, isFeatured, isProctored, sessionYear } = req.body;
    const safeTitle = title !== undefined ? stripHtml(String(title)) : undefined;
    const safeSubject = subject !== undefined ? stripHtml(String(subject)) : undefined;
    const safeDescription = description !== undefined ? (description ? stripHtml(String(description)) : null) : undefined;
    const updates: Record<string, any> = { title: safeTitle, subject: safeSubject, description: safeDescription, difficulty, durationMinutes, isFeatured };
    if (sessionYear !== undefined) updates.sessionYear = sessionYear || null;
    // Only super admins can change proctored status
    if (caller.isSuperAdmin && isProctored !== undefined) {
      updates.isProctored = isProctored;
    }
    const [quiz] = await db.update(quizzesTable)
      .set(updates)
      .where(eq(quizzesTable.id, id))
      .returning();
    if (!quiz) { res.status(404).json({ error: "Not found" }); return; }
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid quiz ID" }); return; }
    await db.delete(questionsTable).where(eq(questionsTable.quizId, id));
    await db.delete(quizzesTable).where(eq(quizzesTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/questions/bulk", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const quizId = parseId(req.params.id);
    if (!quizId) { res.status(400).json({ error: "Invalid quiz ID" }); return; }
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: "questions must be a non-empty array" }); return;
    }
    if (questions.length > 200) {
      res.status(400).json({ error: "Cannot import more than 200 questions at once" }); return;
    }
    const inserted: any[] = [];
    for (const q of questions) {
      const { text, questionType = "mcq", options, correctOption, correctAnswer, explanation } = q;
      if (!text) continue;
      const safeText = stripHtml(String(text));
      if (!safeText) continue;
      const safeExplanation = explanation ? stripHtml(String(explanation)) : null;

      if (questionType === "mcq" || questionType === "true-false") {
        if (!Array.isArray(options) || options.length < 2 || correctOption === undefined) continue;
        const safeOptions = options.map((o: any) => stripHtml(String(o)));
        const [question] = await db.insert(questionsTable)
          .values({ quizId, text: safeText, questionType, options: safeOptions, correctOption, explanation: safeExplanation })
          .returning();
        inserted.push(question);
      } else {
        if (!correctAnswer) continue;
        const safeAnswer = stripHtml(String(correctAnswer));
        const [question] = await db.insert(questionsTable)
          .values({ quizId, text: safeText, questionType, options: null, correctOption: null, correctAnswer: safeAnswer, explanation: safeExplanation })
          .returning();
        inserted.push(question);
      }
    }
    await db.update(quizzesTable)
      .set({ questionCount: sql`${quizzesTable.questionCount} + ${inserted.length}` })
      .where(eq(quizzesTable.id, quizId));
    res.status(201).json({ imported: inserted.length, questions: inserted });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/questions", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const quizId = parseId(req.params.id);
    if (!quizId) { res.status(400).json({ error: "Invalid quiz ID" }); return; }
    const { text, questionType = "mcq", options, correctOption, correctAnswer, explanation } = req.body;
    if (!text) { res.status(400).json({ error: "text is required" }); return; }
    const safeText = stripHtml(String(text));
    if (!safeText) { res.status(400).json({ error: "Invalid question text" }); return; }
    const safeExplanation = explanation ? stripHtml(String(explanation)) : null;

    const { maxMarks, modelAnswer } = req.body;
    let question;
    if (SUBJECTIVE_TYPES.includes(questionType)) {
      const safeModelAnswer = modelAnswer ? stripHtml(String(modelAnswer)).slice(0, 2000) : null;
      const marks = maxMarks ? Math.max(1, Math.min(20, parseInt(maxMarks))) : 5;
      [question] = await db.insert(questionsTable)
        .values({ quizId, text: safeText, questionType, options: null, correctOption: null, correctAnswer: null, explanation: safeExplanation, maxMarks: marks, modelAnswer: safeModelAnswer })
        .returning();
    } else if (questionType === "mcq" || questionType === "true-false") {
      if (!options || !Array.isArray(options) || options.length < 2 || correctOption === undefined) {
        res.status(400).json({ error: "options (array) and correctOption are required for MCQ/True-False" }); return;
      }
      const safeOptions = options.map((o: any) => stripHtml(String(o)));
      [question] = await db.insert(questionsTable)
        .values({ quizId, text: safeText, questionType, options: safeOptions, correctOption, explanation: safeExplanation })
        .returning();
    } else {
      if (!correctAnswer) { res.status(400).json({ error: "correctAnswer is required for write-in question types" }); return; }
      const safeAnswer = stripHtml(String(correctAnswer));
      [question] = await db.insert(questionsTable)
        .values({ quizId, text: safeText, questionType, options: null, correctOption: null, correctAnswer: safeAnswer, explanation: safeExplanation })
        .returning();
    }
    await db.update(quizzesTable)
      .set({ questionCount: sql`${quizzesTable.questionCount} + 1` })
      .where(eq(quizzesTable.id, quizId));
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/questions/:qid", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const quizId = parseId(req.params.id);
    const qid = parseId(req.params.qid);
    if (!quizId || !qid) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { text, questionType, options, correctOption, correctAnswer, explanation, maxMarks, modelAnswer } = req.body;
    const safeText = text !== undefined ? stripHtml(String(text)) : undefined;
    const safeOptions = Array.isArray(options) ? options.map((o: any) => stripHtml(String(o))) : undefined;
    const safeAnswer = correctAnswer !== undefined ? (correctAnswer ? stripHtml(String(correctAnswer)) : null) : undefined;
    const safeExplanation = explanation !== undefined ? (explanation ? stripHtml(String(explanation)) : null) : undefined;
    const safeModelAnswer = modelAnswer !== undefined ? (modelAnswer ? stripHtml(String(modelAnswer)).slice(0, 2000) : null) : undefined;
    const safeMaxMarks = maxMarks !== undefined ? Math.max(1, Math.min(20, parseInt(maxMarks))) : undefined;
    const [question] = await db.update(questionsTable)
      .set({
        text: safeText, questionType,
        options: SUBJECTIVE_TYPES.includes(questionType) ? null : safeOptions,
        correctOption: SUBJECTIVE_TYPES.includes(questionType) ? null : correctOption,
        correctAnswer: SUBJECTIVE_TYPES.includes(questionType) ? null : safeAnswer,
        explanation: safeExplanation,
        maxMarks: safeMaxMarks,
        modelAnswer: safeModelAnswer,
      })
      .where(eq(questionsTable.id, qid))
      .returning();
    if (!question) { res.status(404).json({ error: "Not found" }); return; }
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/questions/:qid/tags", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const quizId = parseId(req.params.id);
    const qid = parseId(req.params.qid);
    if (!quizId || !qid) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { tags } = req.body;
    if (!Array.isArray(tags)) { res.status(400).json({ error: "tags must be an array" }); return; }
    const cleanTags = tags.map((t: any) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 20);
    const [question] = await db.update(questionsTable)
      .set({ topicTags: cleanTags })
      .where(eq(questionsTable.id, qid))
      .returning({ id: questionsTable.id, topicTags: questionsTable.topicTags });
    if (!question) { res.status(404).json({ error: "Not found" }); return; }
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id/questions/:qid", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const quizId = parseId(req.params.id);
    const qid = parseId(req.params.qid);
    if (!quizId || !qid) { res.status(400).json({ error: "Invalid ID" }); return; }
    const deleted = await db.delete(questionsTable).where(eq(questionsTable.id, qid)).returning();
    if (deleted.length > 0) {
      await db.update(quizzesTable)
        .set({ questionCount: sql`GREATEST(${quizzesTable.questionCount} - 1, 0)` })
        .where(eq(quizzesTable.id, quizId));
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/questions/:qid/report", authMiddleware, reportLimiter, async (req: Request, res: Response) => {
  try {
    const quizId = parseId(req.params.id);
    const questionId = parseId(req.params.qid);
    if (!quizId || !questionId) { res.status(400).json({ error: "Invalid ID" }); return; }
    const user = (req as any).user;
    const { reason, details } = req.body;
    if (!reason) { res.status(400).json({ error: "reason is required" }); return; }
    const safeReason = stripHtml(String(reason)).slice(0, 200);
    const safeDetails = details ? stripHtml(String(details)).slice(0, 1000) : null;
    const [report] = await db.insert(questionReportsTable)
      .values({ userId: user.id, questionId, quizId, reason: safeReason, details: safeDetails })
      .returning();
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/quizzes/attempts/:id/review
 * Returns the full question list with correct answers for a specific past attempt.
 * Only the student who owns the attempt can access this.
 */
router.get("/attempts/:id/review", authMiddleware, async (req: Request, res: Response) => {
  try {
    const attemptId = parseId(req.params.id);
    if (!attemptId) { res.status(400).json({ error: "Invalid attempt ID" }); return; }
    const user = (req as any).user;

    const [attempt] = await db.select().from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.id, attemptId));

    if (!attempt) { res.status(404).json({ error: "Attempt not found" }); return; }
    if (attempt.userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }

    // Also verify the quiz is accessible to the student's batch (fail closed)
    const isAdmin = user?.role === "admin";
    const batchCond = isAdmin
      ? eq(quizzesTable.id, attempt.quizId)
      : user?.sessionYear
        ? and(eq(quizzesTable.id, attempt.quizId), or(isNull(quizzesTable.sessionYear), eq(quizzesTable.sessionYear, user.sessionYear)))
        : and(eq(quizzesTable.id, attempt.quizId), isNull(quizzesTable.sessionYear));

    const [quiz] = await db.select({
      id: quizzesTable.id,
      title: quizzesTable.title,
      subject: quizzesTable.subject,
      difficulty: quizzesTable.difficulty,
      durationMinutes: quizzesTable.durationMinutes,
      description: quizzesTable.description,
    }).from(quizzesTable).where(batchCond);

    if (!quiz) { res.status(404).json({ error: "Quiz not found" }); return; }

    const questions = await db.select().from(questionsTable)
      .where(eq(questionsTable.quizId, attempt.quizId));

    res.json({ attempt, quiz, questions });
  } catch (err) {
    console.error("Review endpoint error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/attempt", authMiddleware, attemptLimiter, async (req: Request, res: Response) => {
  try {
    const quizId = parseId(req.params.id);
    if (!quizId) { res.status(400).json({ error: "Invalid quiz ID" }); return; }
    const user = (req as any).user;
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length > 500) {
      res.status(400).json({ error: "Invalid answers payload" }); return;
    }

    const batchCond = user?.role === "admin"
      ? eq(quizzesTable.id, quizId)
      : user?.sessionYear
        ? and(eq(quizzesTable.id, quizId), or(isNull(quizzesTable.sessionYear), eq(quizzesTable.sessionYear, user.sessionYear)))
        : and(eq(quizzesTable.id, quizId), isNull(quizzesTable.sessionYear));
    const [quiz] = await db.select().from(quizzesTable).where(batchCond);
    if (!quiz) { res.status(404).json({ error: "Quiz not found" }); return; }
    const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, quizId));

    const subjectiveQuestions = questions.filter(q => SUBJECTIVE_TYPES.includes(q.questionType));
    const gradedQuestions = questions.filter(q => !SUBJECTIVE_TYPES.includes(q.questionType));

    let score = 0;
    const correctAnswers = gradedQuestions.map(q => {
      const answer = answers.find((a: any) => a.questionId === q.id);
      let correct = false;
      const correctOption = q.correctOption;
      const correctAnswerText = q.correctAnswer;

      if (q.questionType === "mcq" || q.questionType === "true-false") {
        correct = answer?.selectedOption !== undefined && answer.selectedOption === q.correctOption;
      } else {
        const userAnswer = answer?.writtenAnswer ?? "";
        correct = normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer ?? "");
      }

      if (correct) score++;
      return { questionId: q.id, correct, correctOption, correctAnswerText, explanation: q.explanation, questionType: q.questionType };
    });

    const total = gradedQuestions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const hasPending = subjectiveQuestions.length > 0;

    const [attempt] = await db.insert(quizAttemptsTable).values({
      userId: user.id, quizId, quizTitle: quiz.title, subject: quiz.subject,
      score, total, percentage, hasPending,
    }).returning();

    if (hasPending && attempt) {
      const submissionValues = subjectiveQuestions.map(q => {
        const answer = answers.find((a: any) => a.questionId === q.id);
        return {
          userId: user.id,
          quizId,
          attemptId: attempt.id,
          questionId: q.id,
          answerText: answer?.answerText ? String(answer.answerText).slice(0, 5000) : null,
          answerImageUrl: answer?.answerImageUrl ? String(answer.answerImageUrl) : null,
          maxMarks: q.maxMarks ?? 5,
          status: "pending" as const,
        };
      });
      await db.insert(quizSubmissionsTable).values(submissionValues);
    }

    if (attempt) {
      const answerRows = correctAnswers.map(a => ({
        userId: user.id,
        quizId,
        attemptId: attempt.id,
        questionId: a.questionId,
        subject: quiz.subject,
        questionType: a.questionType,
        correct: a.correct,
      }));
      if (answerRows.length > 0) {
        await db.insert(quizAnswersTable).values(answerRows).catch(err => console.error("quiz_answers insert failed:", err));
      }
    }

    await db.insert(activityTable).values({
      userId: user.id,
      type: "quiz",
      description: `Completed quiz: ${quiz.title}`,
      score: hasPending
        ? `${score}/${total} MCQ + ${subjectiveQuestions.length} subjective pending`
        : `${score}/${total} (${percentage}%)`,
    });

    await updateStreak(user.id);
    const xpEarned = XP_VALUES.QUIZ_COMPLETE + score * XP_VALUES.CORRECT_ANSWER;
    const xpResult = await awardXp(user.id, xpEarned, "quiz_complete", `Completed quiz: ${quiz.title} (${score}/${total})`).catch(() => ({ rankUp: false, newRankName: "", newXp: 0 }));

    const pendingSubmissions = subjectiveQuestions.map(q => ({
      questionId: q.id,
      questionText: q.text,
      maxMarks: q.maxMarks ?? 5,
      questionType: q.questionType,
    }));

    res.json({
      score, total, percentage,
      passed: total > 0 ? percentage >= 60 : false,
      correctAnswers,
      hasPending,
      pendingCount: subjectiveQuestions.length,
      pendingSubmissions,
      xpEarned,
      rankUp: xpResult.rankUp,
      newRankName: xpResult.newRankName,
      totalXp: xpResult.newXp,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
