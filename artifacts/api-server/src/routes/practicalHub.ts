import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ensureCompatibleFormat, isSilentAudio, isHallucinatedTranscript, speechToText } from "@workspace/integrations-openai-ai-server/audio";
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
import { BIOCHEMISTRY_THEORY_SYLLABUS } from "../lib/biochemistryTheorySyllabus";
import { BIOCHEMISTRY_SERUM_URINE_SYLLABUS } from "../lib/biochemistrySerumUrineSyllabus";
import { ANATOMY_THEORY_SYLLABUS } from "../lib/anatomyTheorySyllabus";
import {
  ANATOMY_IMAGE_CATEGORIES,
  isAnatomyImageCategory,
  selectAnatomyImageForCategory,
  getAnatomyImageById,
  buildAnatomyImageGroundTruth,
  type AnatomyImageCategory,
} from "../lib/anatomyVivaImages";

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
// Biochemistry is split into 2 selectable viva types. Anatomy doesn't use a viva type yet.
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

const BIOCHEMISTRY_VIVA_TYPES = ["Theory", "Serum and Urine Estimation"] as const;
type BiochemistryVivaType = (typeof BIOCHEMISTRY_VIVA_TYPES)[number];

function isBiochemistryVivaType(value: unknown): value is BiochemistryVivaType {
  return typeof value === "string" && (BIOCHEMISTRY_VIVA_TYPES as readonly string[]).includes(value);
}

const BIOCHEMISTRY_SYLLABUS_BY_TYPE: Record<BiochemistryVivaType, string> = {
  Theory: BIOCHEMISTRY_THEORY_SYLLABUS,
  "Serum and Urine Estimation": BIOCHEMISTRY_SERUM_URINE_SYLLABUS,
};

// Anatomy has 6 selectable viva types: a Theory station plus the 5 image-based
// spotter stations (Histology / Bone / Visceral / Section Anatomy /
// Prosection), each backed by admin-extracted specimen images.
// isAnatomyImageCategory() from anatomyVivaImages.ts identifies which of these
// 5 need an image; "Theory" does not.
const ANATOMY_VIVA_TYPES = ["Theory", ...ANATOMY_IMAGE_CATEGORIES] as const;
type AnatomyVivaType = (typeof ANATOMY_VIVA_TYPES)[number];

function isAnatomyVivaType(value: unknown): value is AnatomyVivaType {
  return typeof value === "string" && (ANATOMY_VIVA_TYPES as readonly string[]).includes(value);
}

type VivaType = PhysiologyVivaType | BiochemistryVivaType | AnatomyVivaType;

// Resolves a raw request-body vivaType value against the subject it's paired with,
// so a Physiology-only type can never leak into a Biochemistry viva or vice versa.
function parseVivaType(subject: VivaSubject, value: unknown): VivaType | null {
  if (subject === "Physiology" && isPhysiologyVivaType(value)) return value;
  if (subject === "Biochemistry" && isBiochemistryVivaType(value)) return value;
  if (subject === "Anatomy" && isAnatomyVivaType(value)) return value;
  return null;
}

function vivaTypesRequiredMessage(subject: VivaSubject): string {
  const types =
    subject === "Physiology" ? PHYSIOLOGY_VIVA_TYPES : subject === "Biochemistry" ? BIOCHEMISTRY_VIVA_TYPES : ANATOMY_VIVA_TYPES;
  return `vivaType is required for ${subject} and must be one of ${types.join(", ")}`;
}

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

// In-memory cache of pre-chunked book text per subject. Chunking a 1000-1500
// page book (1M+ chars) on every single viva turn (start + every student
// answer) is the dominant cost of fetchBookExcerpt — this cache means each
// subject's book library is only fetched from the DB and re-chunked once
// (per process lifetime), then served instantly from memory on every
// subsequent question across every student's session. Invalidated whenever
// an admin uploads or deletes a book (see vivaSources.ts).
const bookChunkCache = new Map<VivaSubject, BookChunk[]>();

export function invalidateBookChunkCache(subject: VivaSubject): void {
  bookChunkCache.delete(subject);
}

async function getBookChunks(subject: VivaSubject): Promise<BookChunk[]> {
  const cached = bookChunkCache.get(subject);
  if (cached) return cached;

  const docs = await db
    .select({ fileName: vivaSourceDocumentsTable.fileName, fullText: vivaSourceDocumentsTable.fullText })
    .from(vivaSourceDocumentsTable)
    .where(eq(vivaSourceDocumentsTable.subject, subject));

  const chunks = docs.flatMap((doc) => chunkBookText(doc.fileName, doc.fullText));
  bookChunkCache.set(subject, chunks);
  return chunks;
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
    const allChunks = await getBookChunks(subject);
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
  vivaType: VivaType | null,
  imageCaption: string | null,
  bookExcerpt: string | null = null,
  anatomyImageGroundTruth: string | null = null
): string {
  const examinerName = EXAMINER_NAMES[subject];
  const physiologySyllabus =
    subject === "Physiology" && vivaType ? PHYSIOLOGY_SYLLABUS_BY_TYPE[vivaType as PhysiologyVivaType] : null;
  const biochemistrySyllabus =
    subject === "Biochemistry" && vivaType ? BIOCHEMISTRY_SYLLABUS_BY_TYPE[vivaType as BiochemistryVivaType] : null;
  const anatomyTheorySyllabus = subject === "Anatomy" && vivaType === "Theory" ? ANATOMY_THEORY_SYLLABUS : null;
  const baselineSyllabus = physiologySyllabus
    ? `\n${physiologySyllabus}`
    : biochemistrySyllabus
      ? `\n${biochemistrySyllabus}`
      : anatomyTheorySyllabus
        ? `\n${anatomyTheorySyllabus}`
        : "";
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

  const anatomyImageCategory = subject === "Anatomy" && isAnatomyImageCategory(vivaType) ? vivaType : null;
  const anatomyImageBlock = anatomyImageCategory
    ? anatomyImageGroundTruth
      ? `\nThe student currently has a real ${anatomyImageCategory} specimen photograph displayed in front of them on screen. This is the CONFIDENTIAL ground truth about that exact specimen — never read it aloud verbatim, never reveal it directly, use it only to judge whether the student's identification/answers are correct and to ask specimen-grounded follow-ups: ${anatomyImageGroundTruth}\nYour FIRST question must always be a direct spot-identification question about this specimen (e.g. "Identify this bone/organ/section/slide/structure and its side, if any"). Only after the student attempts identification should you move to structural detail, relations, and clinical/applied points about this exact specimen. Do not ask about a different, unrelated specimen at this station.`
      : `\nNo specimen image is currently available for this ${anatomyImageCategory} station. Do NOT pretend an image is displayed. Instead, conduct this as a spoken spotter-style viva purely by description: describe a well-known, classic ${anatomyImageCategory.toLowerCase()} specimen in words as your first question (e.g. "Consider a dried right femur placed in front of you...") and question the student on it as if they were physically examining it.`
    : "";

  const anatomyStationInstructions: Record<AnatomyImageCategory, string> = {
    Histology: "This is a Histology spotter station. After identification of the slide/tissue, ask about its distinguishing microscopic features, the organ/system it belongs to, and its functional significance.",
    Bone: "This is a Bone spotter station. After identification of the bone and side (right/left), ask about key markings/features, muscle attachments, articulations, and any nerve/vessel relations at those markings.",
    Visceral: "This is a Visceral (thoracic/abdominal organ) spotter station. After identification of the organ, ask about its parts, relations, blood supply, and lymphatic/nerve supply.",
    "Section Anatomy": "This is a Section Anatomy station (sagittal/cross-sectional cuts). After identification of the section level and region, ask the student to identify the structures visible at that cut level and their spatial relations to each other.",
    Prosection: "This is a Prosection (cadaveric dissection) station. After identification of the region/structures dissected, ask about the course, relations, and branches/tributaries of the nerves/vessels/muscles shown, and any clinically relevant variations.",
  };

  const anatomyEmbryologyBlock =
    subject === "Anatomy"
      ? `\nEmbryology must be woven into every Anatomy station, including Theory and all 5 image-based stations — never treat it as a separate topic. Whenever a structure, organ, or region comes up (identified from an image or discussed in Theory), ask at least one embryological correlation question about it before moving on: its embryonic origin/germ layer, the developmental process that forms it, and any classic congenital anomaly linked to it (e.g. a kidney spotter → ask about metanephric development and PUJ obstruction; a heart/great vessel structure → ask about septation and a related congenital heart defect; a limb bone → ask about limb bud development). Ground embryology answers in Langman's Medical Embryology, Inderbir Singh's Human Embryology, and Datta's Essentials of Human Embryology.`
      : "";

  const physiologyReferenceBlock =
    subject === "Physiology"
      ? `\nFor Physiology specifically, ground every question, expected answer, and correction firmly in these exact reference books — you must be fully knowledgeable in all of them and draw on whichever is most authoritative for the point at hand: CL Ghai's "A Textbook of Practical Physiology" (for all practical/experiment technique, procedure, and viva questions), GK Pal's Textbook of Practical and Comprehensive Textbook of Physiology (practical technique plus theory depth), Guyton & Hall's Textbook of Medical Physiology, Ganong's Review of Medical Physiology, Costanzo's Physiology, AK Jain's Textbook of Physiology, Indu Khurana's Textbook of Medical Physiology, and Sembulingam's Essentials of Medical Physiology. When theory and mechanism are being tested, lean on Guyton, Ganong, Costanzo, AK Jain, Indu Khurana, and Sembulingam; when practical procedure, apparatus, technique, or experiment steps are being tested, lean on CL Ghai and GK Pal's practical books. If sources differ slightly in emphasis, go with whichever explanation is clearest and most standard for an Indian 1st-year MBBS student, and never contradict any of these texts.`
      : "";

  const biochemistryReferenceBlock =
    subject === "Biochemistry"
      ? vivaType === "Serum and Urine Estimation"
        ? `\nFor this Serum and Urine Estimation station specifically, ground every question, expected answer, and correction firmly in the standard Indian clinical/practical biochemistry references — Godkar's Practical Clinical Biochemistry, Chawla's Practical Biochemistry, Harper's Illustrated Biochemistry, and DM Vasudevan's Textbook of Biochemistry. Focus on principle, stepwise procedure (as done with a colorimeter/semi-auto-analyzer per CBME), normal reference ranges, and — most importantly — the diseases/clinical conditions each estimation is used to diagnose or monitor. Do not test unrelated broad theory topics at this station.`
        : `\nFor Biochemistry Theory specifically, ground every question, expected answer, and correction firmly in these exact reference books — you must be fully knowledgeable in all of them and draw on whichever is most authoritative for the point at hand: Harper's Illustrated Biochemistry, Lippincott's Illustrated Reviews: Biochemistry, DM Vasudevan's Textbook of Biochemistry for Medical Students, and U Satyanarayana's Biochemistry. If sources differ slightly in emphasis, go with whichever explanation is clearest and most standard for an Indian 1st-year MBBS student, and never contradict any of these texts.`
      : "";

  const anatomyReferenceBlock =
    subject === "Anatomy"
      ? `\nFor Anatomy specifically, ground every question, expected answer, and correction firmly in these exact reference books — you must be fully knowledgeable in all of them and draw on whichever is most authoritative for the point at hand: Cunningham's Manual of Practical Anatomy (for all spotter/dissection/prosection viva questions), BD Chaurasia's Human Anatomy (all volumes), Gray's Anatomy for Students, Snell's Clinical Anatomy by Regions, Datta's Essentials of Human Embryology and Langman's Medical Embryology (for embryology), and Inderbir Singh's Human Embryology and Human Histology. When identifying specimens, structures, or dissections, lean on Cunningham's and BD Chaurasia; when embryological correlation is needed, lean on Datta's, Langman's, and Inderbir Singh's. If sources differ slightly in emphasis, go with whichever explanation is clearest and most standard for an Indian 1st-year MBBS student, and never contradict any of these texts.${
          anatomyImageCategory ? `\n${anatomyStationInstructions[anatomyImageCategory]}` : ""
        }`
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
${anatomyImageBlock}
${anatomyEmbryologyBlock}
${physiologyReferenceBlock}
${biochemistryReferenceBlock}
${anatomyReferenceBlock}

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

// Gemini is the primary teacher/examiner for scoring: it grades the transcript first and its
// verdict is authoritative. GPT was removed from scoring after it was found to award inflated
// marks on questions the student never actually answered.
async function geminiScoreOpinion(subject: VivaSubject, transcript: string): Promise<ScoreOpinion> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an expert Indian medical educator (the lead/primary examiner) scoring an MBBS viva voce transcript for Subject: ${subject}. Be strict and accurate: if the student did not actually answer a question (stayed silent, said "I don't know", or gave no substantive content), that question must score 0 and must NOT be treated as a correct or partially correct answer.\n\n${CBME_CONTEXT}\n\nReturn ONLY valid JSON (no markdown fences): { "score": number (0-100), "strengths": string[] (2-4 short items), "improvements": string[] (2-4 short items), "verdict": string (one short encouraging sentence) }.\n\nTranscript:\n${transcript}`,
            },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });
    const raw = (response.text ?? "{}").trim();
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    return {
      score: typeof parsed.score === "number" ? parsed.score : 0,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      verdict: typeof parsed.verdict === "string" ? parsed.verdict : "",
    };
  } catch (err) {
    console.error("Practical Hub: Gemini score opinion failed", err);
    return { score: 0, strengths: [], improvements: [], verdict: "" };
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
          content: `You are an independent second examiner on an MBBS ${subject} viva panel, cross-checking the lead (Gemini) examiner's scoring. Score the student's performance yourself, independently, based on the transcript. Be strict and accurate: if the student did not actually answer a question, that question must score 0 — never treat silence or "I don't know" as a correct or partial answer.\n\n${CBME_CONTEXT}\n\nReturn ONLY valid JSON (no markdown fences): { "score": number (0-100), "strengths": string[] (2-4 short items), "improvements": string[] (2-4 short items), "verdict": string (one short sentence) }.\n\nTranscript:\n${transcript}`,
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
// Uses Gemini (the primary teacher/examiner) rather than GPT, which was found to award marks
// on questions the student never actually answered.
async function generateQuestionBreakdown(subject: VivaSubject, transcript: string): Promise<QuestionBreakdownItem[]> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an expert Indian MBBS ${subject} examiner reviewing a viva voce transcript question-by-question.\n\n${CBME_CONTEXT}\n\nGo through the transcript and identify every distinct question the examiner asked, in order. For each one, extract the student's answer (if the student said something like "sorry sir" or "I don't know" or gave up, or never actually addressed the question, record their answer as exactly that, and give it 0 marks — never award marks for a question that was not substantively answered). Score each question out of 10 marks based on accuracy and completeness, and provide the more correct / complete ideal answer a topper would give, grounded in standard textbooks.\n\nReturn ONLY valid JSON (no markdown fences): { "questions": [ { "question": string, "studentAnswer": string, "marks": number (0-10), "idealAnswer": string (concise, 1-3 sentences) } ] }. Include every question asked during the viva, in the order asked.\n\nTranscript:\n${transcript}`,
            },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    const raw = (response.text ?? "{}").trim();
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
  const imageCaption = sanitizeText(req.body.imageCaption, 300);
  if (!isVivaSubject(subject)) {
    res.status(400).json({ error: `subject must be one of ${VIVA_SUBJECTS.join(", ")}` });
    return;
  }
  const vivaType = parseVivaType(subject, req.body.vivaType);
  if ((subject === "Physiology" || subject === "Biochemistry" || subject === "Anatomy") && !vivaType) {
    res.status(400).json({ error: vivaTypesRequiredMessage(subject) });
    return;
  }

  // For the 5 image-based Anatomy stations, pick a fresh (least-recently-shown)
  // specimen image up front — before any streaming starts — so the SSE
  // station_image event can reach the frontend before the examiner's audio.
  let anatomyImageId: number | null = null;
  let anatomyImageGroundTruth: string | null = null;
  if (subject === "Anatomy" && isAnatomyImageCategory(vivaType)) {
    try {
      const image = await selectAnatomyImageForCategory(vivaType);
      if (image) {
        anatomyImageId = image.id;
        anatomyImageGroundTruth = buildAnatomyImageGroundTruth(image);
      }
    } catch (err) {
      console.error("Practical Hub: failed to select anatomy viva image", err);
    }
  }

  sseHeaders(res);
  try {
    if (anatomyImageId) {
      sendEvent(res, { type: "station_image", imageId: anatomyImageId, imageUrl: `/api/anatomy-viva-images/serve/${anatomyImageId}` });
    }
    const [sourceNotes, bookExcerpt] = await Promise.all([
      fetchSourceNotes(subject),
      fetchBookExcerpt(subject, topic || vivaType || ""),
    ]);
    const persona = buildExaminerPersona(subject, sourceNotes, vivaType, imageCaption, bookExcerpt, anatomyImageGroundTruth);
    const stationName = vivaType ? `${subject} — ${vivaType}` : subject;
    const hasVisual = !!imageCaption || !!anatomyImageId;
    await streamExaminerAudioTurn(res, [
      { role: "system", content: persona },
      {
        role: "user",
        content: `Begin the ${stationName} viva${topic ? `, Topic: ${topic}` : ""}. Greet the student briefly like a real examiner (mention this is the ${stationName} viva), then ask your first spot/case question${hasVisual ? " about the image displayed to the student" : ""}. Start at a basic/easy level. Keep it short and spoken, 2-3 sentences total.`,
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
  const imageCaption = sanitizeText(req.body.imageCaption, 300);
  if (!isVivaSubject(subject) || !audioBase64) {
    res.status(400).json({ error: `subject (one of ${VIVA_SUBJECTS.join(", ")}) and audio required` });
    return;
  }
  const vivaType = parseVivaType(subject, req.body.vivaType);
  if ((subject === "Physiology" || subject === "Biochemistry" || subject === "Anatomy") && !vivaType) {
    res.status(400).json({ error: vivaTypesRequiredMessage(subject) });
    return;
  }

  // The frontend echoes back the imageId it received from start-voice so we
  // re-fetch the SAME specimen's ground truth on every follow-up turn instead
  // of re-randomizing mid-station.
  let anatomyImageGroundTruth: string | null = null;
  const anatomyImageIdRaw = req.body.imageId;
  if (subject === "Anatomy" && isAnatomyImageCategory(vivaType) && typeof anatomyImageIdRaw === "number") {
    try {
      const image = await getAnatomyImageById(anatomyImageIdRaw);
      if (image) anatomyImageGroundTruth = buildAnatomyImageGroundTruth(image);
    } catch (err) {
      console.error("Practical Hub: failed to fetch anatomy viva image for turn", err);
    }
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

    // Speech-to-text models can hallucinate a plausible-sounding transcript from silent or
    // near-silent audio instead of returning empty text. Screen for silence up front so a
    // student who never actually answered can't get a fabricated transcript scored as a
    // real response.
    if (await isSilentAudio(buffer, format)) {
      sendEvent(res, { type: "error", error: "No speech detected. Please try again." });
      res.end();
      return;
    }

    const userTranscript = (await speechToText(buffer, format)).trim();

    if (!userTranscript || isHallucinatedTranscript(userTranscript)) {
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
    let persona = buildExaminerPersona(subject, sourceNotes, vivaType, imageCaption, bookExcerpt, anatomyImageGroundTruth) + `\nCurrent viva Subject: ${stationName}${topic ? `, Topic: ${topic}` : ""}.`;

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

    // Gemini is the primary teacher/examiner for scoring; Claude is the sole cross-check.
    // GPT has been removed from scoring entirely — it was found to award inflated marks on
    // questions the student never actually answered.
    const [geminiOpinion, claudeOpinion, questionBreakdown] = await Promise.all([
      geminiScoreOpinion(subject, transcript),
      claudeScoreOpinion(subject, transcript),
      generateQuestionBreakdown(subject, transcript),
    ]);

    const allOpinions = [geminiOpinion, claudeOpinion].filter(
      (o): o is ScoreOpinion => !!o
    );

    const finalScore = allOpinions.length
      ? Math.round(allOpinions.reduce((sum, o) => sum + o.score, 0) / allOpinions.length)
      : 0;

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
      verdict: geminiOpinion.verdict,
      panel: {
        gemini: { provider: "gemini", ...geminiOpinion },
        claude: claudeOpinion ? { provider: "claude", ...claudeOpinion } : null,
      },
      questionBreakdown,
    });
  } catch (err: any) {
    console.error("Practical Hub voice viva end error:", err);
    res.status(500).json({ error: err?.message || "Failed to summarize the viva." });
  }
});

export { router as practicalHubRouter, VIVA_SUBJECTS, PHYSIOLOGY_VIVA_TYPES, ANATOMY_VIVA_TYPES };
