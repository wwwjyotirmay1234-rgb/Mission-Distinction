import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";

const router = Router();

// Public — no auth required.
// Returns aggregate content counts for each core subject so public landing
// pages can show real numbers without exposing any gated content.
router.get("/public/stats", async (_req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    try {
      const subjects = ["Anatomy", "Physiology", "Biochemistry"];

      const counts = await Promise.all(
        subjects.map(async (subject) => {
          const [quizRow, noteRow, pyqRow, gtRow, videoRow] = await Promise.all([
            client.query(
              "SELECT COUNT(*)::int AS cnt FROM quizzes WHERE LOWER(subject) = LOWER($1)",
              [subject]
            ),
            client.query(
              "SELECT COUNT(*)::int AS cnt FROM notes WHERE LOWER(subject) = LOWER($1)",
              [subject]
            ),
            client.query(
              "SELECT COUNT(*)::int AS cnt FROM pyqs WHERE LOWER(subject) = LOWER($1)",
              [subject]
            ),
            client.query(
              "SELECT COUNT(*)::int AS cnt FROM grand_tests WHERE LOWER(subject) = LOWER($1)",
              [subject]
            ),
            client.query(
              "SELECT COUNT(*)::int AS cnt FROM videos WHERE LOWER(subject) = LOWER($1)",
              [subject]
            ),
          ]);

          return {
            subject,
            quizCount:      quizRow.rows[0].cnt  as number,
            noteCount:      noteRow.rows[0].cnt  as number,
            pyqCount:       pyqRow.rows[0].cnt   as number,
            grandTestCount: gtRow.rows[0].cnt    as number,
            videoCount:     videoRow.rows[0].cnt as number,
          };
        })
      );

      res.json({ subjects: counts });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[public/stats] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as publicStatsRouter };
