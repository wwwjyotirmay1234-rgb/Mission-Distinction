import { Router, Request, Response } from "express";
import { pool } from "@workspace/db";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";

const router = Router();

// ─── Admin: list all grand tests ─────────────────────────────────────────────
router.get("/admin", adminMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT gt.*,
        COUNT(DISTINCT gtq.id)::int AS question_count,
        COUNT(DISTINCT gts.id)::int AS submission_count
      FROM grand_tests gt
      LEFT JOIN grand_test_questions gtq ON gtq.test_id = gt.id
      LEFT JOIN grand_test_submissions gts ON gts.test_id = gt.id
      GROUP BY gt.id
      ORDER BY gt.created_at DESC
    `);
    res.json(rows);
  } finally { client.release(); }
});

// ─── Admin: get single test with questions ────────────────────────────────────
router.get("/admin/:id", adminMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const testRes = await client.query("SELECT * FROM grand_tests WHERE id=$1", [req.params.id]);
    if (!testRes.rows[0]) { res.status(404).json({ error: "not found" }); return; }
    const qRes = await client.query("SELECT * FROM grand_test_questions WHERE test_id=$1 ORDER BY order_index", [req.params.id]);
    res.json({ ...testRes.rows[0], questions: qRes.rows });
  } finally { client.release(); }
});

// ─── Admin: create grand test ─────────────────────────────────────────────────
router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  const { title, subject, description, durationMinutes, availableFrom, availableUntil } = req.body;
  if (!title || !subject) { res.status(400).json({ error: "title and subject required" }); return; }
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `INSERT INTO grand_tests (title, subject, description, duration_minutes, available_from, available_until, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, subject, description || null, durationMinutes || 180, availableFrom || null, availableUntil || null, (req as any).user?.id]
    );
    res.status(201).json(rows[0]);
  } finally { client.release(); }
});

// ─── Admin: update grand test ─────────────────────────────────────────────────
router.put("/:id", adminMiddleware, async (req: Request, res: Response) => {
  const { title, subject, description, durationMinutes, availableFrom, availableUntil, isPublished } = req.body;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE grand_tests SET title=COALESCE($1,title), subject=COALESCE($2,subject),
       description=COALESCE($3,description), duration_minutes=COALESCE($4,duration_minutes),
       available_from=$5, available_until=$6,
       is_published=COALESCE($7,is_published)
       WHERE id=$8 RETURNING *`,
      [title, subject, description, durationMinutes, availableFrom || null, availableUntil || null, isPublished, req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: "not found" }); return; }
    res.json(rows[0]);
  } finally { client.release(); }
});

// ─── Admin: delete grand test ─────────────────────────────────────────────────
router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM grand_tests WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } finally { client.release(); }
});

// ─── Admin: add question ──────────────────────────────────────────────────────
router.post("/:id/questions", adminMiddleware, async (req: Request, res: Response) => {
  const { questionText, questionType, maxMarks, modelAnswer } = req.body;
  if (!questionText) { res.status(400).json({ error: "questionText required" }); return; }
  const client = await pool.connect();
  try {
    const orderRes = await client.query(
      "SELECT COALESCE(MAX(order_index),0)+1 AS next FROM grand_test_questions WHERE test_id=$1",
      [req.params.id]
    );
    const { rows } = await client.query(
      `INSERT INTO grand_test_questions (test_id, question_text, question_type, max_marks, order_index, model_answer)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, questionText, questionType || "long", maxMarks || 10, orderRes.rows[0].next, modelAnswer || null]
    );
    res.status(201).json(rows[0]);
  } finally { client.release(); }
});

// ─── Admin: update question ───────────────────────────────────────────────────
router.put("/:id/questions/:qid", adminMiddleware, async (req: Request, res: Response) => {
  const { questionText, questionType, maxMarks, modelAnswer } = req.body;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE grand_test_questions SET
       question_text=COALESCE($1,question_text), question_type=COALESCE($2,question_type),
       max_marks=COALESCE($3,max_marks), model_answer=COALESCE($4,model_answer)
       WHERE id=$5 AND test_id=$6 RETURNING *`,
      [questionText, questionType, maxMarks, modelAnswer, req.params.qid, req.params.id]
    );
    res.json(rows[0] || {});
  } finally { client.release(); }
});

// ─── Admin: delete question ───────────────────────────────────────────────────
router.delete("/:id/questions/:qid", adminMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM grand_test_questions WHERE id=$1 AND test_id=$2", [req.params.qid, req.params.id]);
    res.json({ ok: true });
  } finally { client.release(); }
});

// ─── Admin: list submissions for a test ──────────────────────────────────────
router.get("/:id/submissions", adminMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT gts.*, u.name, u.email,
        json_agg(json_build_object(
          'id', gta.id, 'questionId', gta.question_id,
          'answerText', gta.answer_text, 'answerImageUrl', gta.answer_image_url,
          'aiMarks', gta.ai_marks, 'aiFeedback', gta.ai_feedback,
          'aiKeyPointsCovered', gta.ai_key_points_covered,
          'aiKeyPointsMissed', gta.ai_key_points_missed,
          'status', gta.status,
          'maxMarks', gtq.max_marks, 'questionText', gtq.question_text
        ) ORDER BY gtq.order_index) AS answers
      FROM grand_test_submissions gts
      JOIN users u ON u.id = gts.user_id
      LEFT JOIN grand_test_answers gta ON gta.submission_id = gts.id
      LEFT JOIN grand_test_questions gtq ON gtq.id = gta.question_id
      WHERE gts.test_id=$1
      GROUP BY gts.id, u.name, u.email
      ORDER BY gts.submitted_at DESC NULLS LAST
    `, [req.params.id]);
    res.json(rows);
  } finally { client.release(); }
});

// ─── Leaderboard: top scores for a test ──────────────────────────────────────
router.get("/:id/leaderboard", authMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT
        ROW_NUMBER() OVER (ORDER BY gts.total_marks_obtained DESC NULLS LAST, gts.submitted_at ASC) AS rank,
        u.name, u.email,
        gts.total_marks_obtained, gts.total_marks_possible,
        ROUND((gts.total_marks_obtained::numeric / NULLIF(gts.total_marks_possible,0)) * 100) AS percentage,
        gts.submitted_at
      FROM grand_test_submissions gts
      JOIN users u ON u.id = gts.user_id
      WHERE gts.test_id=$1 AND gts.status='graded'
      ORDER BY gts.total_marks_obtained DESC NULLS LAST, gts.submitted_at ASC
      LIMIT 50
    `, [req.params.id]);
    res.json(rows);
  } finally { client.release(); }
});

// ─── Student: list published grand tests ──────────────────────────────────────
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT gt.*,
        COUNT(DISTINCT gtq.id)::int AS question_count,
        (SELECT id FROM grand_test_submissions gts2
         WHERE gts2.test_id = gt.id AND gts2.user_id = $1
         ORDER BY gts2.created_at DESC LIMIT 1) AS my_submission_id,
        (SELECT status FROM grand_test_submissions gts3
         WHERE gts3.test_id = gt.id AND gts3.user_id = $1
         ORDER BY gts3.created_at DESC LIMIT 1) AS my_status
      FROM grand_tests gt
      LEFT JOIN grand_test_questions gtq ON gtq.test_id = gt.id
      WHERE gt.is_published = true
      GROUP BY gt.id
      ORDER BY gt.available_from DESC NULLS LAST, gt.created_at DESC
    `, [userId]);
    res.json(rows);
  } finally { client.release(); }
});

// ─── Student: get test detail + questions (no model answers) ──────────────────
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const testRes = await client.query("SELECT * FROM grand_tests WHERE id=$1 AND is_published=true", [req.params.id]);
    if (!testRes.rows[0]) { res.status(404).json({ error: "not found" }); return; }
    const qRes = await client.query(
      "SELECT id, question_text, question_type, max_marks, order_index FROM grand_test_questions WHERE test_id=$1 ORDER BY order_index",
      [req.params.id]
    );
    res.json({ ...testRes.rows[0], questions: qRes.rows });
  } finally { client.release(); }
});

// ─── Student: start attempt ───────────────────────────────────────────────────
router.post("/:id/start", authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const client = await pool.connect();
  try {
    const testRes = await client.query("SELECT * FROM grand_tests WHERE id=$1 AND is_published=true", [req.params.id]);
    if (!testRes.rows[0]) { res.status(404).json({ error: "not found" }); return; }

    // Enforce 24-hr availability window
    const test = testRes.rows[0];
    const now = new Date();
    if (test.available_from && new Date(test.available_from) > now) {
      res.status(403).json({ error: "test_not_open", message: "This test hasn't started yet." }); return;
    }
    if (test.available_until && new Date(test.available_until) < now) {
      res.status(403).json({ error: "test_closed", message: "This test window has closed." }); return;
    }

    const existing = await client.query(
      "SELECT * FROM grand_test_submissions WHERE test_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 1",
      [req.params.id, userId]
    );
    if (existing.rows[0] && existing.rows[0].status !== "in_progress") {
      res.status(409).json({ error: "already_submitted", submissionId: existing.rows[0].id }); return;
    }
    if (existing.rows[0]) { res.json({ submissionId: existing.rows[0].id, resuming: true }); return; }
    const { rows } = await client.query(
      "INSERT INTO grand_test_submissions (test_id, user_id) VALUES ($1,$2) RETURNING *",
      [req.params.id, userId]
    );
    res.json({ submissionId: rows[0].id });
  } finally { client.release(); }
});

// ─── Student: submit (AI grading removed — saves answers, marks as submitted) ─
router.post("/submissions/:submissionId/submit", authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { answers } = req.body as {
    answers: { questionId: number; answerText: string; imageUrl?: string }[];
  };
  const client = await pool.connect();

  try {
    const subRes = await client.query(
      `SELECT gts.*, gt.duration_minutes, gt.title, gt.subject
       FROM grand_test_submissions gts
       JOIN grand_tests gt ON gt.id=gts.test_id
       WHERE gts.id=$1 AND gts.user_id=$2`,
      [req.params.submissionId, userId]
    );
    if (!subRes.rows[0]) { res.status(404).json({ error: "not found" }); return; }
    if (subRes.rows[0].status !== "in_progress") { res.status(409).json({ error: "already_submitted" }); return; }
    const sub = subRes.rows[0];

    const qRes = await client.query(
      "SELECT * FROM grand_test_questions WHERE test_id=$1 ORDER BY order_index",
      [sub.test_id]
    );
    const questions = qRes.rows;

    await client.query(
      "UPDATE grand_test_submissions SET status='submitted', submitted_at=NOW() WHERE id=$1",
      [sub.id]
    );

    const totalPossible = questions.reduce((s: number, q: any) => s + q.max_marks, 0);

    for (const q of questions) {
      const submitted = answers?.find((a: any) => a.questionId === q.id);
      const studentText = submitted?.answerText || "";
      const imageUrl = submitted?.imageUrl || null;

      await client.query(
        `INSERT INTO grand_test_answers
         (submission_id, question_id, answer_text, answer_image_url, status)
         VALUES ($1,$2,$3,$4,'pending')`,
        [sub.id, q.id, studentText, imageUrl]
      );
    }

    await client.query(
      `UPDATE grand_test_submissions
       SET status='submitted', total_marks_possible=$1
       WHERE id=$2`,
      [totalPossible, sub.id]
    );

    res.json({
      submissionId: sub.id,
      totalPossible,
      message: "Submission saved. Manual grading by admin required.",
    });
  } catch (err) {
    res.status(500).json({ error: "Submission failed." });
  } finally { client.release(); }
});

// ─── Student: get submission result ──────────────────────────────────────────
router.get("/submissions/:submissionId", authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const client = await pool.connect();
  try {
    const subRes = await client.query(
      `SELECT gts.*, gt.title, gt.subject, gt.duration_minutes, gt.answers_released
       FROM grand_test_submissions gts
       JOIN grand_tests gt ON gt.id = gts.test_id
       WHERE gts.id=$1 AND gts.user_id=$2`,
      [req.params.submissionId, userId]
    );
    if (!subRes.rows[0]) { res.status(404).json({ error: "not found" }); return; }
    const answersReleased = subRes.rows[0].answers_released;
    const aRes = await client.query(
      `SELECT gta.*, gtq.question_text, gtq.max_marks, gtq.order_index, gtq.question_type
         ${answersReleased ? ", gtq.model_answer" : ", NULL::text AS model_answer"}
       FROM grand_test_answers gta
       JOIN grand_test_questions gtq ON gtq.id = gta.question_id
       WHERE gta.submission_id=$1
       ORDER BY gtq.order_index`,
      [req.params.submissionId]
    );
    res.json({ ...subRes.rows[0], answers: aRes.rows });
  } finally { client.release(); }
});

// ─── Admin: release / retract the answer key ─────────────────────────────────
router.patch("/:id/release-answers", adminMiddleware, async (req: Request, res: Response) => {
  const { release } = req.body as { release: boolean };
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE grand_tests SET answers_released=$1 WHERE id=$2 RETURNING id, answers_released`,
      [release !== false, req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ error: "not found" }); return; }
    res.json({ ok: true, answers_released: rows[0].answers_released });
  } finally { client.release(); }
});

// ─── Admin: manually grade a submission ──────────────────────────────────────
router.put("/submissions/:submissionId/grade", adminMiddleware, async (req: Request, res: Response) => {
  const { answers, overallFeedback } = req.body as {
    answers: { answerId: number; marks: number; feedback?: string }[];
    overallFeedback?: string;
  };
  if (!Array.isArray(answers)) { res.status(400).json({ error: "answers array required" }); return; }
  const client = await pool.connect();
  try {
    const subRes = await client.query(
      "SELECT * FROM grand_test_submissions WHERE id=$1",
      [req.params.submissionId]
    );
    if (!subRes.rows[0]) { res.status(404).json({ error: "not found" }); return; }

    let totalObtained = 0;
    for (const a of answers) {
      const marks = Math.max(0, Number(a.marks) || 0);
      totalObtained += marks;
      await client.query(
        `UPDATE grand_test_answers SET ai_marks=$1, ai_feedback=$2, status='graded' WHERE id=$3`,
        [marks, a.feedback || null, a.answerId]
      );
    }

    await client.query(
      `UPDATE grand_test_submissions
       SET status='graded', total_marks_obtained=$1, ai_overall_feedback=$2
       WHERE id=$3`,
      [totalObtained, overallFeedback || null, req.params.submissionId]
    );

    res.json({ ok: true, totalObtained });
  } catch (err) {
    res.status(500).json({ error: "Grading failed." });
  } finally { client.release(); }
});

export { router as grandTestsRouter };
