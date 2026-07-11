import { Router, Request, Response } from "express";
import { pool } from "@workspace/db";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";

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
    if (!testRes.rows[0]) return res.status(404).json({ error: "not found" });
    const qRes = await client.query("SELECT * FROM grand_test_questions WHERE test_id=$1 ORDER BY order_index", [req.params.id]);
    res.json({ ...testRes.rows[0], questions: qRes.rows });
  } finally { client.release(); }
});

// ─── Admin: create grand test ─────────────────────────────────────────────────
router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  const { title, subject, description, durationMinutes, availableFrom, availableUntil } = req.body;
  if (!title || !subject) return res.status(400).json({ error: "title and subject required" });
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
    if (!rows[0]) return res.status(404).json({ error: "not found" });
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
  if (!questionText) return res.status(400).json({ error: "questionText required" });
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
          'answerText', gta.answer_text, 'aiMarks', gta.ai_marks,
          'aiFeedback', gta.ai_feedback,
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
    if (!testRes.rows[0]) return res.status(404).json({ error: "not found" });
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
    if (!testRes.rows[0]) return res.status(404).json({ error: "not found" });
    const existing = await client.query(
      "SELECT * FROM grand_test_submissions WHERE test_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 1",
      [req.params.id, userId]
    );
    if (existing.rows[0] && existing.rows[0].status !== "in_progress") {
      return res.status(409).json({ error: "already_submitted", submissionId: existing.rows[0].id });
    }
    if (existing.rows[0]) return res.json({ submissionId: existing.rows[0].id, resuming: true });
    const { rows } = await client.query(
      "INSERT INTO grand_test_submissions (test_id, user_id) VALUES ($1,$2) RETURNING *",
      [req.params.id, userId]
    );
    res.json({ submissionId: rows[0].id });
  } finally { client.release(); }
});

// ─── Student: submit + AI grade via SSE ──────────────────────────────────────
router.post("/submissions/:submissionId/submit", authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { answers } = req.body as { answers: { questionId: number; answerText: string }[] };
  const client = await pool.connect();

  try {
    const subRes = await client.query(
      `SELECT gts.*, gt.duration_minutes, gt.title, gt.subject
       FROM grand_test_submissions gts
       JOIN grand_tests gt ON gt.id=gts.test_id
       WHERE gts.id=$1 AND gts.user_id=$2`,
      [req.params.submissionId, userId]
    );
    if (!subRes.rows[0]) { client.release(); return res.status(404).json({ error: "not found" }); }
    if (subRes.rows[0].status !== "in_progress") { client.release(); return res.status(409).json({ error: "already_submitted" }); }
    const sub = subRes.rows[0];

    const qRes = await client.query(
      "SELECT * FROM grand_test_questions WHERE test_id=$1 ORDER BY order_index",
      [sub.test_id]
    );
    const questions = qRes.rows;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    send({ type: "status", message: "Saving your answers…" });

    await client.query(
      "UPDATE grand_test_submissions SET status='submitted', submitted_at=NOW() WHERE id=$1",
      [sub.id]
    );

    const totalPossible = questions.reduce((s: number, q: any) => s + q.max_marks, 0);
    let totalObtained = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const studentAnswer = answers?.find((a: any) => a.questionId === q.id)?.answerText || "";

      send({ type: "grading", questionIndex: i, total: questions.length, message: `Grading Q${i + 1}/${questions.length}…` });

      const prompt = `You are an MBBS university examiner grading a ${q.question_type === "long" ? "long answer" : "short answer"} question.

Subject: ${sub.subject}
Question: ${q.question_text}
Maximum Marks: ${q.max_marks}
${q.model_answer ? `Key Points / Model Answer: ${q.model_answer}` : ""}

Student's Answer:
${studentAnswer || "(No answer provided)"}

Grade strictly but fairly as a CBME-based examiner. Respond ONLY with a valid JSON object:
{
  "marks": <integer 0 to ${q.max_marks}>,
  "feedback": "<2-3 sentences of specific feedback>",
  "keyPointsCovered": "<comma-separated key points correctly mentioned, or 'None'>",
  "keyPointsMissed": "<comma-separated key points missing, or 'None'>"
}`;

      let aiMarks = 0;
      let aiFeedback = "Could not grade.";
      let covered = "None";
      let missed = "None";

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 400,
        });
        const parsed = JSON.parse(completion.choices[0].message.content || "{}");
        aiMarks = Math.max(0, Math.min(q.max_marks, parseInt(parsed.marks) || 0));
        aiFeedback = parsed.feedback || "";
        covered = parsed.keyPointsCovered || "None";
        missed = parsed.keyPointsMissed || "None";
      } catch { /* keep defaults */ }

      await client.query(
        `INSERT INTO grand_test_answers
         (submission_id, question_id, answer_text, ai_marks, ai_feedback, ai_key_points_covered, ai_key_points_missed, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'graded')`,
        [sub.id, q.id, studentAnswer, aiMarks, aiFeedback, covered, missed]
      );

      totalObtained += aiMarks;
      send({ type: "graded", questionIndex: i, marks: aiMarks, maxMarks: q.max_marks });
    }

    const pct = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

    let overallFeedback = `You scored ${totalObtained}/${totalPossible} (${pct}%).`;
    try {
      const oc = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `You are an MBBS examiner. A student scored ${totalObtained}/${totalPossible} (${pct}%) on the "${sub.title}" grand test (${sub.subject}). Write 2-3 sentences of overall performance feedback with one specific improvement tip.`
        }],
        max_tokens: 200,
      });
      overallFeedback = oc.choices[0].message.content || overallFeedback;
    } catch { /* keep default */ }

    await client.query(
      `UPDATE grand_test_submissions
       SET status='graded', total_marks_obtained=$1, total_marks_possible=$2, ai_overall_feedback=$3
       WHERE id=$4`,
      [totalObtained, totalPossible, overallFeedback, sub.id]
    );

    send({ type: "done", submissionId: sub.id, totalObtained, totalPossible, percentage: pct, overallFeedback });
    res.end();
  } catch (err) {
    try { res.write(`data: ${JSON.stringify({ type: "error", message: "Grading failed." })}\n\n`); res.end(); } catch { /* already closed */ }
  } finally { client.release(); }
});

// ─── Student: get submission result ──────────────────────────────────────────
router.get("/submissions/:submissionId", authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const client = await pool.connect();
  try {
    const subRes = await client.query(
      `SELECT gts.*, gt.title, gt.subject, gt.duration_minutes
       FROM grand_test_submissions gts
       JOIN grand_tests gt ON gt.id = gts.test_id
       WHERE gts.id=$1 AND gts.user_id=$2`,
      [req.params.submissionId, userId]
    );
    if (!subRes.rows[0]) return res.status(404).json({ error: "not found" });
    const aRes = await client.query(
      `SELECT gta.*, gtq.question_text, gtq.max_marks, gtq.order_index, gtq.question_type
       FROM grand_test_answers gta
       JOIN grand_test_questions gtq ON gtq.id = gta.question_id
       WHERE gta.submission_id=$1
       ORDER BY gtq.order_index`,
      [req.params.submissionId]
    );
    res.json({ ...subRes.rows[0], answers: aRes.rows });
  } finally { client.release(); }
});

export { router as grandTestsRouter };
