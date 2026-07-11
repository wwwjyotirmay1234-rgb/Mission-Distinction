import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "@workspace/db";
import { db } from "@workspace/db";
import { booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { getPdfText } from "./aiDoubt";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getGcsBucket } from "../lib/gcs";
import { CBME_CONTEXT } from "../lib/cbmeContext";

const router = Router();

const generateLimiter = rateLimit({ windowMs: 5 * 60_000, max: 3, standardHeaders: true, legacyHeaders: false });

const OPENAI_TIMEOUT_MS = 180_000;

function startSse(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  (res as any).flushHeaders?.();
  const send = (event: Record<string, unknown>) => res.write(`data: ${JSON.stringify(event)}\n\n`);
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 15_000);
  const stop = () => clearInterval(heartbeat);
  return { send, stop };
}

async function downloadBookBuffer(url: string): Promise<Buffer> {
  const serveMatch = url.match(/\/api\/upload\/pdf\/serve\/(.+)$/);
  if (serveMatch) {
    const fileName = serveMatch[1];
    const bucket = getGcsBucket();
    const [buf] = await bucket.file(`pdfs/${fileName}`).download();
    return buf as Buffer;
  }
  // Fallback: external URL
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Mission-Distinction/1.0)" },
    });
    if (!resp.ok) throw new Error(`Download failed (${resp.status})`);
    return Buffer.from(await resp.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

// ── Admin: generate one-liners + tables from a book PDF (SSE) ─────────────────
router.post("/generate/:bookId", adminMiddleware, generateLimiter, async (req: Request, res: Response) => {
  const { send, stop } = startSse(res);
  try {
    const bookId = parseId(req.params.bookId);
    if (!bookId) { send({ type: "error", message: "Invalid book ID" }); return; }
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, bookId));
    if (!book) { send({ type: "error", message: "Book not found" }); return; }

    send({ type: "status", message: "Downloading book PDF…" });
    const buffer = await downloadBookBuffer(book.url);

    send({ type: "status", message: "Extracting text from PDF…" });
    const { text, pages } = await getPdfText(buffer);
    if (!text || text.length < 50) {
      send({ type: "error", message: "Could not extract readable text from this PDF. It may be a scanned image-only file." });
      return;
    }

    const capped = text.length > 300_000
      ? text.slice(0, 300_000) + "\n\n[Truncated]"
      : text;

    send({ type: "status", message: `Extracted ${pages} pages. Running AI extraction…` });

    const prompt = `You are an expert Indian MBBS examiner extracting high-yield revision content from a ${book.subject} textbook titled "${book.title}".

Your task: extract TWO types of content from the ENTIRE book text below.

TYPE 1 — HIGH-YIELD ONE-LINERS:
Extract the most important, exam-frequently-tested single facts. These should be:
- Key values/numbers (e.g. "Normal blood pH = 7.35–7.45")
- Important definitions (e.g. "Kwashiorkor = protein deficiency with adequate calories")  
- Critical clinical correlations (e.g. "Most common cause of portal hypertension = liver cirrhosis")
- Important named phenomena/laws/syndromes with their key fact
Aim for 40–80 high-yield one-liners covering all major chapters.

TYPE 2 — IMPORTANT TABLES:
Extract or reconstruct important tables that are commonly tested. Format each as a clean markdown table.
Examples: classification tables, comparison tables, enzyme tables, nerve supply tables, developmental timelines.
Aim for 8–15 important tables.

For both types, identify the chapter/topic they belong to.

Return ONLY valid JSON of this exact shape:
{
  "oneLiners": [
    { "chapter": "Chapter name", "content": "Key fact = value or Key fact: explanation" }
  ],
  "tables": [
    { "chapter": "Chapter name", "title": "Table title", "content": "| Col1 | Col2 |\\n|---|---|\\n| val | val |" }
  ]
}

IMPORTANT: Cover as many chapters as possible. Do not truncate.

--- BOOK TEXT ---
${capped}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `You are a meticulous MBBS medical education assistant. Always respond with valid JSON only.\n\n${CBME_CONTEXT}` },
        { role: "user", content: prompt },
      ],
    }, { signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS) });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) { send({ type: "error", message: "AI returned no content." }); return; }
    const parsed: { oneLiners: { chapter: string; content: string }[]; tables: { chapter: string; title: string; content: string }[] } = JSON.parse(raw);

    send({ type: "status", message: "Saving results to database…" });

    // Clear previous items for this book, then insert fresh
    const client = await pool.connect();
    try {
      await client.query("DELETE FROM ai_revision_items WHERE book_id = $1", [bookId]);
      for (const item of (parsed.oneLiners || [])) {
        await client.query(
          "INSERT INTO ai_revision_items (book_id, subject, chapter, type, title, content) VALUES ($1,$2,$3,'one_liner',NULL,$4)",
          [bookId, book.subject, item.chapter || "General", item.content],
        );
      }
      for (const item of (parsed.tables || [])) {
        await client.query(
          "INSERT INTO ai_revision_items (book_id, subject, chapter, type, title, content) VALUES ($1,$2,$3,'table',$4,$5)",
          [bookId, book.subject, item.chapter || "General", item.title || "Table", item.content],
        );
      }
    } finally {
      client.release();
    }

    send({
      type: "done",
      oneLinersCount: (parsed.oneLiners || []).length,
      tablesCount: (parsed.tables || []).length,
      bookTitle: book.title,
      subject: book.subject,
    });
  } catch (err: any) {
    console.error("[revision-items/generate]", err?.message);
    send({ type: "error", message: err?.message || "Generation failed. Please try again." });
  } finally {
    stop();
    res.end();
  }
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
