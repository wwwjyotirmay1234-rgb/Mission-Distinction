import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizSubmissionsTable, questionsTable, quizzesTable } from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { pool } from "@workspace/db";

const router = Router();

const SUBJECTIVE_TYPES = ["short_answer", "long_answer"];

router.get("/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status } = req.query;

    const client = await pool.connect();
    try {
      let whereClause = `qs.user_id = $1`;
      const params: any[] = [user.id];
      if (status && ["pending", "ai_graded", "graded"].includes(status as string)) {
        whereClause += ` AND qs.status = $2`;
        params.push(status);
      }

      const result = await client.query(
        `SELECT
          qs.*,
          q.text AS question_text,
          q.max_marks AS question_max_marks,
          qz.title AS quiz_title,
          qz.subject AS quiz_subject
        FROM quiz_submissions qs
        LEFT JOIN questions q ON q.id = qs.question_id
        LEFT JOIN quizzes qz ON qz.id = qs.quiz_id
        WHERE ${whereClause}
        ORDER BY qs.created_at DESC
        LIMIT 100`,
        params
      );
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/all", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, quizId } = req.query;
    const client = await pool.connect();
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (status && ["pending", "ai_graded", "graded"].includes(status as string)) {
        conditions.push(`qs.status = $${idx++}`);
        params.push(status);
      }
      if (quizId) {
        const qid = parseInt(quizId as string);
        if (!isNaN(qid)) {
          conditions.push(`qs.quiz_id = $${idx++}`);
          params.push(qid);
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const result = await client.query(
        `SELECT
          qs.*,
          q.text AS question_text,
          q.max_marks AS question_max_marks,
          q.model_answer,
          qz.title AS quiz_title,
          qz.subject AS quiz_subject,
          u.full_name AS student_name,
          u.email AS student_email
        FROM quiz_submissions qs
        LEFT JOIN questions q ON q.id = qs.question_id
        LEFT JOIN quizzes qz ON qz.id = qs.quiz_id
        LEFT JOIN users u ON u.id = qs.user_id
        ${whereClause}
        ORDER BY qs.created_at DESC
        LIMIT 200`,
        params
      );
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/ai-grade", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id as string);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [submission] = await db.select().from(quizSubmissionsTable).where(eq(quizSubmissionsTable.id, id));
    if (!submission) { res.status(404).json({ error: "Submission not found" }); return; }

    const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, submission.questionId));
    if (!question) { res.status(404).json({ error: "Question not found" }); return; }

    const maxMarks = submission.maxMarks;
    const modelAnswer = question.modelAnswer || "";
    const studentAnswer = submission.answerText || "";

    if (!studentAnswer && !submission.answerImageUrl) {
      await db.update(quizSubmissionsTable)
        .set({ aiMarks: 0, aiFeedback: "No answer provided.", status: "ai_graded", gradedAt: new Date() })
        .where(eq(quizSubmissionsTable.id, id));
      res.json({ aiMarks: 0, aiFeedback: "No answer provided.", status: "ai_graded" });
      return;
    }

    const questionType = question.questionType === "short_answer" ? "Short Answer" : "Long Answer";
    const systemPrompt = `You are a medical examiner grading a ${questionType} question for 1st Year MBBS students. Grade objectively and fairly. Always return valid JSON only.`;

    const userPrompt = `Question: ${question.text}

${modelAnswer ? `Model Answer / Key Points: ${modelAnswer}` : ""}

Student's Answer: ${studentAnswer || "(No typed answer — see image if provided)"}

Maximum Marks: ${maxMarks}

Grade this answer out of ${maxMarks} marks. Consider:
- Accuracy of medical facts
- Completeness of key points
- Clarity of expression
- For partial answers, award partial marks proportionally

Return JSON only: {"marks": <number 0-${maxMarks}>, "feedback": "<2-3 sentence constructive feedback explaining the grade>"}`;

    const messages: any[] = [{ role: "user", content: userPrompt }];

    if (submission.answerImageUrl) {
      messages[0].content = [
        { type: "text", text: userPrompt },
        { type: "image_url", image_url: { url: submission.answerImageUrl } },
      ];
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_completion_tokens: 300,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || '{"marks":0,"feedback":"Unable to grade."}';
    let parsed: { marks: number; feedback: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { marks: 0, feedback: "AI grading failed — please grade manually." };
    }

    const aiMarks = Math.max(0, Math.min(maxMarks, Math.round(parsed.marks)));
    const aiFeedback = parsed.feedback || "";

    const [updated] = await db.update(quizSubmissionsTable)
      .set({ aiMarks, aiFeedback, status: "ai_graded", gradedAt: new Date() })
      .where(eq(quizSubmissionsTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    console.error("AI grading error:", err);
    res.status(500).json({ error: "AI grading failed" });
  }
});

router.patch("/:id/grade", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id as string);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const { adminMarks, adminFeedback } = req.body;
    if (adminMarks === undefined || adminMarks === null) {
      res.status(400).json({ error: "adminMarks is required" }); return;
    }

    const [submission] = await db.select().from(quizSubmissionsTable).where(eq(quizSubmissionsTable.id, id));
    if (!submission) { res.status(404).json({ error: "Submission not found" }); return; }

    const marks = Math.max(0, Math.min(submission.maxMarks, parseInt(adminMarks)));

    const [updated] = await db.update(quizSubmissionsTable)
      .set({
        adminMarks: marks,
        adminFeedback: adminFeedback ? String(adminFeedback).slice(0, 1000) : null,
        status: "graded",
        gradedAt: new Date(),
      })
      .where(eq(quizSubmissionsTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as quizSubmissionsRouter, SUBJECTIVE_TYPES };
