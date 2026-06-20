import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizzesTable, questionsTable, quizAttemptsTable, activityTable, questionReportsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { updateStreak } from "../lib/streak";
import { stripHtml } from "../lib/sanitize";
import rateLimit from "express-rate-limit";

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
    let quizzes = await db.select().from(quizzesTable).limit(500);
    if (subject) quizzes = quizzes.filter(q => q.subject.toLowerCase() === (subject as string).toLowerCase());
    if (difficulty) quizzes = quizzes.filter(q => q.difficulty === difficulty);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, subject, description, difficulty, durationMinutes, isFeatured } = req.body;
    if (!title || !subject || !difficulty) { res.status(400).json({ error: "Missing fields" }); return; }
    const safeTitle = stripHtml(String(title));
    const safeSubject = stripHtml(String(subject));
    const safeDescription = description ? stripHtml(String(description)) : null;
    if (!safeTitle) { res.status(400).json({ error: "Invalid title" }); return; }
    if (!safeSubject) { res.status(400).json({ error: "Invalid subject" }); return; }
    const [quiz] = await db.insert(quizzesTable).values({
      title: safeTitle, subject: safeSubject, description: safeDescription, difficulty,
      durationMinutes: durationMinutes || null,
      isFeatured: isFeatured || false,
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
    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, id));
    if (!quiz) { res.status(404).json({ error: "Not found" }); return; }
    const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, id));
    const requestingUser = (req as any).user;
    const isAdmin = requestingUser?.role === "admin";
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
    const { title, subject, description, difficulty, durationMinutes, isFeatured } = req.body;
    const safeTitle = title !== undefined ? stripHtml(String(title)) : undefined;
    const safeSubject = subject !== undefined ? stripHtml(String(subject)) : undefined;
    const safeDescription = description !== undefined ? (description ? stripHtml(String(description)) : null) : undefined;
    const [quiz] = await db.update(quizzesTable)
      .set({ title: safeTitle, subject: safeSubject, description: safeDescription, difficulty, durationMinutes, isFeatured })
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

    let question;
    if (questionType === "mcq" || questionType === "true-false") {
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
    const { text, questionType, options, correctOption, correctAnswer, explanation } = req.body;
    const safeText = text !== undefined ? stripHtml(String(text)) : undefined;
    const safeOptions = Array.isArray(options) ? options.map((o: any) => stripHtml(String(o))) : undefined;
    const safeAnswer = correctAnswer !== undefined ? (correctAnswer ? stripHtml(String(correctAnswer)) : null) : undefined;
    const safeExplanation = explanation !== undefined ? (explanation ? stripHtml(String(explanation)) : null) : undefined;
    const [question] = await db.update(questionsTable)
      .set({ text: safeText, questionType, options: safeOptions, correctOption, correctAnswer: safeAnswer, explanation: safeExplanation })
      .where(eq(questionsTable.id, qid))
      .returning();
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

router.post("/:id/attempt", authMiddleware, attemptLimiter, async (req: Request, res: Response) => {
  try {
    const quizId = parseId(req.params.id);
    if (!quizId) { res.status(400).json({ error: "Invalid quiz ID" }); return; }
    const user = (req as any).user;
    const { answers } = req.body;

    const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId));
    if (!quiz) { res.status(404).json({ error: "Quiz not found" }); return; }
    const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, quizId));

    let score = 0;
    const correctAnswers = questions.map(q => {
      const answer = answers.find((a: any) => a.questionId === q.id);
      let correct = false;
      let correctOption = q.correctOption;
      let correctAnswerText = q.correctAnswer;

      if (q.questionType === "mcq" || q.questionType === "true-false") {
        correct = answer?.selectedOption !== undefined && answer.selectedOption === q.correctOption;
      } else {
        const userAnswer = answer?.writtenAnswer ?? "";
        correct = normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer ?? "");
      }

      if (correct) score++;
      return { questionId: q.id, correct, correctOption, correctAnswerText, explanation: q.explanation, questionType: q.questionType };
    });

    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    await db.insert(quizAttemptsTable).values({
      userId: user.id, quizId, quizTitle: quiz.title, subject: quiz.subject,
      score, total, percentage,
    });

    await db.insert(activityTable).values({
      userId: user.id,
      type: "quiz",
      description: `Completed quiz: ${quiz.title}`,
      score: `${score}/${total} (${percentage}%)`,
    });

    await updateStreak(user.id);

    res.json({ score, total, percentage, passed: percentage >= 60, correctAnswers });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
