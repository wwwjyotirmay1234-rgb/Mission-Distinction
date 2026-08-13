import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { quizSubmissionsTable, questionsTable, quizzesTable } from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { pool } from "@workspace/db";

const router = Router();

const SUBJECTIVE_TYPES = ["short_answer", "long_answer"];

router.get("/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, attemptId } = req.query;

    const client = await pool.connect();
    try {
      const conditions: string[] = [`qs.user_id = $1`];
      const params: any[] = [user.id];
      let idx = 2;
      if (status && ["pending", "ai_graded", "graded"].includes(status as string)) {
        conditions.push(`qs.status = $${idx++}`);
        params.push(status);
      }
      if (attemptId) {
        const aid = parseInt(attemptId as string);
        if (!isNaN(aid)) { conditions.push(`qs.attempt_id = $${idx++}`); params.push(aid); }
      }

      const result = await client.query(
        `SELECT
          qs.*,
          q.text AS question_text,
          q.max_marks AS question_max_marks,
          q.model_answer,
          qz.title AS quiz_title,
          qz.subject AS quiz_subject
        FROM quiz_submissions qs
        LEFT JOIN questions q ON q.id = qs.question_id
        LEFT JOIN quizzes qz ON qz.id = qs.quiz_id
        WHERE ${conditions.join(" AND ")}
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

// AI grading removed — endpoint returns 503
router.post("/:id/ai-grade", adminMiddleware, (_req: Request, res: Response) => {
  res.status(503).json({ error: "AI grading is currently unavailable. Please grade manually." });
});

router.patch("/:id/grade", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id as string);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

    const { adminMarks, adminFeedback, adminLacking } = req.body;
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
        adminLacking: adminLacking ? String(adminLacking).slice(0, 2000) : null,
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
