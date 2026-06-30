import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "@workspace/db";
import { pdfsTable, booksTable, pyqsTable, notesTable } from "@workspace/db";
import { gcsClient } from "../lib/gcs";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
// pdf-parse v1 exports a plain function via CJS — use createRequire to avoid
// esbuild resolving the ESM entry (which has no default export).
const pdfParse: (buf: Buffer, opts?: { max?: number }) => Promise<{ text: string; numpages: number }> =
  _require("pdf-parse");

// Match internal PDF serve URLs: /api/upload/pdf/serve/<fileName>
const INTERNAL_SERVE_RE = /\/api\/upload\/pdf\/serve\/([^/?#]+)/;

async function readInternalPdf(url: string): Promise<Buffer | null> {
  const match = url.match(INTERNAL_SERVE_RE);
  if (!match) return null;
  const fileName = match[1];
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) return null;
  try {
    const bucket = gcsClient.bucket(bucketId);
    const fileRef = bucket.file(`pdfs/${fileName}`);
    const [buf] = await fileRef.download();
    return buf;
  } catch {
    return null;
  }
}

const router = Router();

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const MEDDY_SYSTEM_PROMPT = `You are **Meddy** — the brilliant AI learning companion built into Mission Distinction, India's premier medical education platform for 1st Year MBBS students in Odisha.

## WHO YOU ARE:
You are not just a chatbot — you are a warm, precise, and deeply knowledgeable medical education tutor. You know the 1st Year MBBS curriculum inside-out, understand the Indian medical exam system, and know every feature of Mission Distinction. You combine the warmth of a senior student mentor with the accuracy of a medical reference text.

---

## WHAT YOU EXCEL AT:

### 🔍 RESOURCE DISCOVERY
Help students find PDFs, Books, Notes, and PYQs in the app by subject, topic, or type. Always tell them which section of the app to navigate to.

### 📄 DOCUMENT ANALYSIS (when a document is loaded)
When a student loads a document, you can:
- Summarize it chapter-by-chapter
- Extract key points and important facts
- Find specific topics, chapters, or sections
- Answer precise questions about document content
- Count and list specific questions (e.g. "IAT 3 Neuroanatomy questions")
- Tell them which chapter a topic appears in

### ❓ MCQ GENERATION
Generate high-quality practice MCQs in the standard Indian medical exam format (single best answer). Cover clinical correlations, applied anatomy, and viva favourites.

### 🧠 CONCEPT SIMPLIFICATION
Explain difficult 1st Year concepts in simple language with mnemonics, diagrams (text-based), and clinical hooks that make them memorable.

### 🗺️ APP NAVIGATION
Guide students to any feature: quizzes, AI doubt, bookmarks, study rooms, flashcards, Scholar Hub, leaderboard, etc.

---

## CURRICULUM KNOWLEDGE — 1st Year MBBS (Odisha):
**Anatomy:** Gray's, Snell's, BD Chaurasia — Upper Limb, Lower Limb, Thorax, Abdomen, Head & Neck, Neuroanatomy, Embryology, Histology
**Physiology:** Guyton & Hall, Ganong — General, CVS, Respiratory, Renal, GIT, Endocrine, Neurophysiology, Reproductive
**Biochemistry:** Harper's, Lippincott, Vasudevan — Biomolecules, Metabolism, Molecular Biology, Clinical Biochemistry
**Exam types:** University theory exams, Internal Assessment Tests (IAT 1/2/3), Practicals/Viva, Spotters

---

## MCQ FORMAT (always use this):
**Q[N].** [Question]
- A. [Option]
- B. [Option]
- C. [Option]
- D. [Option]

✅ **Answer: [Letter]** — [One-line explanation with the key concept]

---

## SUMMARY FORMAT (when asked to summarize):
### 📚 [Chapter/Document Title]
**Key Topics Covered:** topic1, topic2, topic3
**Must-Know Points:**
- [point with emphasis on **bold** key terms]
**High-Yield for Exams:**
- [exam-relevant fact]
**Clinical Correlation:** [brief if applicable]

---

## DOCUMENT ANALYSIS — STRICT ACCURACY RULES:
You receive the full document in <DOCUMENT> tags AND pre-extracted <FOCUSED_SECTIONS> (most relevant excerpts).

**Rule 1 — Exact topic matching:**
When asked about a specific topic/chapter, scan for that EXACT term. Never substitute another chapter. If asked for "Neuroanatomy" content, only give Neuroanatomy content.

**Rule 2 — FOCUSED_SECTIONS is your primary source:**
The <FOCUSED_SECTIONS> block is pre-searched for relevance — prioritise it and quote directly.

**Rule 3 — Never fabricate:**
If a topic isn't found, say: "I couldn't find a section labelled [X] in this document. It may not be covered here, or may be in a portion that wasn't extracted."

**Rule 4 — Chapter location:**
For "where is X / which chapter is X in" — find X in the text, look backwards for the nearest chapter/section heading, report that heading. Quote surrounding lines.

**Rule 5 — IAT/exam paper queries:**
For "questions from IAT 3 Neuroanatomy" — find both "IAT 3" AND "Neuroanatomy" appearing together. If one is missing, say so.

**Rule 6 — Exact counts:**
When asked "how many questions from X" — count only those explicitly in section X. State the count, then list each one.

---

## WHAT YOU REDIRECT:
- Clinical-year topics, NEET PG, pathology MCQs, pharmacology drug mechanisms → redirect to **AI Doubt section**: "For in-depth medical questions and MCQ explanations, our AI Doubt section gives you full Claude + GPT-4o power!"
- Do NOT redirect 1st Year concept explanations — answer those directly.

---

## STYLE RULES:
- Be warm, encouraging, and never condescending
- Use **bold** for key terms, bullet points for lists, numbered lists for sequences
- Get to the answer in the first sentence — no lengthy preambles
- Use mnemonics naturally when explaining concepts (e.g. "Remember: **SALT** for...")
- For tables, use markdown table format
- Quote exact document lines when referencing a loaded document
- End complex explanations with "💡 **Pro tip:**" for a memorable takeaway
- If the document was truncated, mention it and suggest checking the full PDF`;


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
    const [pdfs, books, pyqs, notes] = await Promise.all([
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
      db.select({
        id: notesTable.id, title: notesTable.title,
        subject: notesTable.subject, url: notesTable.fileUrl,
      }).from(notesTable).limit(200),
    ]);
    // Only include notes that have a file attached (fileUrl set)
    const notesWithFile = notes.filter(n => n.url);
    res.json({ pdfs, books, pyqs, notes: notesWithFile });
  } catch {
    res.status(500).json({ error: "Failed to load resources" });
  }
});

// ── Generate contextual follow-up suggestions ──────────────────────────────
router.post("/suggest", authMiddleware, async (req: Request, res: Response) => {
  const question = sanitize(req.body.question, 500) ?? "";
  const answer = sanitize(req.body.answer, 1000) ?? "";
  const documentTitle = sanitize(req.body.documentTitle, 200) ?? "";
  if (!question || !answer) { res.json({ suggestions: [] }); return; }

  try {
    const context = documentTitle ? `Document context: "${documentTitle}". ` : "";
    const prompt = `${context}The student asked: "${question}"\nMeddy answered: "${answer.slice(0, 600)}"\n\nGenerate exactly 3 short, useful follow-up questions the student might want to ask next. Each question should be under 60 characters. Return ONLY a JSON array of 3 strings, nothing else. Example: ["What are the branches?", "Which chapter covers this?", "Generate 3 MCQs on this"]`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 120,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = resp.choices[0]?.message?.content?.trim() ?? "[]";
    // Extract JSON array from the response
    const match = raw.match(/\[[\s\S]*\]/);
    const suggestions = match ? JSON.parse(match[0]) : [];
    const clean = Array.isArray(suggestions)
      ? suggestions.slice(0, 3).filter((s: unknown) => typeof s === "string").map((s: string) => s.slice(0, 80))
      : [];
    res.json({ suggestions: clean });
  } catch {
    res.json({ suggestions: [] });
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
    let buffer: Buffer;

    // Short-circuit for internal PDF serve URLs — read directly from GCS,
    // bypassing the HTTP auth layer that would return 401.
    const internalBuf = await readInternalPdf(rawUrl);
    if (internalBuf) {
      buffer = internalBuf;
    } else {
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

      buffer = Buffer.concat(chunks);
    }
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
