import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { vivaQuestionsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";

const router = Router();

const VIVA_SUBJECTS = new Set(["Anatomy", "Physiology", "Biochemistry"]);

// Admin: list all questions, optionally filtered by subject
router.get("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject } = req.query;
    let questions = await db.select().from(vivaQuestionsTable).orderBy(asc(vivaQuestionsTable.subject), asc(vivaQuestionsTable.orderIndex));
    if (subject && typeof subject === "string") {
      questions = questions.filter((q) => q.subject === subject);
    }
    res.json(questions);
  } catch {
    res.status(500).json({ error: "Failed to load questions" });
  }
});

// Admin: create a question
router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { subject, questionText, topic, difficulty, orderIndex } = req.body;

    if (!subject || !VIVA_SUBJECTS.has(subject)) {
      res.status(400).json({ error: "subject must be one of Anatomy, Physiology, Biochemistry" });
      return;
    }
    const safeQuestionText = stripHtml(String(questionText || "")).trim().slice(0, 1000);
    if (!safeQuestionText) {
      res.status(400).json({ error: "questionText is required" });
      return;
    }
    const safeTopic = topic ? stripHtml(String(topic)).trim().slice(0, 200) : null;
    const safeDifficulty = difficulty ? stripHtml(String(difficulty)).trim().slice(0, 50) : null;
    const safeOrderIndex = Number.isFinite(Number(orderIndex)) ? Number(orderIndex) : 0;

    const [question] = await db.insert(vivaQuestionsTable).values({
      subject,
      questionText: safeQuestionText,
      topic: safeTopic,
      difficulty: safeDifficulty,
      orderIndex: safeOrderIndex,
      createdBy: admin.id,
    }).returning();

    res.status(201).json(question);
  } catch {
    res.status(500).json({ error: "Failed to create question" });
  }
});

// Admin: update a question
router.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const { subject, questionText, topic, difficulty, orderIndex } = req.body;
    const updates: Partial<typeof vivaQuestionsTable.$inferInsert> = {};

    if (subject !== undefined) {
      if (!VIVA_SUBJECTS.has(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }
      updates.subject = subject;
    }
    if (questionText !== undefined) {
      const safeQuestionText = stripHtml(String(questionText)).trim().slice(0, 1000);
      if (!safeQuestionText) { res.status(400).json({ error: "questionText cannot be empty" }); return; }
      updates.questionText = safeQuestionText;
    }
    if (topic !== undefined) updates.topic = topic ? stripHtml(String(topic)).trim().slice(0, 200) : null;
    if (difficulty !== undefined) updates.difficulty = difficulty ? stripHtml(String(difficulty)).trim().slice(0, 50) : null;
    if (orderIndex !== undefined && Number.isFinite(Number(orderIndex))) updates.orderIndex = Number(orderIndex);

    const [updated] = await db.update(vivaQuestionsTable).set(updates).where(eq(vivaQuestionsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Question not found" }); return; }
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update question" });
  }
});

// Admin: delete a question
router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(vivaQuestionsTable).where(eq(vivaQuestionsTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete question" });
  }
});

export { router as vivaQuestionsRouter, VIVA_SUBJECTS };
