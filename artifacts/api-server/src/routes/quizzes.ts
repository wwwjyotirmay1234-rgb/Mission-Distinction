import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizzesTable, questionsTable, quizAttemptsTable, activityTable } from "@workspace/db";
import { eq, ilike, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { updateStreak } from "../lib/streak";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, difficulty } = req.query;
    let quizzes = await db.select().from(quizzesTable);
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
    const [quiz] = await db.insert(quizzesTable).values({
      title, subject, description, difficulty,
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
    const attempts = await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, user.id));
    res.json(attempts);
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
      : questions.map(({ correctOption, explanation, ...rest }) => rest);
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
    const [quiz] = await db.update(quizzesTable)
      .set({ title, subject, description, difficulty, durationMinutes, isFeatured })
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
      const { text, options, correctOption, explanation } = q;
      if (!text || !Array.isArray(options) || options.length < 2 || correctOption === undefined) continue;
      const [question] = await db.insert(questionsTable)
        .values({ quizId, text, options, correctOption, explanation: explanation || null })
        .returning();
      inserted.push(question);
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
    const { text, options, correctOption, explanation } = req.body;
    if (!text || !options || !Array.isArray(options) || options.length < 2 || correctOption === undefined) {
      res.status(400).json({ error: "text, options (array), and correctOption are required" }); return;
    }
    const [question] = await db.insert(questionsTable)
      .values({ quizId, text, options, correctOption, explanation: explanation || null })
      .returning();
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
    const { text, options, correctOption, explanation } = req.body;
    const [question] = await db.update(questionsTable)
      .set({ text, options, correctOption, explanation: explanation || null })
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

router.post("/:id/attempt", authMiddleware, async (req: Request, res: Response) => {
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
      const correct = answer?.selectedOption === q.correctOption;
      if (correct) score++;
      return { questionId: q.id, correct, correctOption: q.correctOption, explanation: q.explanation };
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
