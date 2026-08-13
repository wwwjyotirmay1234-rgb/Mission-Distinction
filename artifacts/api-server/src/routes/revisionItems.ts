import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "@workspace/db";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";

const router = Router();

const generateLimiter = rateLimit({ windowMs: 5 * 60_000, max: 3, standardHeaders: true, legacyHeaders: false });

// ── Admin: generate one-liners + tables — AI removed, returns 503 ──────────────
router.post("/generate/:bookId", adminMiddleware, generateLimiter, (_req: Request, res: Response) => {
  res.status(503).json({ error: "AI revision item generation is currently unavailable." });
});

// ── List revision items (students + admin) ────────────────────────────────────
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, type, chapter, search } = req.query;
    const client = await pool.connect();
    try {
      let query = "SELECT * FROM ai_revision_items WHERE 1=1";
      const params: unknown[] = [];
      if (subject) { params.push(subject); query += ` AND subject ILIKE $${params.length}`; }
      if (type) { params.push(type); query += ` AND type = $${params.length}`; }
      if (chapter) { params.push(`%${chapter}%`); query += ` AND chapter ILIKE $${params.length}`; }
      if (search) { params.push(`%${search}%`); query += ` AND (content ILIKE $${params.length} OR chapter ILIKE $${params.length} OR title ILIKE $${params.length})`; }
      query += " ORDER BY subject, chapter, type, id LIMIT 2000";
      const result = await client.query(query, params);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[revision-items/list]", err?.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: delete a single item ───────────────────────────────────────────────
router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const client = await pool.connect();
    try {
      await client.query("DELETE FROM ai_revision_items WHERE id = $1", [id]);
    } finally {
      client.release();
    }
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin: clear all items for a book ─────────────────────────────────────────
router.delete("/by-book/:bookId", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const bookId = parseId(req.params.bookId);
    if (!bookId) { res.status(400).json({ error: "Invalid book ID" }); return; }
    const client = await pool.connect();
    try {
      const result = await client.query("DELETE FROM ai_revision_items WHERE book_id = $1 RETURNING id", [bookId]);
      res.json({ deleted: result.rowCount });
    } finally {
      client.release();
    }
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as revisionItemsRouter };
