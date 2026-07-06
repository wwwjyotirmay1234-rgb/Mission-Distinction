import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { convertAndCheckSilence, isHallucinatedTranscript, isUnexpectedScript, speechToText } from "@workspace/integrations-openai-ai-server/audio";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { db } from "@workspace/db";
import { vivaSourcesTable, vivaSourceDocumentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { awardXp, XP_VALUES } from "../lib/xp";
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
  Anatomy: "Dr. Mamata",
  Physiology: "Dr. Rajiv",
  Biochemistry: "Dr. Madhu",
};

// Passed as the STT `prompt` param to bias transcription toward each subject's
// jargon/spellings (e.g. "foramen" vs "for a men") — MBBS students speak with a
// wide range of Indian English accents, and generic transcription models most
// often mis-hear domain-specific medical terms, not everyday words.
const STT_VOCABULARY_HINT: Record<VivaSubject, string> = {
  Anatomy:
    "Medical anatomy viva. Terms: foramen, tuberosity, epicondyle, articulation, cadaveric, prosection, osteology, histology, embryology, radiograph, humerus, scapula, sacrum, vertebra, fossa, sulcus, ligament, innervation.",
  Physiology:
    "Medical physiology viva. Terms: hemoglobin, hematocrit, sphygmomanometer, auscultation, reflex arc, action potential, cardiac cycle, spirometry, osmolarity, homeostasis, baroreceptor.",
  Biochemistry:
    "Medical biochemistry viva. Terms: proteinuria, albumin, urine dipstick, Bence Jones, ketone bodies, enzyme, metabolite, estimation, reagent, titration, benedict's test, biuret test.",
};

// Each named examiner has a fixed, gender-appropriate spoken voice for the audio viva.
// Dr. Rajiv is male; Dr. Mamata and Dr. Madhu are female.
const EXAMINER_VOICE: Record<VivaSubject, "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"> = {
  Anatomy: "shimmer",
  Physiology: "echo",
  Biochemistry: "nova",
};

// Each named examiner has a distinct personality/style so repeat sessions (and different subjects)
// don't all sound like the same voice with a different name swapped in.
const EXAMINER_TONE: Record<VivaSubject, string> = {
  Anatomy:
    "You are a middle-aged, experienced lady professor. Your personal style: strict, precise, and slightly old-school — you have zero patience for vague or waffly answers and you say so directly (\"Don't guess, be precise\", \"Exact term, please\"). You expect exact anatomical terminology (sides, planes, precise names) and will pull the student up immediately if they are loose with language. You rarely praise, and when you do it's brief and clipped (\"Correct. Next.\").",
  Physiology:
    "Your personal style: encouraging but firm — you want the student to reason out loud and will nudge them toward the answer with a guiding follow-up rather than just marking it wrong (\"Think about what happens to preload here...\"), but you are still firm about wrong physiology and won't let a mistake slide uncorrected. You praise good reasoning warmly when you see it.",
  Biochemistry:
    "Your personal style: detail-obsessed and exacting — you care intensely about exact enzyme names, pathway steps, cofactors, and precise numbers (pH, ranges, units), and you will immediately probe a student who gets the broad idea right but fumbles a specific detail (\"Yes, but which enzyme, exactly? Name it.\"). You treat sloppy terminology as almost as bad as a wrong answer.",
};

function isVivaSubject(value: unknown): value is VivaSubject {
  return typeof value === "string" && (VIVA_SUBJECTS as readonly string[]).includes(value);
}

// Cheap, fast heuristic for "this answer was weak/vague/a give-up" — used to trigger dynamic
// follow-up pressure immediately instead of waiting for a fixed every-3rd-turn cadence. This is
// intentionally not another LLM call (that would add real latency to every spoken turn); it just
// looks at length and a short list of hedging/give-up phrases real students actually say.
const WEAK_ANSWER_PHRASES = [
  "i don't know", "i dont know", "not sure", "i'm not sure", "im not sure", "sorry sir", "sorry ma'am",
  "pass", "no idea", "i forgot", "i can't remember", "i cant remember", "maybe", "i think so", "not really sure",
];
function isWeakOrVagueAnswer(transcript: string): boolean {
  const t = transcript.trim().toLowerCase();
  if (!t) return true;
  const wordCount = t.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 4) return true;
  if (WEAK_ANSWER_PHRASES.some((p) => t.includes(p))) return true;
  return false;
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
async function fetchBookExcerpt(
  subject: VivaSubject,
  queryHint: string,
  pinFileNamePattern?: RegExp
): Promise<string | null> {
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

      // Pure keyword-score ranking can let a heavily-repeated term (e.g. the bone
      // name) monopolize all BOOK_MAX_CHUNKS slots with chunks from one source book,
      // crowding out a differently-worded but still-relevant book entirely (e.g. the
      // Radiology reference during a Bone station). When a pin pattern is given,
      // guarantee the single best-scoring chunk from a matching file is present.
      if (pinFileNamePattern) {
        const alreadyIncluded = ranked
          .slice(0, BOOK_MAX_CHUNKS)
          .some((c) => pinFileNamePattern.test(c.fileName));
        if (!alreadyIncluded) {
          const bestPinned = [...allChunks]
            .filter((c) => pinFileNamePattern.test(c.fileName))
            .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryWords) }))
            .sort((a, b) => b.score - a.score)[0]?.chunk;
          if (bestPinned) {
            ranked = [bestPinned, ...ranked.filter((c) => c !== bestPinned)];
          }
        }
      }
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
  anatomyImageGroundTruth: string | null = null,
  studentName: string | null = null
): string {
  const examinerName = EXAMINER_NAMES[subject];
  const examinerTone = EXAMINER_TONE[subject];
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
    ? `\nThe supervising faculty has shared these focus areas / reference notes for ${subject} — every question you ask MUST stay within the topics covered by the baseline syllabus above (if any) and these notes; do not wander into unrelated topics that aren't covered here or in the uploaded textbook excerpts below. Always phrase and write the actual questions yourself in your own words (never read them as a verbatim script):\n${sourceNotes}`
    : baselineSyllabus
      ? ""
      : `\nNo specific focus areas have been supplied for ${subject} — generate your own spot/case questions on ${subject} at NEET PG standard, staying strictly within the standard reference textbooks listed below.`;

  const bookExcerptBlock = bookExcerpt
    ? `\nThe supervising faculty has uploaded full reference textbook(s) for ${subject}. Below are excerpts from those book(s) most relevant to the current topic — these are your PRIMARY source of truth: every fact, number, procedure step, and question you ask on this topic must be something actually covered in these excerpts (they take priority over your own general knowledge if there's any conflict, and you must never invent a fact, figure, or procedural detail that isn't grounded in them or the standard reference books listed below). Always phrase and ask questions in your own natural spoken words, never read excerpt text verbatim:\n${bookExcerpt}`
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
      : `\nIMPORTANT: No specimen photo is currently displayed on the student's screen for this ${anatomyImageCategory} station — the image bank for this category is empty, so there is nothing in front of the student to look at. You MUST NOT say or imply that a specimen is "placed in front of you", "displayed on screen", or anything the student could see — that would be misleading since nothing is shown. Instead, conduct this as a purely ORAL clue-based spotter viva: silently pick one well-known, classic ${anatomyImageCategory.toLowerCase()} specimen (including which side, if applicable) to use as the hidden ground truth for this station, but NEVER reveal its name, identity, or side before the student identifies it. Open by clearly framing it as an oral exercise and giving 1-2 concrete identifying clues (e.g. distinctive shape/markings/location) so the student has something real to reason from, for example: "Since we don't have a specimen in front of us today, let's do this one orally — I'll describe a bone and you tell me what it is: it's a long bone found in the upper limb, with a rounded head that articulates with the scapula..." Then question the student on it as if they were examining it, using your silently-chosen identity only to judge their answer and ask specimen-grounded follow-ups.`
    : "";

  const anatomyStationInstructions: Record<AnatomyImageCategory, string> = {
    Histology: "This is a Histology spotter station. After identification of the slide/tissue, ask about its distinguishing microscopic features, the organ/system it belongs to, and its functional significance.",
    Bone: "This is a Bone spotter station. After identification of the bone and side (right/left), ask about key markings/features, muscle attachments, articulations, and any nerve/vessel relations at those markings. Then, before moving to the next bone, always ask at least one radiology-correlation question grounded in the uploaded Radiology reference material: e.g. ask the student to identify this bone/joint on a plain X-ray, describe its normal radiographic appearance and landmarks, or name a common fracture pattern or radiographic sign associated with it.",
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

  // Practical/measurement stations (physiology experiments, biochemistry estimations) must always
  // be examined on the actual hands-on procedure, not just the theory behind it — a real practical
  // examiner grills the student on every step they'd have to physically perform at the bench.
  const isPracticalMeasurementStation =
    (subject === "Physiology" && (vivaType === "Hematology Experiment" || vivaType === "Human Experiments & Clinical Physiology")) ||
    (subject === "Biochemistry" && vivaType === "Serum and Urine Estimation");
  const practicalProcedureBlock = isPracticalMeasurementStation
    ? `\nThis is a hands-on PRACTICAL/measurement station, not a theory station. For every experiment or estimation topic you raise, you must actually examine the student on the real bench procedure, not just the underlying theory. Build your questions on that topic as a graduated small-to-big sequence, moving one sub-step at a time as natural follow-ups (never dump all of this as one giant question) — roughly in this order: (1) principle behind the test/experiment, (2) apparatus, reagents, or equipment required, (3) the exact step-by-step procedure the student would physically perform, in correct order, (4) precautions to take during the procedure and common technical errors that ruin the reading, (5) how the reading/result is recorded, its unit, and the normal reference range, (6) the clinical significance and interpretation of an abnormal result. Do not skip straight to clinical significance without first checking the student actually knows the procedure itself — a student who knows the disease but not the steps to get the reading has failed this station. Keep the small-talk/spot question at the very start of the topic (e.g. naming the experiment/apparatus) genuinely basic, then escalate through the procedure steps as per the difficulty rules below.`
    : "";

  const difficultyAndPacingRules = `
- Start EASY: your very first 1-2 questions on any new topic should be basic recall/identification level, so the student can settle in.
- Adapt difficulty live: if the student answers confidently and correctly, escalate — ask a noticeably tougher, more applied or clinically-correlated follow-up on the same topic before moving on. If the student struggles or answers wrong, do NOT pile on harder questions on that topic — give one simpler clarifying chance, then move to a fresh topic at basic level again.
- Never let a single topic run more than 2-3 exchanges regardless of performance — keep the viva moving across topics.
- Keep pacing realistic for a spoken exam: after asking a question, expect the student to answer within a short, focused window (roughly 45-60 seconds of real speaking) — do not expect long essays. If the student's answer is very short or trails off, treat that as their complete answer for that question rather than waiting or repeating yourself.
- WRONG-BUT-ATTEMPTED ANSWER RULE: if the student clearly attempted the question but got it wrong or confused two things, do NOT just mark it wrong and move on. React like a real examiner catching a mistake — say something like "No, think again" or "Not quite, take another look" — and give them exactly ONE immediate retry chance on the SAME question, optionally with a tiny nudge (e.g. repeating the key word). If their second attempt is still wrong, briefly give the correct answer in one sentence and move on to a fresh topic. Never give more than one retry on the same question.
- GIVE-UP RULE (different from the retry rule above): if the student says anything like "sorry sir", "I don't know", "I'm not sure", "pass", or otherwise clearly gives up without attempting, do NOT re-explain, re-ask, or offer a retry on that same question — briefly acknowledge it in one short phrase ("That's alright, let's move on") and immediately ask a fresh question on the next topic at basic level. Never dwell on a question the student has given up on.
- HURRY-UP / INTERRUPTION RULE: if the student's answer transcript sounds like it rambled on with a lot of filler or repeated itself without adding new information, briefly and naturally interrupt-acknowledge like a real impatient examiner would — a short phrase such as "Yes yes, come to the point" or "Alright, next point quickly" — before moving on. Keep this rare (only when the answer actually rambled), not on every turn.`;

  const icebreakerNote = `\nSmall-talk opener (use only when this is the very FIRST question of the whole session, i.e. no prior turns exist): before your first real subject question, spend one short natural sentence on a quick icebreaker a real examiner would actually ask — e.g. "Which college are you from?" or "Which year are you in?" or "All ready for the viva?" — then move straight into your first spot/case question in the same turn. Do not repeat this icebreaker on any later turn.`;

  const studentNameNote = studentName
    ? `\nThe student's name is ${studentName}. You may address them by name once or twice during the viva the way a real examiner glances at the mark sheet and uses a student's name occasionally — do not overuse it.`
    : "";

  return `You are ${examinerName}, a strict but fair MBBS practical/viva examiner conducting a real, spoken oral examination (viva voce / OSCE station). You are examining an Indian MBBS student on Subject: ${subject}${stationLabel}.
${examinerTone}
${studentNameNote}

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
${practicalProcedureBlock}

Rules:
- Reference ONLY gold-standard textbooks (Gray's Anatomy, BD Chaurasia, Snell's, Ganong's, Guyton & Hall, Harper's, Robbins & Cotran, Harsh Mohan, KD Tripathi, Goodman & Gilman's, Ananthanarayan & Paniker, Harrison's, Davidson's, Bailey & Love's, Sabiston, Nelson, Ghai, Dutta's, Williams Obstetrics, Park's PSM) at NEET PG examination standard.
- GROUND EVERY QUESTION: every question, fact, number, or procedural detail you ask about or state must be something a student could actually find in the reference textbooks and any uploaded notes/book excerpts referenced above — never ask about obscure trivia, invented numbers, or non-standard details that aren't genuinely covered in these sources.
- Speak naturally, the way a real examiner speaks out loud in an exam hall — short, direct sentences. Do NOT use markdown, bullet points, asterisks, or headings; this is spoken audio, not text.
- THINK LIKE A HUMAN, NOT A SCRIPT: you are not reading a fixed question bank. Actually listen to what the student just said and let it steer your very next question — pick up on a specific word, structure, or claim they made and probe that exact thing, the way a real examiner's mind works mid-conversation, rather than jumping to an unrelated pre-planned question. Occasionally think out loud for half a second before asking — a brief natural filler like "Hmm, okay..." or "Right, so..." or "Let's see..." — but keep it rare and short, not on every turn, or it gets robotic in its own way.
- VARY YOUR PHRASING: never reuse the same reaction or question template twice in a row (e.g. don't say "Good, correct" every single time, don't always structure questions the same way). Real examiners are unpredictable in wording even when the underlying rigor is consistent. Occasionally rephrase a question if the student seems confused by the wording, exactly like a human would when they sense they weren't clear the first time.
- NEVER REPEAT A QUESTION: before asking your next question, scan back through the conversation above — if you already asked this same or a near-identical question earlier in this session, do NOT ask it again. This applies even if the student's last answer was unclear, silent, or off-topic: on a genuine repeat, do not just re-ask verbatim — rephrase it in clearly different words, add a concrete hint or narrower angle to help the student answer, or if you've already tried that once, abandon the point entirely and move to a fresh topic at basic level. The ONLY exception is the single, explicitly-bounded retry allowed by the WRONG-BUT-ATTEMPTED rule below, and even that retry must never be used more than once per question — if the student still can't answer after that one retry, give the correct answer briefly and move on, never ask a third time.
- FOLLOW YOUR OWN CURIOSITY: if a student's answer reveals an interesting gap, a half-right intuition, or an unusual approach, chase it for a moment with a genuine "wait, why did you say that" style follow-up before returning to the plan — real examiners deviate from a mental checklist when something catches their attention.
- LANGUAGE STYLE: speak primarily in English, but like a real Indian examiner you may naturally mix in occasional casual Hindi or Odia words/phrases (Hinglish or Odinglish) for small-talk, filler, or informal reactions — e.g. "Theek hai, chalo agla sawaal" or "Achha, thik ache, next question" — written out in Roman/Latin script only, never in Devanagari or Odia script. ALWAYS ask the actual medical question and give the actual medical/technical content in clear English, since exact terminology matters for scoring — only the surrounding conversational filler, reactions, and small-talk should mix in Hindi/Odia words. Keep the mixing light and natural, not forced into every sentence.
- Ask ONE question at a time. Never answer your own question. Never break character.
- When the student answers, briefly react like a real examiner would, in your own varied words each time, then either probe deeper with a natural follow-up that responds to what they specifically said, or move on to the next question. Keep total spoken response to 2-4 short sentences — real examiners don't lecture.
- Maintain a firm, professional, slightly intimidating exam-hall tone, but stay fair and encouraging when the student does well. Your personal tone/style above always takes priority in HOW you deliver reactions, on top of these shared rules.${difficultyAndPacingRules}
${icebreakerNote}
- If a "Panel note" from a co-examiner appears in your instructions, weave its suggested harder question in naturally as your own next question — never mention the co-examiner or that you received a note.
- If the student clearly says they want to stop or end the viva, wish them well briefly and end.
- After roughly 4-6 questions (or once the mandatory list is exhausted plus 1-2 extra questions), tell the student the viva is complete and wrap up.`;
}

// Gemini panel member: generates ONE tougher/alternate cross-question to keep the exam rigorous.
// This is an unnamed, silent co-examiner AI — the student only ever hears the one named examiner voice.
// Soft-fails (returns null) on any error so the exam is never blocked by the second AI.
async function geminiCrossQuestion(subject: VivaSubject, transcript: string, isPracticalMeasurementStation = false): Promise<string | null> {
  try {
    const practicalNote = isPracticalMeasurementStation
      ? " This is a hands-on PRACTICAL/measurement station — your cross-question must test the actual bench procedure (principle, apparatus/reagents, step-by-step technique, precautions/sources of error, or reading the result), not just theory."
      : "";
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${CBME_CONTEXT}\n\nYou are a tough, silent co-examiner on an MBBS ${subject} viva panel, sitting alongside the lead examiner. Based on the exam transcript so far, suggest ONE noticeably tougher or more clinically-applied follow-up/cross-question on ${subject} that would test deeper understanding than what has been asked.${practicalNote} The question must be grounded strictly in standard MBBS reference textbooks for ${subject} at NEET PG standard — never invent obscure trivia or non-standard facts. Return ONLY the question text, no preamble, no quotes.\n\nTranscript so far:\n${transcript.slice(-4000)}`,
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
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
): Promise<void> {
  const stream = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice, format: "pcm16" },
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
    const isBoneStation = subject === "Anatomy" && vivaType === "Bone";
    const startQueryHint = isBoneStation
      ? [topic || vivaType, "X-ray radiograph radiological appearance fracture"].join(" ")
      : topic || vivaType || "";
    const [sourceNotes, bookExcerpt] = await Promise.all([
      fetchSourceNotes(subject),
      fetchBookExcerpt(subject, startQueryHint, isBoneStation ? /radiolog/i : undefined),
    ]);
    const studentName = (req as any).user?.fullName || null;
    const persona = buildExaminerPersona(subject, sourceNotes, vivaType, imageCaption, bookExcerpt, anatomyImageGroundTruth, studentName);
    const stationName = vivaType ? `${subject} — ${vivaType}` : subject;
    const hasVisual = !!imageCaption || !!anatomyImageId;
    await streamExaminerAudioTurn(
      res,
      [
        { role: "system", content: persona },
        {
          role: "user",
          content: `Begin the ${stationName} viva${topic ? `, Topic: ${topic}` : ""}. Greet the student briefly like a real examiner would when a student walks in and sits down — mention this is the ${stationName} viva. Since this is the very start of the session, follow the small-talk opener instruction in your persona before asking your first spot/case question${hasVisual ? " about the image displayed to the student" : ""}. Start at a basic/easy level. Keep it short and spoken, 3-4 sentences total including the icebreaker.`,
        },
      ],
      EXAMINER_VOICE[subject]
    );
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
    // Faculty source notes only depend on `subject`, which is known immediately — kick this
    // fetch off now so it overlaps with the audio conversion/silence-check/transcription
    // pipeline below instead of waiting until after the transcript is ready.
    const sourceNotesPromise = fetchSourceNotes(subject);

    const rawBuffer = Buffer.from(audioBase64, "base64");
    if (rawBuffer.length < 100) {
      sendEvent(res, { type: "error", error: "No speech detected. Please try again." });
      res.end();
      return;
    }

    // Format normalization and silence detection are combined into a single ffmpeg pass
    // (see convertAndCheckSilence) instead of two sequential ffmpeg spawns — this halves
    // process-spawn + temp-file I/O latency on every voice turn. Speech-to-text models can
    // hallucinate a plausible-sounding transcript from silent or near-silent audio instead of
    // returning empty text, so we still screen for silence up front so a student who never
    // actually answered can't get a fabricated transcript scored as a real response.
    const { buffer, format, isSilent } = await convertAndCheckSilence(rawBuffer);

    if (isSilent) {
      sendEvent(res, { type: "error", error: "No speech detected. Please try again." });
      res.end();
      return;
    }

    const userTranscript = (await speechToText(buffer, format, "en", STT_VOCABULARY_HINT[subject])).trim();

    if (!userTranscript || isHallucinatedTranscript(userTranscript) || isUnexpectedScript(userTranscript)) {
      sendEvent(res, { type: "error", error: "Could not hear your answer clearly. Please try again in English." });
      res.end();
      return;
    }

    sendEvent(res, { type: "user_transcript", data: userTranscript });

    const recentTranscript = [...history.slice(-4), { role: "user" as const, content: userTranscript }]
      .map((h) => h.content)
      .join(" ");
    const isBoneStation = subject === "Anatomy" && vivaType === "Bone";
    const queryHint = isBoneStation
      ? [topic, vivaType, recentTranscript, "X-ray radiograph radiological appearance fracture"].filter(Boolean).join(" ")
      : [topic, vivaType, recentTranscript].filter(Boolean).join(" ");

    // Dynamic follow-up pressure: bring in the Gemini panel member's tougher cross-question
    // suggestion immediately whenever the student's answer was weak/vague/a give-up, like a real
    // examiner probing a shaky answer right away — not just on a fixed every-3rd-turn cadence.
    // The fixed cadence is kept as a fallback so a student who is doing fine also still gets
    // occasional escalation, matching a real exam board's tendency to test depth periodically.
    const answerCount = history.filter((h) => h.role === "user").length + 1;
    const weakAnswer = isWeakOrVagueAnswer(userTranscript);
    const needsCrossQuestion = weakAnswer || (answerCount >= 2 && answerCount % 3 === 0);
    const isPracticalMeasurementStation =
      (subject === "Physiology" && (vivaType === "Hematology Experiment" || vivaType === "Human Experiments & Clinical Physiology")) ||
      (subject === "Biochemistry" && vivaType === "Serum and Urine Estimation");

    // Run the book-excerpt RAG lookup and the (conditional) Gemini cross-question call
    // concurrently with the already-in-flight source notes fetch, instead of awaiting the
    // Gemini call only after the RAG fetches finish. This is the main latency win for this
    // route since geminiCrossQuestion is a full extra model round-trip.
    const [sourceNotes, bookExcerpt, crossQuestion] = await Promise.all([
      sourceNotesPromise,
      fetchBookExcerpt(subject, queryHint, isBoneStation ? /radiolog/i : undefined),
      needsCrossQuestion
        ? geminiCrossQuestion(subject, historyToTranscript([...history, { role: "user", content: userTranscript }]), isPracticalMeasurementStation)
        : Promise.resolve(null),
    ]);
    const stationName = vivaType ? `${subject} — ${vivaType}` : subject;
    const studentName = (req as any).user?.fullName || null;
    let persona = buildExaminerPersona(subject, sourceNotes, vivaType, imageCaption, bookExcerpt, anatomyImageGroundTruth, studentName) + `\nCurrent viva Subject: ${stationName}${topic ? `, Topic: ${topic}` : ""}.`;

    if (crossQuestion) {
      persona += weakAnswer
        ? `\n\nThe student's last answer was weak, vague, or a give-up. Panel note from co-examiner: probe this immediately with a sharper follow-up on the SAME topic before moving anywhere else, phrased naturally in your own voice: "${crossQuestion}"`
        : `\n\nPanel note from co-examiner: consider asking this harder question next, phrased naturally in your own voice: "${crossQuestion}"`;
    }

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: persona },
      ...history,
      { role: "user", content: userTranscript },
    ];

    await streamExaminerAudioTurn(res, messages, EXAMINER_VOICE[subject]);
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

    const userId = (req as any).user?.id;
    if (userId) {
      awardXp(userId, XP_VALUES.VIVA_COMPLETE, "viva_complete", `Completed ${subject} viva`).catch((err) => {
        console.error("Practical Hub: failed to award viva completion XP", err);
      });
    }

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
