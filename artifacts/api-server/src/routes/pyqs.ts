import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { pyqsTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { stripHtml } from "../lib/sanitize";
import { awardXp, XP_VALUES } from "../lib/xp";
import { xpTransactionsTable } from "@workspace/db";
import { getPdfText, renderPdfPageRange } from "./aiDoubt";
import { openai } from "@workspace/integrations-openai-ai-server";
import { CBME_CONTEXT } from "../lib/cbmeContext";

const router = Router();

const pyqAiLimiter = rateLimit({ windowMs: 60_000, max: 8, standardHeaders: true, legacyHeaders: false });

const MAX_DOCUMENT_TEXT_CHARS = 350_000;
// Pages per vision-AI call when walking a scanned (image-only) PDF. Small enough that
// a batch reliably gets a real response back from the model, large enough to keep the
// number of AI calls (and latency) reasonable for a multi-year, multi-dozen-page compilation.
const SCANNED_BATCH_PAGES = 10;

type PyqDoc =
  | { mode: "text"; text: string; pages: number }
  | { mode: "scanned"; pages: number; buffer: Buffer };

async function downloadPyqBuffer(url: string): Promise<Buffer> {
  // Google Drive share links (https://drive.google.com/file/d/ID/view) serve an
  // HTML viewer page, not raw PDF bytes — convert to the direct usercontent
  // download URL so the response is the actual file (same fix as pdfs.ts proxy).
  let fetchUrl = url;
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    fetchUrl = `https://drive.usercontent.google.com/download?id=${driveMatch[1]}&export=download&authuser=0&confirm=t`;
  }

  const resp = await fetch(fetchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Mission-Distinction/1.0)",
      "Accept": "application/pdf,*/*",
    },
  });
  if (!resp.ok) throw new Error(`Could not download PDF (status ${resp.status})`);
  const arrayBuf = await resp.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function loadPyqDocument(url: string): Promise<PyqDoc> {
  const buffer = await downloadPyqBuffer(url);
  const magic = buffer.slice(0, 4).toString("ascii");
  if (!magic.startsWith("%PDF")) throw new Error("File does not appear to be a valid PDF.");

  const { text, pages } = await getPdfText(buffer);
  if (text && text.length >= 20) {
    const capped = text.length > MAX_DOCUMENT_TEXT_CHARS
      ? text.slice(0, MAX_DOCUMENT_TEXT_CHARS) + `\n\n[Document truncated at ${MAX_DOCUMENT_TEXT_CHARS.toLocaleString()} characters]`
      : text;
    return { mode: "text", text: capped, pages };
  }
  // Scanned / image-only PDF — caller walks ALL pages in batches via renderPdfPageRange.
  return { mode: "scanned", pages, buffer };
}

function buildDocMessageContent(text: string, promptText: string) {
  return [{ type: "text" as const, text: `${promptText}\n\n--- DOCUMENT TEXT ---\n${text}` }];
}

function buildImageMessageContent(images: string[], promptText: string) {
  const imgs = images.map((img) => ({ type: "image_url" as const, image_url: { url: img } }));
  return [{ type: "text" as const, text: promptText }, ...imgs];
}

function isValidHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch { return false; }
}

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subject, year, search, college } = req.query;
    let pyqs = await db.select().from(pyqsTable).orderBy(pyqsTable.createdAt).limit(500);
    if (subject) pyqs = pyqs.filter(p => p.subject.toLowerCase() === (subject as string).toLowerCase());
    if (year) pyqs = pyqs.filter(p => p.year === (year as string));
    if (college) pyqs = pyqs.filter(p => (p as any).college === (college as string));
    if (search) pyqs = pyqs.filter(p => p.title.toLowerCase().includes((search as string).toLowerCase()));
    res.json(pyqs);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [pyq] = await db.select().from(pyqsTable).where(eq(pyqsTable.id, id));
    if (!pyq) { res.status(404).json({ error: "PYQ not found" }); return; }

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const type = `pyq_read_${id}`;
    const [{ total }] = await db
      .select({ total: count() })
      .from(xpTransactionsTable)
      .where(and(
        eq(xpTransactionsTable.userId, user.id),
        eq(xpTransactionsTable.type, type),
        gte(xpTransactionsTable.createdAt, dayStart),
      ));

    if (Number(total) === 0) {
      awardXp(user.id, XP_VALUES.BOOK_READ, type, `Opened PYQ: ${pyq.title.slice(0, 60)}`).catch(() => {});
    }

    await db.update(pyqsTable)
      .set({ downloadCount: (pyq.downloadCount ?? 0) + 1 })
      .where(eq(pyqsTable.id, id));

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { title, subject, year, url, college } = req.body;
    if (!title || !subject || !year || !url) { res.status(400).json({ error: "Missing fields" }); return; }
    if (!isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    const safeTitle = stripHtml(String(title));
    const safeSubject = stripHtml(String(subject));
    const safeYear = stripHtml(String(year));
    const safeCollege = college ? stripHtml(String(college)) : "VIMSAR";
    if (!safeTitle || !safeSubject || !safeYear) { res.status(400).json({ error: "Invalid fields" }); return; }
    const [pyq] = await db.insert(pyqsTable).values({
      title: safeTitle, subject: safeSubject, year: safeYear, url,
      college: safeCollege,
      createdBy: admin.id,
    } as any).returning();
    res.status(201).json(pyq);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(pyqsTable).where(eq(pyqsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const { title, subject, year, url, college } = req.body;
    if (url && !isValidHttpsUrl(url)) { res.status(400).json({ error: "url must be a valid HTTPS URL" }); return; }
    const updates: any = {};
    if (title !== undefined) updates.title = stripHtml(String(title));
    if (subject !== undefined) updates.subject = stripHtml(String(subject));
    if (year !== undefined) updates.year = stripHtml(String(year));
    if (url !== undefined) updates.url = url;
    if (college !== undefined) updates.college = stripHtml(String(college));
    const [pyq] = await db.update(pyqsTable).set(updates).where(eq(pyqsTable.id, id)).returning();
    res.json(pyq);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [existing] = await db.select().from(pyqsTable).where(eq(pyqsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(pyqsTable).where(eq(pyqsTable.id, id));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── AI topic search across a PYQ PDF + model answers ─────────────────────────
router.post("/:id/search-topic", authMiddleware, pyqAiLimiter, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const topic = stripHtml(String(req.body?.topic || "")).slice(0, 200);
    if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

    const [pyq] = await db.select().from(pyqsTable).where(eq(pyqsTable.id, id));
    if (!pyq) { res.status(404).json({ error: "PYQ not found" }); return; }

    const doc = await loadPyqDocument(pyq.url);

    if (doc.mode === "text") {
      const prompt = `You are an expert Indian MBBS (${pyq.subject}) examiner analysing a previous-year-question (PYQ) paper titled "${pyq.title}".
Find every question in this document related to the topic: "${topic}".
For EACH matching question, provide a concise, exam-ready model answer suitable for a 1st Year MBBS student in India (use standard textbook terminology, keep it structured with headings/bullet points where useful).
Also note the year/exam session for each question if it is identifiable from the document.
Return ONLY valid JSON of the shape:
{ "matches": [ { "year": string|null, "question": string, "modelAnswer": string } ], "note": string }
If nothing matches the topic, return an empty "matches" array and explain in "note".`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `You are a meticulous medical education assistant. Always respond with valid JSON only.

${CBME_CONTEXT}` },
          { role: "user", content: buildDocMessageContent(doc.text, prompt) as any },
        ],
      });
      const content = completion.choices[0]?.message?.content;
      const result = content ? JSON.parse(content) : { matches: [], note: "AI returned no content." };
      res.json({ pyq: { id: pyq.id, title: pyq.title, subject: pyq.subject }, ...result });
      return;
    }

    // ── Scanned PDF — walk EVERY page in batches so the topic search covers the
    // whole multi-year compilation, not just the first N pages ────────────────
    const numBatches = Math.ceil(doc.pages / SCANNED_BATCH_PAGES);
    const allMatches: { year: string | null; question: string; modelAnswer: string }[] = [];
    const batchWarnings: string[] = [];

    for (let b = 0; b < numBatches; b++) {
      const start = b * SCANNED_BATCH_PAGES + 1;
      const end = Math.min(start + SCANNED_BATCH_PAGES - 1, doc.pages);
      try {
        const images = await renderPdfPageRange(doc.buffer, start, end);
        const batchPrompt = `These are pages ${start}-${end} of a ${pyq.subject} previous-year-question (PYQ) paper titled "${pyq.title}".
Find every question on THESE PAGES related to the topic: "${topic}".
For EACH matching question, give a concise, exam-ready model answer suitable for a 1st Year MBBS student in India, and note the year/exam session if it is identifiable on the page (else null).
Return ONLY valid JSON: { "matches": [ { "year": string|null, "question": string, "modelAnswer": string } ] }
If nothing on these pages matches the topic, return { "matches": [] }.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: `You are a meticulous medical education assistant. Always respond with valid JSON only.

${CBME_CONTEXT}` },
            { role: "user", content: buildImageMessageContent(images, batchPrompt) as any },
          ],
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) {
          batchWarnings.push(`pages ${start}-${end}: AI returned no content`);
          continue;
        }
        const parsed = JSON.parse(content);
        for (const m of parsed.matches || []) allMatches.push(m);
      } catch (batchErr: any) {
        batchWarnings.push(`pages ${start}-${end}: ${batchErr?.message || "request failed"}`);
      }
    }

    res.json({
      pyq: { id: pyq.id, title: pyq.title, subject: pyq.subject },
      matches: allMatches,
      note: allMatches.length
        ? `Found ${allMatches.length} matching question(s) across all ${doc.pages} scanned pages.`
        : "No matching questions found for this topic across the document.",
      warning: batchWarnings.length
        ? `Read all ${doc.pages} pages across ${numBatches} batches. Some batches had issues: ${batchWarnings.join("; ")}.`
        : `Read all ${doc.pages} scanned pages across ${numBatches} batches.`,
    });
  } catch (err: any) {
    console.error("[pyqs/search-topic]", err?.message);
    res.status(500).json({ error: err?.message || "Failed to analyze PYQ document" });
  }
});

// ── AI "most repeated / important questions per chapter" analysis ───────────
router.post("/:id/repeated-questions", authMiddleware, pyqAiLimiter, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [pyq] = await db.select().from(pyqsTable).where(eq(pyqsTable.id, id));
    if (!pyq) { res.status(404).json({ error: "PYQ not found" }); return; }

    const doc = await loadPyqDocument(pyq.url);

    const synthesisSchema = `{
  "chapters": [
    {
      "chapter": string,
      "importance": "high" | "medium" | "low",
      "repeatedQuestions": [ { "question": string, "timesSeen": number, "yearsSeen": string[] } ]
    }
  ],
  "summary": string
}`;

    if (doc.mode === "text") {
      const prompt = `You are an expert Indian MBBS (${pyq.subject}) examiner analysing a previous-year-question (PYQ) compilation titled "${pyq.title}" that may span multiple years/exam sessions.
1. Group the questions by chapter/topic within ${pyq.subject}.
2. Within each chapter, identify questions that are repeated across years or are clear variations of the same core concept, and count how many times each appears.
3. Rank chapters/questions by importance (repetition frequency + exam weightage) so a student knows what to prioritize before the exam.
Return ONLY valid JSON of the shape:
${synthesisSchema}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `You are a meticulous medical education assistant. Always respond with valid JSON only.

${CBME_CONTEXT}` },
          { role: "user", content: buildDocMessageContent(doc.text, prompt) as any },
        ],
      });
      const content = completion.choices[0]?.message?.content;
      const result = content ? JSON.parse(content) : { chapters: [], summary: "AI returned no content." };
      res.json({ pyq: { id: pyq.id, title: pyq.title, subject: pyq.subject }, ...result });
      return;
    }

    // ── Scanned PDF — read EVERY page. Phase 1: transcribe questions (+ year, if
    // visible) per small page-batch so each vision call reliably returns content.
    // Phase 2: one cheap text-only synthesis call over ALL transcribed questions
    // does the chapter grouping / repetition ranking across the whole document. ─
    const numBatches = Math.ceil(doc.pages / SCANNED_BATCH_PAGES);
    const transcribed: string[] = [];
    const batchWarnings: string[] = [];

    for (let b = 0; b < numBatches; b++) {
      const start = b * SCANNED_BATCH_PAGES + 1;
      const end = Math.min(start + SCANNED_BATCH_PAGES - 1, doc.pages);
      try {
        const images = await renderPdfPageRange(doc.buffer, start, end);
        const batchPrompt = `These are pages ${start}-${end} of a ${pyq.subject} previous-year-question (PYQ) compilation titled "${pyq.title}" that may span multiple years/exam sessions.
Transcribe EVERY distinct exam question visible on these pages (verbatim, or close paraphrase if scan quality is poor). For each, note the year/exam session if it is identifiable anywhere on the page (header, footer, watermark) — else null.
Return ONLY valid JSON: { "questions": [ { "question": string, "year": string|null } ] }
If no questions are visible on these pages, return { "questions": [] }.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are a meticulous medical education assistant. Always respond with valid JSON only." },
            { role: "user", content: buildImageMessageContent(images, batchPrompt) as any },
          ],
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) {
          batchWarnings.push(`pages ${start}-${end}: AI returned no content`);
          continue;
        }
        const parsed = JSON.parse(content);
        for (const q of parsed.questions || []) {
          transcribed.push(`${q.year ? `[${q.year}] ` : ""}${q.question}`);
        }
      } catch (batchErr: any) {
        batchWarnings.push(`pages ${start}-${end}: ${batchErr?.message || "request failed"}`);
      }
    }

    if (transcribed.length === 0) {
      res.json({
        pyq: { id: pyq.id, title: pyq.title, subject: pyq.subject },
        chapters: [],
        summary: "No questions could be transcribed from this scanned document.",
        warning: batchWarnings.length ? batchWarnings.join("; ") : undefined,
      });
      return;
    }

    const synthesisPrompt = `Below is a raw list of exam questions transcribed from every page (${doc.pages} pages total, read in batches) of a ${pyq.subject} PYQ compilation titled "${pyq.title}" spanning multiple years/exam sessions.
1. Group them by chapter/topic within ${pyq.subject}.
2. Within each chapter, identify questions repeated across years or clear variations of the same core concept, and count how many times each appears.
3. Rank chapters/questions by importance (repetition frequency + exam weightage) so a student knows what to prioritize before the exam.

Raw transcribed questions:
${transcribed.join("\n")}

Return ONLY valid JSON of the shape:
${synthesisSchema}`;

    const synthesis = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `You are a meticulous medical education assistant. Always respond with valid JSON only.

${CBME_CONTEXT}` },
        { role: "user", content: synthesisPrompt },
      ],
    });
    const synthContent = synthesis.choices[0]?.message?.content;
    const result = synthContent ? JSON.parse(synthContent) : { chapters: [], summary: "AI returned no content." };
    res.json({
      pyq: { id: pyq.id, title: pyq.title, subject: pyq.subject },
      ...result,
      warning: batchWarnings.length
        ? `Read all ${doc.pages} pages across ${numBatches} batches. Some batches had issues: ${batchWarnings.join("; ")}.`
        : `Read all ${doc.pages} scanned pages across ${numBatches} batches.`,
    });
  } catch (err: any) {
    console.error("[pyqs/repeated-questions]", err?.message);
    res.status(500).json({ error: err?.message || "Failed to analyze PYQ document" });
  }
});

export default router;
