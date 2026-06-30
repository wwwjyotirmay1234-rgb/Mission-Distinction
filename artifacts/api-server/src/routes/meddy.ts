import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "@workspace/db";
import { pdfsTable, booksTable, pyqsTable } from "@workspace/db";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
// pdf-parse v1 exports a plain function via CJS — use createRequire to avoid
// esbuild resolving the ESM entry (which has no default export).
const pdfParse: (buf: Buffer, opts?: { max?: number }) => Promise<{ text: string; numpages: number }> =
  _require("pdf-parse");

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
- Analysing specific documents when their content is provided in <DOCUMENT> tags
- Navigation questions: "where do I find X?", "how do I Y?"
- Chapter/topic lookup: "which chapter is radioactivity in Vasudevan?" — scan the document and answer

## WHAT YOU REDIRECT (politely):
- Exam MCQ answers, theory exam questions, NEET PG prep → tell them to use the **AI Doubt** section
- Say: "For exam questions and medical theory, use our AI Doubt section — powered by Claude and GPT-4o!"

## DOCUMENT ANALYSIS — CRITICAL ACCURACY RULES:
You have access to the full document in <DOCUMENT> tags AND pre-extracted <FOCUSED_SECTIONS> that are the most relevant excerpts for this query.

**Rule 1 — Always search for the exact topic first:**
When asked about a specific chapter or topic (e.g. "Neuroanatomy", "Abdomen", "radioactivity"), you MUST scan the document for that EXACT word/phrase. Do NOT answer from a different chapter. If "Neuroanatomy" is the query, only return content from the Neuroanatomy section.

**Rule 2 — Use FOCUSED_SECTIONS as your primary source:**
The <FOCUSED_SECTIONS> block contains pre-searched excerpts most relevant to the query. Prioritise these over the raw document. Quote directly from them.

**Rule 3 — Never fabricate or substitute:**
If you cannot find the requested chapter/topic in the document text, say so explicitly: "I couldn't find a section labelled [X] in this document. The document may not cover this topic, or it may be in a portion that wasn't extracted." Do NOT give questions from a different chapter as if they were from the requested one.

**Rule 4 — Chapter location queries:**
For "which chapter is X in" or "where is X" queries: search the document for the term X, then look backwards in the text for the nearest chapter/section heading above it. Report that heading as the answer. Quote the surrounding lines.

**Rule 5 — IAT / exam paper queries:**
For "questions from IAT 3 from Neuroanatomy" — look for "IAT 3" or "Internal Assessment Test 3" section AND "Neuroanatomy" within it. If both conditions aren't met together in the document, say which part is missing.

**Rule 6 — Be precise with counts:**
If asked "how many questions from X", count only those explicitly in the X section. State the count and list them.

## STYLE:
- Friendly, concise, helpful
- Use bullet points for lists
- Bold key information
- Quote the actual document lines/questions you find
- No lengthy preambles — get to the answer quickly
- If the document text was truncated, mention it and suggest the student checks the full PDF`;

/**
 * Pre-searches a document for query keywords and extracts the most relevant
 * surrounding passages. This gives GPT-4o a highlighted "spotlight" on the
 * relevant parts of the document rather than having it read top-to-bottom.
 */
function extractTopicSections(docText: string, query: string, maxSections = 6): string {
  if (!docText || !query) return "";

  // Pull meaningful keywords from the query (skip stop words, keep medical terms)
  const stopWords = new Set(["the", "a", "an", "and", "or", "of", "from", "in", "is", "are",
    "find", "give", "show", "list", "what", "where", "which", "how", "many", "all", "any",
    "me", "my", "for", "to", "about", "with", "this", "that", "do", "can", "has", "have",
    "questions", "question", "chapter", "section", "topics", "topic", "paper", "exam"]);

  const keywords = query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.has(w));

  if (keywords.length === 0) return "";

  const lowerDoc = docText.toLowerCase();

  // Also search for multi-word phrases (e.g. "neuroanatomy", "iat 3")
  const phrases: string[] = [];
  // IAT pattern: "iat 1", "iat 2", "iat 3", "internal assessment"
  const iatMatch = query.match(/\biat\s*([1-9])\b/i);
  if (iatMatch) phrases.push(`iat ${iatMatch[1]}`, `iat-${iatMatch[1]}`, `internal assessment`);
  // Medical textbook terms
  const textbookMatch = query.match(/\b(vasudevan|harper|gray|snell|guyton|robbins|harrisons?|devlin|satoskar)\b/i);
  if (textbookMatch) phrases.push(textbookMatch[1].toLowerCase());

  const allTerms = [...new Set([...keywords, ...phrases])];

  // Find all match positions with context window
  const CONTEXT = 1200; // chars before and after match
  const hits: { pos: number; text: string; score: number }[] = [];

  for (const term of allTerms) {
    let pos = 0;
    while (pos < lowerDoc.length) {
      const idx = lowerDoc.indexOf(term, pos);
      if (idx === -1) break;

      const start = Math.max(0, idx - CONTEXT);
      const end = Math.min(docText.length, idx + CONTEXT + term.length);
      const excerpt = docText.slice(start, end);

      // Score this excerpt by how many of our terms appear in it
      const score = allTerms.reduce((s, t) => s + (excerpt.toLowerCase().includes(t) ? 1 : 0), 0);
      hits.push({ pos: idx, text: excerpt, score });

      pos = idx + Math.max(1, term.length);
      if (hits.length > 200) break; // safety cap
    }
  }

  if (hits.length === 0) return "";

  // Sort by score descending, then deduplicate overlapping windows
  hits.sort((a, b) => b.score - a.score);

  const selected: typeof hits = [];
  for (const hit of hits) {
    const overlaps = selected.some(s => Math.abs(s.pos - hit.pos) < CONTEXT);
    if (!overlaps) {
      selected.push(hit);
      if (selected.length >= maxSections) break;
    }
  }

  // Sort selected back into document order for readability
  selected.sort((a, b) => a.pos - b.pos);

  return selected.map((s, i) => `--- Excerpt ${i + 1} (position ~${s.pos} in document) ---\n${s.text}`).join("\n\n");
}

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
    const focused = extractTopicSections(documentText, message, 6);
    const focusedBlock = focused
      ? `\n\n<FOCUSED_SECTIONS note="Pre-searched excerpts most relevant to the query — USE THESE AS PRIMARY SOURCE">\n${focused}\n</FOCUSED_SECTIONS>`
      : "";
    userContent = `I have a question about a document from the app.\n\nDocument: **${documentTitle}**\n\n<DOCUMENT>\n${documentText}\n</DOCUMENT>${focusedBlock}\n\nMy question: ${message}`;
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
