import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "@workspace/db";
import { pdfsTable, booksTable, pyqsTable } from "@workspace/db";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const pdfParse = _require("pdf-parse") as (
  buffer: Buffer,
  options?: { max?: number }
) => Promise<{ text: string; numpages: number }>;

const router = Router();

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const MEDDY_SYSTEM_PROMPT = `You are Meddy — Mission Distinction's smart app assistant. You help MBBS students navigate and get the most from this medical education platform.

## WHAT YOU HELP WITH:
- Finding resources: PDFs, Notes, Books, PYQs available in the app
- Explaining app features (how to use quizzes, bookmarks, study rooms, AI tools, etc.)
- Analysing specific documents when their content is provided in <DOCUMENT> tags — count topics, find years, search questions, summarise chapters
- Navigation questions: "where do I find X?", "how do I Y?"
- Platform info: features, how things work

## WHAT YOU REDIRECT (politely):
- Exam MCQ answers, theory exam questions, NEET PG prep questions → tell them to use the **AI Doubt** section (the full medical AI tutor) or the **Doubts** page
- Say something like: "For exam questions and medical theory, use our AI Doubt section — it's powered by Claude and GPT-4o and gives detailed exam-ready answers!"

## DOCUMENT ANALYSIS (when <DOCUMENT> tags present):
- Read provided text carefully — it may be a PYQ paper, book chapter, or lecture note
- Answer the exact question: counts, years, topics, patterns, summaries
- Be precise — if the user asks "how many questions from Neuroanatomy", count them
- If text seems incomplete (scanned PDF with limited extraction), say so and do your best
- Cite specific questions/lines from the document in your answer

## STYLE:
- Friendly, concise, helpful
- Use bullet points for lists
- Bold key information
- No lengthy preambles — get to the answer quickly
- End with a helpful follow-up suggestion when relevant`;

function sanitize(val: unknown, max: number): string | null {
  if (typeof val !== "string") return null;
  const t = val.trim().replace(/[\x00-\x1F\x7F]/g, " ").slice(0, max);
  return t || null;
}

// ── List all resources ─────────────────────────────────────────────────────
router.get("/resources", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const [pdfs, books, pyqs] = await Promise.all([
      db.select({
        id: pdfsTable.id, title: pdfsTable.title,
        subject: pdfsTable.subject, url: pdfsTable.url,
      }).from(pdfsTable).limit(200),
      db.select({
        id: booksTable.id, title: booksTable.title,
        subject: booksTable.subject, url: booksTable.url,
      }).from(booksTable).limit(200),
      db.select({
        id: pyqsTable.id, title: pyqsTable.title,
        subject: pyqsTable.subject, year: pyqsTable.year,
        url: pyqsTable.url,
      }).from(pyqsTable).limit(200),
    ]);
    res.json({ pdfs, books, pyqs });
  } catch {
    res.status(500).json({ error: "Failed to load resources" });
  }
});

// ── Extract text from a PDF URL ────────────────────────────────────────────
router.post("/extract-pdf", authMiddleware, limiter, async (req: Request, res: Response) => {
  const rawUrl = sanitize(req.body.url, 2000);
  if (!rawUrl) { res.status(400).json({ error: "url required" }); return; }

  let url = rawUrl;

  // Rewrite Google Drive view/share URLs to download URLs
  const driveMatch = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    url = `https://drive.usercontent.google.com/download?id=${driveMatch[1]}&export=download&confirm=t`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 Mission-Distinction-Bot/1.0" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(400).json({ error: `Could not fetch PDF (HTTP ${response.status}). The file may not be publicly accessible.` });
      return;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("pdf") && !contentType.includes("octet-stream") && !contentType.includes("application/")) {
      res.status(400).json({ error: "URL does not appear to be a PDF file." });
      return;
    }

    // Limit download to 15 MB to keep extraction fast
    const MAX_BYTES = 15 * 1024 * 1024;
    const reader = response.body?.getReader();
    if (!reader) { res.status(500).json({ error: "Could not read response body" }); return; }

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.length;
      if (total >= MAX_BYTES) break;
    }
    reader.cancel().catch(() => {});

    const buffer = Buffer.concat(chunks);
    if (buffer.length < 8) { res.status(400).json({ error: "File too small to be a valid PDF." }); return; }

    // Verify PDF magic bytes
    const magic = buffer.slice(0, 4).toString("ascii");
    if (!magic.startsWith("%PDF")) {
      res.status(400).json({ error: "File is not a valid PDF (bad magic bytes). It may be a scanned image or restricted file." });
      return;
    }

    const parsed = await pdfParse(buffer, { max: 60 });
    const text = (parsed.text as string).trim();

    if (!text || text.length < 50) {
      res.json({
        text: "",
        pages: parsed.numpages as number,
        warning: "This appears to be a scanned PDF — text could not be extracted. Meddy will try to answer from general knowledge.",
      });
      return;
    }

    // Truncate to 80k chars to stay within token limits
    const truncated = text.length > 80_000 ? text.slice(0, 80_000) + "\n\n[Document truncated — showing first 80,000 characters]" : text;

    res.json({ text: truncated, pages: parsed.numpages as number, chars: truncated.length });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      res.status(408).json({ error: "PDF download timed out (25s). The file may be too large or slow to access." });
    } else {
      res.status(500).json({ error: "Failed to extract PDF text. The file may be restricted or corrupted." });
    }
  }
});

// ── Meddy chat (streaming SSE) ─────────────────────────────────────────────
router.post("/chat", authMiddleware, limiter, async (req: Request, res: Response) => {
  const message = sanitize(req.body.message, 4000) ?? "";
  const documentText = sanitize(req.body.documentText, 80_000) ?? "";
  const documentTitle = sanitize(req.body.documentTitle, 200) ?? "";
  const rawHistory: { role: string; content: string }[] = Array.isArray(req.body.history)
    ? req.body.history : [];

  if (!message) { res.status(400).json({ error: "message required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const history = rawHistory
    .slice(-8)
    .filter(h => (h.role === "user" || h.role === "assistant") && h.content?.trim())
    .map(h => ({ role: h.role as "user" | "assistant", content: h.content.slice(0, 2000) }));

  let userContent = message;
  if (documentText && documentTitle) {
    userContent = `I have a question about a document from the app.\n\nDocument: **${documentTitle}**\n\n<DOCUMENT>\n${documentText}\n</DOCUMENT>\n\nMy question: ${message}`;
  }

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 2048,
      stream: true,
      messages: [
        { role: "system", content: MEDDY_SYSTEM_PROMPT },
        ...history,
        { role: "user", content: userContent },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("[Meddy chat]", err?.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Meddy is unavailable right now. Please try again." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Meddy ran into an issue. Please try again." })}\n\n`);
      res.end();
    }
  }
});

export { router as meddyRouter };
