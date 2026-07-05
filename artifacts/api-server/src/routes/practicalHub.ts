import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ensureCompatibleFormat, speechToText } from "@workspace/integrations-openai-ai-server/audio";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { db } from "@workspace/db";
import { vivaSourcesTable, vivaSourceDocumentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { CBME_CONTEXT } from "../lib/cbmeContext";
import { PHYSIOLOGY_HEMATOLOGY_SYLLABUS } from "../lib/physiologyHematologySyllabus";
import { PHYSIOLOGY_CLINICAL_SYLLABUS } from "../lib/physiologyClinicalSyllabus";
import { PHYSIOLOGY_THEORY_SYLLABUS } from "../lib/physiologyTheorySyllabus";

const router = Router();

const voiceLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: { error: "Too many voice viva requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// The 3 real 1st-Year MBBS Phase-I subjects — one continuous session covers all three, in this fixed order.
const VIVA_SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"] as const;
type VivaSubject = (typeof VIVA_SUBJECTS)[number];

// Each subject's mixed-AI panel is presented to the student as a single named examiner.
const EXAMINER_NAMES: Record<VivaSubject, string> = {
  Anatomy: "Dr. Aswini",
  Physiology: "Dr. Rajiv",
  Biochemistry: "Dr. Madhu",
};

function isVivaSubject(value: unknown): value is VivaSubject {
  return typeof value === "string" && (VIVA_SUBJECTS as readonly string[]).includes(value);
}

// Physiology is split into 3 selectable viva types, each with its own baseline syllabus.
// Other subjects (Anatomy, Biochemistry) don't use a viva type yet.
const PHYSIOLOGY_VIVA_TYPES = ["Hematology Experiment", "Human Experiments & Clinical Physiology", "Theory"] as const;
type PhysiologyVivaType = (typeof PHYSIOLOGY_VIVA_TYPES)[number];

function isPhysiologyVivaType(value: unknown): value is PhysiologyVivaType {
  return typeof value === "string" && (PHYSIOLOGY_VIVA_TYPES as readonly string[]).includes(value);
}

const PHYSIOLOGY_SYLLABUS_BY_TYPE: Record<PhysiologyVivaType, string> = {
  "Hematology Experiment": PHYSIOLOGY_HEMATOLOGY_SYLLABUS,
  "Human Experiments & Clinical Physiology": PHYSIOLOGY_CLINICAL_SYLLABUS,
  Theory: PHYSIOLOGY_THEORY_SYLLABUS,
};

// Optional faculty-supplied focus areas/reference notes for a subject — inspiration only, never verbatim questions.
// The examiner AI always writes its own original questions; admins are never expected to author exact Q&A.
async function fetchSourceNotes(subject: VivaSubject): Promise<string | null> {
  try {
    const [row] = await db.select().from(vivaSourcesTable).where(eq(vivaSourcesTable.subject, subject));
    return row?.sourceText || null;
  } catch (err) {
    console.error("Practical Hub: failed to fetch source notes", err);
    return null;
  }
}

// --- Full-book grounding (RAG-lite) -----------------------------------------
// Admins can upload entire textbooks (viva_source_documents.full_text has no
// small truncation — see vivaSources.ts). Embedding a whole book into every
// AI call would blow up token cost/latency and often exceed context limits,
// so instead we chunk each book into paragraphs and, per question, retrieve
// only the excerpts most relevant to the current topic/station. Over the
// course of a multi-question viva (and across many students/sessions), every
// part of the book becomes reachable — just never all at once.
const BOOK_CHUNK_TARGET_CHARS = 1400;
const BOOK_EXCERPT_BUDGET_CHARS = 6000;
const BOOK_MAX_CHUNKS = 5;

interface BookChunk {
  fileName: string;
  text: string;
}

function chunkBookText(fileName: string, fullText: string): BookChunk[] {
  const paragraphs = fullText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: BookChunk[] = [];
  let buffer = "";
  for (const para of paragraphs) {
    if (buffer && buffer.length + para.length + 2 > BOOK_CHUNK_TARGET_CHARS) {
      chunks.push({ fileName, text: buffer });
      buffer = para;
    } else {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    }
  }
  if (buffer) chunks.push({ fileName, text: buffer });
  return chunks;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

// Simple keyword-overlap scoring (no embeddings/infra needed) — good enough
// to bias retrieval toward the current topic/station while staying cheap.
function scoreChunk(chunk: BookChunk, queryWords: Set<string>): number {
  if (queryWords.size === 0) return 0;
  const chunkWords = tokenize(chunk.text);
  let hits = 0;
  for (const w of chunkWords) {
    if (queryWords.has(w)) hits++;
  }
  return hits;
}

// Fetches every uploaded book for the subject, chunks them, and returns the
// excerpts most relevant to the current topic (or a rotating sample of the
// book if no topic/station hint is available), capped to a fixed char budget
// so prompt size and AI cost never scale with book length.
async function fetchBookExcerpt(subject: VivaSubject, queryHint: string): Promise<string | null> {
  try {
    const docs = await db
      .select({ fileName: vivaSourceDocumentsTable.fileName, fullText: vivaSourceDocumentsTable.fullText })
      .from(vivaSourceDocumentsTable)
      .where(eq(vivaSourceDocumentsTable.subject, subject));
    if (docs.length === 0) return null;

    const allChunks = docs.flatMap((doc) => chunkBookText(doc.fileName, doc.fullText));
    if (allChunks.length === 0) return null;

    const queryWords = new Set(tokenize(queryHint));
    let ranked: BookChunk[];
    if (queryWords.size > 0) {
      ranked = [...allChunks]
        .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryWords) }))
        .sort((a, b) => b.score - a.score)
        .filter((entry, idx) => entry.score > 0 || idx === 0)
        .map((entry) => entry.chunk);
    } else {
      // No topic hint yet (e.g. very first question of the viva) — rotate
      // through the book by time bucket so different sessions surface
      // different sections instead of always starting at page 1.
      const bucket = Math.floor(Date.now() / (5 * 60 * 1000)) % allChunks.length;
      ranked = [...allChunks.slice(bucket), ...allChunks.slice(0, bucket)];
    }

    const selected: string[] = [];
    let used = 0;
    for (const chunk of ranked) {
      if (selected.length >= BOOK_MAX_CHUNKS || used >= BOOK_EXCERPT_BUDGET_CHARS) break;
      const remaining = BOOK_EXCERPT_BUDGET_CHARS - used;
      const piece = chunk.text.length > remaining ? chunk.text.slice(0, remaining) : chunk.text;
      selected.push(`[From ${chunk.fileName}]\n${piece}`);
      used += piece.length;
    }
    return selected.length > 0 ? selected.join("\n\n---\n\n") : null;
  } catch (err) {
    console.error("Practical Hub: failed to fetch book excerpt", err);
    return null;
  }
}

function buildExaminerPersona(
  subject: VivaSubject,
  sourceNotes: string | null,
  vivaType: PhysiologyVivaType | null,
  imageCaption: string | null,
  bookExcerpt: string | null = null
): string {
  const examinerName = EXAMINER_NAMES[subject];
  const physiologySyllabus = subject === "Physiology" && vivaType ? PHYSIOLOGY_SYLLABUS_BY_TYPE[vivaType] : null;
  const baselineSyllabus = physiologySyllabus ? `\n${physiologySyllabus}` : "";
  const sourceBlock = sourceNotes
    ? `\nThe supervising faculty has shared these additional focus areas / reference notes for ${subject} — treat them as inspiration on top of the baseline syllabus above (if any) and make sure your questions cover these topics too, but always phrase and write the actual questions yourself in your own words (never read them as a verbatim script):\n${sourceNotes}`
    : baselineSyllabus
      ? ""
      : `\nNo specific focus areas have been supplied for ${subject} — generate your own spot/case questions on ${subject} at NEET PG standard.`;

  const bookExcerptBlock = bookExcerpt
    ? `\nThe supervising faculty has uploaded full reference textbook(s) for ${subject}. Below are excerpts from those book(s) most relevant to the current topic — use them as your primary source of truth for facts, terminology, and depth on this topic (they take priority over your own general knowledge if there's any conflict), but always phrase and ask questions in your own natural spoken words, never read excerpt text verbatim:\n${bookExcerpt}`
    : "";

  const stationLabel = vivaType ? ` — Station: ${vivaType}` : "";

  const imageBlock =
    subject === "Physiology" &&
    (vivaType === "Human Experiments & Clinical Physiology" || vivaType === "Hematology Experiment") &&
    imageCaption
      ? `\nThe student currently has this image/diagram displayed in front of them on screen: "${imageCaption}". Start by asking a spot-identification or interpretation question directly about this image, then move on to other topics in the syllabus above.`
      : "";

  const physiologyReferenceBlock =
    subject === "Physiology"
      ? `\nFor Physiology specifically, ground every question, expected answer, and correction firmly in these exact reference books — you must be fully knowledgeable in all of them and draw on whichever is most authoritative for the point at hand: CL Ghai's "A Textbook of Practical Physiology" (for all practical/experiment technique, procedure, and viva questions), GK Pal's Textbook of Practical and Comprehensive Textbook of Physiology (practical technique plus theory depth), Guyton & Hall's Textbook of Medical Physiology, Ganong's Review of Medical Physiology, Costanzo's Physiology, AK Jain's Textbook of Physiology, Indu Khurana's Textbook of Medical Physiology, and Sembulingam's Essentials of Medical Physiology. When theory and mechanism are being tested, lean on Guyton, Ganong, Costanzo, AK Jain, Indu Khurana, and Sembulingam; when practical procedure, apparatus, technique, or experiment steps are being tested, lean on CL Ghai and GK Pal's practical books. If sources differ slightly in emphasis, go with whichever explanation is clearest and most standard for an Indian 1st-year MBBS student, and never contradict any of these texts.`
      : "";

  const difficultyAndPacingRules = `
- Start EASY: your very first 1-2 questions on any new topic should be basic recall/identification level, so the student can settle in.
- Adapt difficulty live: if the student answers confidently and correctly, escalate — ask a noticeably tougher, more applied or clinically-correlated follow-up on the same topic before moving on. If the student struggles or answers wrong, do NOT pile on harder questions on that topic — give one simpler clarifying chance, then move to a fresh topic at basic level again.
- Never let a single topic run more than 2-3 exchanges regardless of performance — keep the viva moving across topics.
- Keep pacing realistic for a spoken exam: after asking a question, expect the student to answer within a short, focused window (roughly 45-60 seconds of real speaking) — do not expect long essays. If the student's answer is very short or trails off, treat that as their complete answer for that question rather than waiting or repeating yourself.
- If the student says anything like "sorry sir", "I don't know", "I'm not sure", "pass", or otherwise clearly gives up on a question, do NOT re-explain, re-ask, or give a clarifying hint on that same question — briefly acknowledge it in one short phrase ("That's alright, let's move on") and immediately ask a fresh question on the next topic at basic level. Never dwell on a question the student has given up on.`;

  return `You are ${examinerName}, a strict but fair MBBS practical/viva examiner conducting a real, spoken oral examination (viva voce / OSCE station). You are examining an Indian MBBS student on Subject: ${subject}${stationLabel}.

${CBME_CONTEXT}
${baselineSyllabus}
${sourceBlock}
${bookExcerptBlock}
${imageBlock}
${physiologyReferenceBlock}

Rules:
- Reference ONLY gold-standard textbooks (Gray's Anatomy, BD Chaurasia, Snell's, Ganong's, Guyton & Hall, Harper's, Robbins & Cotran, Harsh Mohan, KD Tripathi, Goodman & Gilman's, Ananthanarayan & Paniker, Harrison's, Davidson's, Bailey & Love's, Sabiston, Nelson, Ghai, Dutta's, Williams Obstetrics, Park's PSM) at NEET PG examination standard.
- Speak naturally, the way a real examiner speaks out loud in an exam hall — short, direct sentences. Do NOT use markdown, bullet points, asterisks, or headings; this is spoken audio, not text.
- Ask ONE question at a time. Never answer your own question. Never break character.
- When the student answers, briefly react like a real examiner would ("Hmm, not quite", "Good, correct", "Partially right, but...") in 1 sentence, then either probe deeper with a natural follow-up on the same topic, or move on to the next question. Keep total spoken response to 2-4 short sentences — real examiners don't lecture.
- Maintain a firm, professional, slightly intimidating exam-hall tone, but stay fair and encouraging when the student does well.${difficultyAndPacingRules}
- If a "Panel note" from a co-examiner appears in your instructions, weave its suggested harder question in naturally as your own next question — never mention the co-examiner or that you received a note.
- If the student clearly says they want to stop or end the viva, wish them well briefly and end.
- After roughly 4-6 questions (or once the mandatory list is exhausted plus 1-2 extra questions), tell the student the viva is complete and wrap up.`;
}

// Gemini panel member: generates ONE tougher/alternate cross-question to keep the exam rigorous.
// This is an unnamed, silent co-examiner AI — the student only ever hears the one named examiner voice.
// Soft-fails (returns null) on any error so the exam is never blocked by the second AI.
async function geminiCrossQuestion(subject: VivaSubject, transcript: string): Promise<string | null> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${CBME_CONTEXT}\n\nYou are a tough, silent co-examiner on an MBBS ${subject} viva panel, sitting alongside the lead examiner. Based on the exam transcript so far, suggest ONE noticeably tougher or more clinically-applied follow-up/cross-question on ${subject} that would test deeper understanding than what has been asked. Return ONLY the question text, no preamble, no quotes.\n\nTranscript so far:\n${transcript.slice(-4000)}`,
            },
          ],
        },
      ],
    });
    const text = (response.text ?? "").trim();
    return text || null;
  } catch (err) {
    console.error("Practical Hub: Gemini cross-question failed", err);
    return null;
  }
}

interface ScoreOpinion {
  score: number;
  strengths: string[];
  improvements: string[];
  verdict: string;
}

async function openaiScoreOpinion(subject: VivaSubject, transcript: string): Promise<ScoreOpinion> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `You are an expert Indian medical educator scoring an MBBS viva voce transcript for Subject: ${subject}.\n\n${CBME_CONTEXT}\n\nReturn ONLY valid JSON: { "score": number (0-100), "strengths": string[] (2-4 short items), "improvements": string[] (2-4 short items), "verdict": string (one short encouraging sentence) }.`,
      },
      { role: "user", content: transcript },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }

  return {
    score: typeof parsed.score === "number" ? parsed.score : 0,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    verdict: typeof parsed.verdict === "string" ? parsed.verdict : "",
  };
}

// Gemini panel member: an independent second scoring opinion, cross-checking the primary examiner's score.
// Soft-fails (returns null) on any error so scoring is never blocked by the second AI.
async function geminiScoreOpinion(subject: VivaSubject, transcript: string): Promise<ScoreOpinion | null> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an independent second examiner on an MBBS ${subject} viva panel, cross-checking the lead examiner's scoring. Score the student's performance yourself, independently, based on the transcript.\n\n${CBME_CONTEXT}\n\nReturn ONLY valid JSON (no markdown fences): { "score": number (0-100), "strengths": string[] (2-4 short items), "improvements": string[] (2-4 short items), "verdict": string (one short sentence) }.\n\nTranscript:\n${transcript}`,
            },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });
    const raw = (response.text ?? "{}").trim();
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    if (typeof parsed.score !== "number") return null;
    return {
      score: parsed.score,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      verdict: typeof parsed.verdict === "string" ? parsed.verdict : "",
    };
  } catch (err) {
    console.error("Practical Hub: Gemini score opinion failed", err);
    return null;
  }
}

// Claude panel member: a third independent scoring opinion, cross-checking the primary examiner's score.
// Soft-fails (returns null) on any error so scoring is never blocked by the third AI.
async function claudeScoreOpinion(subject: VivaSubject, transcript: string): Promise<ScoreOpinion | null> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `You are an independent third examiner on an MBBS ${subject} viva panel, cross-checking the lead examiner's scoring. Score the student's performance yourself, independently, based on the transcript.\n\n${CBME_CONTEXT}\n\nReturn ONLY valid JSON (no markdown fences): { "score": number (0-100), "strengths": string[] (2-4 short items), "improvements": string[] (2-4 short items), "verdict": string (one short sentence) }.\n\nTranscript:\n${transcript}`,
        },
      ],
    });
    const block = message.content[0];
    const raw = (block?.type === "text" ? block.text : "{}").trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    if (typeof parsed.score !== "number") return null;
    return {
      score: parsed.score,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      verdict: typeof parsed.verdict === "string" ? parsed.verdict : "",
    };
  } catch (err) {
    console.error("Practical Hub: Claude score opinion failed", err);
    return null;
  }
}

interface QuestionBreakdownItem {
  question: string;
  studentAnswer: string;
  marks: number;
  maxMarks: number;
  idealAnswer: string;
}

// Produces a per-question breakdown of the whole viva: what was asked, what the student said,
// marks out of 10 for that answer, and the more correct/ideal answer for review.
async function generateQuestionBreakdown(subject: VivaSubject, transcript: string): Promise<QuestionBreakdownItem[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are an expert Indian MBBS ${subject} examiner reviewing a viva voce transcript question-by-question.\n\n${CBME_CONTEXT}\n\nGo through the transcript and identify every distinct question the examiner asked, in order. For each one, extract the student's answer (if the student said something like "sorry sir" or "I don't know" or gave up, record their answer as exactly that, and give it 0 marks). Score each question out of 10 marks based on accuracy and completeness, and provide the more correct / complete ideal answer a topper would give, grounded in standard textbooks.\n\nReturn ONLY valid JSON: { "questions": [ { "question": string, "studentAnswer": string, "marks": number (0-10), "idealAnswer": string (concise, 1-3 sentences) } ] }. Include every question asked during the viva, in the order asked.`,
        },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

    return questions
      .filter((q: any) => typeof q?.question === "string")
      .map((q: any) => ({
        question: q.question,
        studentAnswer: typeof q.studentAnswer === "string" ? q.studentAnswer : "",
        marks: typeof q.marks === "number" ? Math.max(0, Math.min(10, q.marks)) : 0,
        maxMarks: 10,
        idealAnswer: typeof q.idealAnswer === "string" ? q.idealAnswer : "",
      }));
  } catch (err) {
    console.error("Practical Hub: question breakdown generation failed", err);
    return [];
  }
}

function sanitizeText(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/[\x00-\x1F\x7F]/g, " ").slice(0, maxLen);
  return trimmed || null;
}

function sseHeaders(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

function sendEvent(res: Response, payload: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

type ChatHistoryItem = { role: "user" | "assistant"; content: string };

function sanitizeHistory(raw: unknown): ChatHistoryItem[] {
  if (!Array.isArray(raw)) return [];
  const items: ChatHistoryItem[] = [];
  for (const h of raw.slice(-20)) {
    if (h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string") {
      items.push({ role: h.role, content: h.content.slice(0, 2000) });
    }
  }
  return items;
}

function historyToTranscript(history: ChatHistoryItem[]): string {
  return history.map((h) => `${h.role === "assistant" ? "Examiner" : "Student"}: ${h.content}`).join("\n");
}

async function streamExaminerAudioTurn(
  res: Response,
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<void> {
  const stream = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: "onyx", format: "pcm16" },
    messages: messages as any,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = (chunk.choices?.[0]?.delta as any) ?? null;
    if (!delta) continue;
    if (delta?.audio?.transcript) {
      sendEvent(res, { type: "transcript", data: delta.audio.transcript });
    }
    if (delta?.audio?.data) {
      sendEvent(res, { type: "audio", data: delta.audio.data });
    }
  }
}

// The 3 fixed sections of the practical viva, with each section's named examiner and whether faculty source notes exist.
router.get("/viva/sections", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const sections = await Promise.all(
      VIVA_SUBJECTS.map(async (subject) => ({
        subject,
        examinerName: EXAMINER_NAMES[subject],
        hasSourceNotes: !!(await fetchSourceNotes(subject)),
      }))
    );
    res.json({ sections });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to load viva sections" });
  }
});

// Begin a voice viva section: examiner greets the student and asks the opening question, as speech.
router.post("/viva/start-voice", authMiddleware, voiceLimiter, async (req: Request, res: Response) => {
  const subject = req.body.subject;
  const topic = sanitizeText(req.body.topic, 200);
  const vivaType = isPhysiologyVivaType(req.body.vivaType) ? req.body.vivaType : null;
  const imageCaption = sanitizeText(req.body.imageCaption, 300);
  if (!isVivaSubject(subject)) {
    res.status(400).json({ error: `subject must be one of ${VIVA_SUBJECTS.join(", ")}` });
    return;
  }
  if (subject === "Physiology" && !vivaType) {
    res.status(400).json({ error: `vivaType is required for Physiology and must be one of ${PHYSIOLOGY_VIVA_TYPES.join(", ")}` });
    return;
  }

  sseHeaders(res);
  try {
    const [sourceNotes, bookExcerpt] = await Promise.all([
      fetchSourceNotes(subject),
      fetchBookExcerpt(subject, topic || vivaType || ""),
    ]);
    const persona = buildExaminerPersona(subject, sourceNotes, vivaType, imageCaption, bookExcerpt);
    const stationName = vivaType ? `${subject} — ${vivaType}` : subject;
    await streamExaminerAudioTurn(res, [
      { role: "system", content: persona },
      {
        role: "user",
        content: `Begin the ${stationName} viva${topic ? `, Topic: ${topic}` : ""}. Greet the student briefly like a real examiner (mention this is the ${stationName} viva), then ask your first spot/case question${imageCaption ? " about the image displayed to the student" : ""}. Start at a basic/easy level. Keep it short and spoken, 2-3 sentences total.`,
      },
    ]);
    sendEvent(res, { done: true, examinerName: EXAMINER_NAMES[subject] });
  } catch (err: any) {
    console.error("Practical Hub voice viva start error:", err);
    sendEvent(res, { type: "error", error: err?.message || "Failed to start the viva." });
  } finally {
    res.end();
  }
});

// Continue a voice viva: transcribe the student's spoken answer, then stream the examiner's next spoken turn.
router.post("/viva/turn-voice", authMiddleware, voiceLimiter, async (req: Request, res: Response) => {
  const subject = req.body.subject;
  const topic = sanitizeText(req.body.topic, 200);
  const history = sanitizeHistory(req.body.history);
  const audioBase64 = typeof req.body.audio === "string" ? req.body.audio : null;
  const vivaType = isPhysiologyVivaType(req.body.vivaType) ? req.body.vivaType : null;
  const imageCaption = sanitizeText(req.body.imageCaption, 300);
  if (!isVivaSubject(subject) || !audioBase64) {
    res.status(400).json({ error: `subject (one of ${VIVA_SUBJECTS.join(", ")}) and audio required` });
    return;
  }
  if (subject === "Physiology" && !vivaType) {
    res.status(400).json({ error: `vivaType is required for Physiology and must be one of ${PHYSIOLOGY_VIVA_TYPES.join(", ")}` });
    return;
  }

  sseHeaders(res);
  try {
    const rawBuffer = Buffer.from(audioBase64, "base64");
    if (rawBuffer.length < 100) {
      sendEvent(res, { type: "error", error: "No speech detected. Please try again." });
      res.end();
      return;
    }

    const { buffer, format } = await ensureCompatibleFormat(rawBuffer);
    const userTranscript = (await speechToText(buffer, format)).trim();

    if (!userTranscript) {
      sendEvent(res, { type: "error", error: "Could not hear your answer clearly. Please try again." });
      res.end();
      return;
    }

    sendEvent(res, { type: "user_transcript", data: userTranscript });

    const recentTranscript = [...history.slice(-4), { role: "user" as const, content: userTranscript }]
      .map((h) => h.content)
      .join(" ");
    const queryHint = [topic, vivaType, recentTranscript].filter(Boolean).join(" ");
    const [sourceNotes, bookExcerpt] = await Promise.all([
      fetchSourceNotes(subject),
      fetchBookExcerpt(subject, queryHint),
    ]);
    const stationName = vivaType ? `${subject} — ${vivaType}` : subject;
    let persona = buildExaminerPersona(subject, sourceNotes, vivaType, imageCaption, bookExcerpt) + `\nCurrent viva Subject: ${stationName}${topic ? `, Topic: ${topic}` : ""}.`;

    // Every 3rd student answer, bring in the Gemini panel member's tougher cross-question suggestion.
    const answerCount = history.filter((h) => h.role === "user").length + 1;
    if (answerCount >= 2 && answerCount % 3 === 0) {
      const transcriptSoFar = historyToTranscript([...history, { role: "user", content: userTranscript }]);
      const crossQuestion = await geminiCrossQuestion(subject, transcriptSoFar);
      if (crossQuestion) {
        persona += `\n\nPanel note from co-examiner: consider asking this harder question next, phrased naturally in your own voice: "${crossQuestion}"`;
      }
    }

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: persona },
      ...history,
      { role: "user", content: userTranscript },
    ];

    await streamExaminerAudioTurn(res, messages);
    sendEvent(res, { done: true });
  } catch (err: any) {
    console.error("Practical Hub voice viva turn error:", err);
    sendEvent(res, { type: "error", error: err?.message || "Failed to continue the viva." });
  } finally {
    res.end();
  }
});

// End a voice viva section: produce a merged multi-AI panel score for this subject.
router.post("/viva/end", authMiddleware, voiceLimiter, async (req: Request, res: Response) => {
  try {
    const subject = req.body.subject;
    const history = sanitizeHistory(req.body.history);
    if (!isVivaSubject(subject) || history.length === 0) {
      res.status(400).json({ error: `subject (one of ${VIVA_SUBJECTS.join(", ")}) and history required` });
      return;
    }

    const transcript = historyToTranscript(history);

    const [openaiOpinion, geminiOpinion, claudeOpinion, questionBreakdown] = await Promise.all([
      openaiScoreOpinion(subject, transcript),
      geminiScoreOpinion(subject, transcript),
      claudeScoreOpinion(subject, transcript),
      generateQuestionBreakdown(subject, transcript),
    ]);

    const allOpinions = [openaiOpinion, geminiOpinion, claudeOpinion].filter(
      (o): o is ScoreOpinion => !!o
    );

    const finalScore = Math.round(
      allOpinions.reduce((sum, o) => sum + o.score, 0) / allOpinions.length
    );

    const mergedStrengths = Array.from(
      new Set(allOpinions.flatMap((o) => o.strengths))
    ).slice(0, 5);
    const mergedImprovements = Array.from(
      new Set(allOpinions.flatMap((o) => o.improvements))
    ).slice(0, 5);

    res.json({
      subject,
      examinerName: EXAMINER_NAMES[subject],
      score: finalScore,
      strengths: mergedStrengths,
      improvements: mergedImprovements,
      verdict: openaiOpinion.verdict,
      panel: {
        openai: { provider: "openai", ...openaiOpinion },
        gemini: geminiOpinion ? { provider: "gemini", ...geminiOpinion } : null,
        claude: claudeOpinion ? { provider: "claude", ...claudeOpinion } : null,
      },
      questionBreakdown,
    });
  } catch (err: any) {
    console.error("Practical Hub voice viva end error:", err);
    res.status(500).json({ error: err?.message || "Failed to summarize the viva." });
  }
});

export { router as practicalHubRouter, VIVA_SUBJECTS, PHYSIOLOGY_VIVA_TYPES };
