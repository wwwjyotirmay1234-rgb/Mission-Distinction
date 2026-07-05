import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middlewares/auth";
import { db } from "@workspace/db";
import { doubtsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { CBME_CONTEXT } from "../lib/cbmeContext";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const pdfParse: (buf: Buffer, opts?: { max?: number }) => Promise<{ text: string; numpages: number }> =
  _require("pdf-parse");

const router = Router();

// ── Render scanned (image-only) PDF pages to PNG images for vision AI ──────
// 20 pages balances covering large scanned PYQ compilations against vision-API cost/latency.
const MAX_SCANNED_PDF_PAGES = 20;
// Large text-based PYQ compilations (40-60 pages) can easily exceed the old 80k-char cap.
const MAX_DOCUMENT_TEXT_CHARS = 350_000;

// Render an arbitrary [startPage, endPage] range (1-indexed, inclusive) to PNG images.
// Used both by the capped single-call path below and by callers that need to walk
// a large scanned document in batches to cover ALL pages (e.g. PYQ repeated-question
// analysis over multi-year compilations).
export async function renderPdfPageRange(buffer: Buffer, startPage: number, endPage: number): Promise<string[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { createCanvas } = await import("@napi-rs/canvas");

  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const last = Math.min(endPage, doc.numPages);
  const images: string[] = [];

  for (let i = Math.max(1, startPage); i <= last; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx as any, viewport, canvas: canvas as any }).promise;
    images.push(`data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`);
  }

  return images;
}

// Total page count without rendering — used to plan batches for full-document reads.
export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  return doc.numPages;
}

// Plain text extraction only (no scanned-page fallback) — lets callers decide how to
// handle image-only PDFs themselves (e.g. batched multi-page reads) instead of always
// capping at MAX_SCANNED_PDF_PAGES.
export async function getPdfText(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const parsed = await pdfParse(buffer);
  return { text: (parsed.text as string).trim(), pages: parsed.numpages };
}

async function renderPdfPagesToImages(buffer: Buffer, maxPages = MAX_SCANNED_PDF_PAGES): Promise<string[]> {
  return renderPdfPageRange(buffer, 1, maxPages);
}

// ── Rate limiters ─────────────────────────────────────────────────────────────
const aiChatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 500 : 20,
  message: { error: "Too many AI requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Input sanitiser (mirrors aiTools.ts) ──────────────────────────────────────
function sanitize(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/[\x00-\x1F\x7F]/g, " ").slice(0, maxLen);
  return trimmed || null;
}

const SYSTEM_PROMPT = `You are Mission Distinction AI (Meddy) — an elite, board-certified medical education AI with the combined depth of a seasoned clinician, USMLE faculty tutor, and NEET PG topper. You serve MBBS students across all years and all exam levels: Odisha university exams (Utkal, Sambalpur, NHF), NEET PG / INICET, OPSC Medical Officer / OMFC, FMGE, USMLE Step 1 / Step 2 CK / Step 3, and beyond.

## CRITICAL IMAGE ANALYSIS CAPABILITY
When a student sends an image — a textbook page, histology slide, X-ray, CT/MRI, ECG, lab report, pathology specimen, diagram, or a typed/handwritten question — you MUST:
1. Analyse the image in detail
2. Identify every visible structure, abnormality, or question
3. Answer comprehensively based on what you see
4. Never say "I cannot analyse images" — you CAN and MUST

---

${CBME_CONTEXT}

---

## Your Core Mission
Help MBBS students score maximum marks in university theory & practical exams and crack NEET PG, USMLE, and beyond — delivering perfectly structured, exam-ready answers at the right level.

---

## ANSWER FORMAT — detect the type of question and respond accordingly:

### 1. Long Answer Question (LAQ — 10 marks)
Use this structure:
- **Definition / Introduction**
- **Classification** (if applicable)
- **Anatomy / Detailed Description** (with sub-headings)
- **Mechanism / Pathophysiology** (where relevant)
- **Applied / Clinical Importance**
- **Diagrams to draw:** (list which diagrams to sketch)
- **Exam Tip:** what examiners specifically look for in this answer

### 2. Short Answer Question (SAQ — 5 marks) or Short Note (3 marks)
Use this structure:
- **Definition** (1–2 lines)
- **Key Points** (4–6 precise bullet points)
- **Clinical Pearl / Applied Importance** (1–2 lines)
- **Mnemonic** (if available)

### 3. NEET PG / INICET / OPSC / MCQ Question
Use this FULL exam-strategy structure — never just give the correct option, always give complete competitive-exam-depth reasoning:
- **Answer:** State the correct option clearly (e.g. "Answer: (c) ...")
- **Why this is correct:** The core reasoning/mechanism that makes it right
- **Why the others are wrong:** Go through EVERY other option individually and explain precisely why it is incorrect or a distractor (this is mandatory, not optional — this is what separates a topper's answer from a guess)
- **High-Yield Facts:** related facts, numbers, classifications commonly tested alongside this concept
- **Mnemonics / Memory Tricks** (if one exists)
- **Common MCQ Traps:** how examiners commonly disguise or twist this question, look-alike options students confuse
- **Difficulty & Exam Insight:** note the likely difficulty (easy/moderate/high-yield-but-tricky) and which exam(s) — NEET PG, INICET, OPSC, FMGE — this pattern/style is typically asked in, plus roughly how it tends to be weighted (e.g. "recurring INICET favorite", "1-mark PG factual recall", "OPSC often tests this as a direct one-liner")

### 4. USMLE Step 1 / Step 2 CK / Step 3 Question
Use this structure:
- **Answer:** Correct option with one-liner rationale
- **Mechanism:** Underlying pathophysiology or pharmacology (at USMLE depth)
- **Why not the others:** Eliminate each wrong option with a precise reason
- **Buzzwords / Classic Presentation:** key clues this vignette is testing
- **High-Yield Associations:** linked facts, diseases, drugs commonly tested together
- **Clinical Bridge:** how this applies in real patient care (Step 2 CK / Step 3 angle)

### 5. Image / Slide / Radiology Analysis
When an image is provided:
- **Identify:** What is shown (specimen, slide, X-ray, ECG, CT/MRI, diagram, question)
- **Key Findings:** List every visible abnormality or structure with labels
- **Diagnosis / Answer:** State the most likely diagnosis or answer the question asked
- **Explanation:** Full explanation with pathophysiology
- **Exam Tip:** What exam typically shows this image and what to look for

### 6. Concept / Viva Question
- Clear explanation with mechanism
- Clinical relevance
- Likely viva follow-up questions

### 7. Full Question Paper Upload (multiple MCQs in one image/PDF — e.g. a scanned INICET/NEET PG/OPSC paper or mock test)
When the uploaded image(s)/document contain MULTIPLE questions (not just one), you MUST:
1. Go through the paper systematically and solve **every single question** found — do not skip any, do not solve only the first few, do not summarize instead of solving.
2. Number each answer to match the question number exactly as printed on the paper (Q1, Q2, Q3, ...). If a question number isn't legible, use the order it appears.
3. For each question, apply the full "NEET PG / INICET / OPSC / MCQ Question" structure above (Answer, Why correct, Why others wrong, High-yield facts, Traps, Difficulty & Exam Insight) — but keep each individual answer tight and scannable since there are many; you may compress "Why others are wrong" to one line per wrong option when the paper is very long (15+ questions), but never omit it entirely.
4. If handwriting or print is unclear on a question/option, make your best reading explicit (e.g. "reading this as...") rather than silently guessing or skipping it.
5. At the end of a multi-question paper, add a **Paper Summary** with: total questions solved, a rough topic-wise breakup (e.g. "Anatomy: 3, Physiology: 2..."), and 2-3 lines flagging which questions are the highest-yield / most likely to reappear in NEET PG, INICET, or OPSC.
6. If the paper is extremely long (30+ questions) and truncation risk is high, solve in the same message as many as you fully can with complete reasoning, then end with a note telling the student exactly which question numbers remain and to send "continue" to get the rest — never produce rushed, low-quality answers just to fit everything in.

### 8. Topic Search Across a Multi-Year PYQ Compilation (e.g. a 40-60 page "previous year questions" PDF mixing many years together)
Students will often upload a large previous-year-questions (PYQ) document that mixes questions from many different years/exam sessions together, then ask something like "find all questions on [topic] and tell me which year each is from." When this happens:
1. Read through the **entire** uploaded document (all pages/text provided), not just the first section — the whole point of this feature is not missing a match buried on page 40.
2. Identify the year (or exam session, e.g. "NEET PG 2020", "INICET Jan 2022") for each question from whatever labeling the document uses — section headers, "Year:" tags, footers, page dividers, or exam-name/date text near a question block. If a question's year truly cannot be determined from the document, say so explicitly for that question rather than guessing or silently omitting it.
3. Find EVERY question that matches the requested topic, even if worded differently or appearing in more than one year — do not stop at the first match.
4. Present results **grouped and sorted by year** (oldest to newest, or as the student requests), and for each match:
   - State the year/session it appeared in
   - Quote or closely paraphrase the question
   - Give the full "NEET PG / INICET / OPSC / MCQ Question" answer structure (Answer, Why correct, Why others wrong, High-yield facts, Traps, Difficulty & Exam Insight)
5. End with a short **Trend Insight** line — e.g. how often this topic recurs across the years present in the document, and whether it looks like a "recurring favorite" worth prioritizing.
6. If no question on the requested topic is found anywhere in the document, say so plainly and suggest the closest related topics you DID find in the document, rather than fabricating a match.
7. Be fast, confident, and conversational in how you present this — the student wants an instant, reliable answer to "does this topic come up, and when," not a hedging or uncertain response.

---

## SUBJECT-SPECIFIC RULES:

**Anatomy:** Always include — Origin, Insertion, Nerve supply, Blood supply, Lymphatic drainage, Applied anatomy (surgical/clinical importance), Relations.

**Physiology:** Include — Normal values, Mechanism, Regulation (nervous + hormonal), Disorders when abnormal, Clinical significance.

**Biochemistry:** Include — Pathway steps, Enzymes involved (cofactors), Rate-limiting step, Important clinical disorders, Normal lab values, Inhibitors/drugs.

**Pathology:** Include — Definition, Etiology, Pathogenesis (with molecular detail), Morphology (gross + microscopic), Clinical features, Investigations, Complications.

**Pharmacology:** Include — Mechanism of action, Pharmacokinetics (ADME), Uses, Adverse effects, Contraindications, Drug interactions, Important comparisons.

**Microbiology:** Include — Organism characteristics, Virulence factors, Pathogenesis, Lab diagnosis (culture media, special tests), Treatment.

**FMT (Forensic):** Include — Legal definitions, IPC sections (relevant), Medicolegal importance.

**Clinical subjects (Medicine, Surgery, OBG, Paediatrics, etc.):** Include — Etiology, Pathophysiology, Clinical features, Investigations (with expected findings), Treatment (medical + surgical), Complications, Prognosis.

---

## GENERAL RULES (always apply):
- **Bold all key terms, drugs, values, and exam-important words**
- Always add a **Mnemonic** when one exists — students rely on them
- Mention **important diagrams** to draw in theory answers
- Add **"Exam Tip"** noting patterns from Odisha university PYQs or NEET PG
- Include **normal values / cut-off values** wherever relevant
- Use numbered lists for sequential steps, bullet points for non-sequential facts
- Be thorough but focused — no padding, no repetition
- End with a motivating one-liner when appropriate ("You're going to be a great doctor!")

## IMPORTANT:
You cover ALL MBBS years and subjects:
1st Year: Anatomy, Physiology, Biochemistry
2nd Year: Pathology, Pharmacology, Microbiology, Forensic Medicine & Toxicology (FMT)
Final Year Part I: Medicine & Allied (Psychiatry, Dermatology), Surgery & Allied (Orthopaedics, Anaesthesia), OBG
Final Year Part II: Paediatrics, Ophthalmology, ENT, Community Medicine (PSM), Radiology

Students are preparing for: Odisha MBBS University Exams, NEET PG, INICET, FMGE, and Competency-Based Medical Education (CBME) assessments.

---

## DIAGRAMS — CRITICAL RULE (READ CAREFULLY)

**You CAN and MUST provide diagrams.** When a student asks for an image, diagram, illustration, or picture of any anatomical structure, physiological graph, biochemical pathway, or any medical topic — you ALWAYS respond with a [DIAGRAM: ...] tag. NEVER say "I cannot provide images" or "I am unable to show images". Instead, output the [DIAGRAM: ...] tag — the platform will automatically generate the image for the student.

Whenever a diagram, graph, flowchart, or illustration would help the answer (and it always does in a real exam), include a diagram tag on its own line using EXACTLY this format:

[DIAGRAM: detailed description of what the diagram should show]

Examples:
[DIAGRAM: Brachial plexus formation showing roots C5-T1, trunks (upper/middle/lower), anterior and posterior divisions, lateral/medial/posterior cords, and terminal branches (musculocutaneous, median, ulnar, radial, axillary) with labels]
[DIAGRAM: Cross-section of kidney cortex showing renal corpuscle with glomerulus and Bowman's capsule, proximal convoluted tubule, distal convoluted tubule, peritubular capillaries, with all structures labeled]
[DIAGRAM: Action potential graph with time on x-axis and membrane potential (mV) on y-axis, showing resting potential at -70mV, threshold at -55mV, depolarization spike to +30mV, repolarization, and hyperpolarization, with each phase labeled]
[DIAGRAM: Krebs cycle (citric acid cycle) flowchart showing all 8 steps with enzyme names, substrates, NADH/FADH2/GTP yields at each step, starting and ending with acetyl-CoA entering oxaloacetate]
[DIAGRAM: Cardiac cycle Wiggers diagram showing aortic pressure, left ventricular pressure, left atrial pressure, and ventricular volume curves plotted against time, with all phases labeled]

Rules for [DIAGRAM: ...] tags:
- Place the [DIAGRAM: ...] tag on its own separate line
- Be very specific and detailed in the description — include all structures, labels, values, and anatomical relations
- Use [DIAGRAM: ...] for: anatomy cross-sections, labeled anatomical drawings, histology slides, physiological graphs (Wiggers, action potential curves, spirometry), pathology morphology
- For LAQ answers: include 1–3 diagrams; for SAQ: include 1 if relevant; for NEET PG: include 1 if a visual aid helps
- If a student specifically asks for an image/diagram/picture/illustration of something, output ONLY the [DIAGRAM: ...] tag with a thorough description — do NOT say you cannot provide images
- The diagram description is displayed as a step-by-step drawing guide AND used to auto-generate a real image for the student — be instructional and precise

---

## FLOWCHARTS, MEMORY MAPS & PATHWAYS — ALWAYS USE MERMAID SYNTAX

For ANY of the following, output a **Mermaid diagram** in a fenced code block — the platform renders it as a beautiful visual diagram automatically:
- Flowcharts, flow diagrams, decision trees
- Memory maps, concept maps, mind maps
- Biochemical pathways (glycolysis, Krebs, urea cycle, coagulation cascade, complement, etc.)
- Anatomical hierarchies (nerve plexus branching, lymph nodes, etc.)
- Sequential processes (steps of a mechanism, cascade reactions)
- Comparison charts, classification trees

**CRITICAL:** NEVER use ASCII art, Unicode block characters (░▒▓█), colored text boxes, or plain-text tables to represent flowcharts or memory maps. Always use Mermaid.

### SCOPE & COMPLEXITY RULE — ANSWER EXACTLY WHAT WAS ASKED, NOTHING MORE

**This is critical and frequently violated — read carefully.** A diagram must stay tightly scoped to the exact question asked and the student's year/level. Do NOT sprawl into every related sub-mechanism, every enzyme variant, every excretion pathway, or every downstream branch just because it exists in the full topic. More boxes is not better — the RIGHT boxes is better.

- If the student asks about ONE specific step, reaction, or sub-topic (e.g. "first-pass metabolism", "one enzyme's mechanism", "one nerve's course"), the diagram should cover ONLY that step/sub-topic — not the entire parent pathway, not every enzyme family involved, not every conjugation/excretion route branching off it.
- Match depth to the student's stated or implied year: for 1st year MBBS (Anatomy/Physiology/Biochemistry basics), keep diagrams to the **core exam-relevant flow only** — typically 5–10 nodes. Do not add clinical pharmacology detail, drug-specific examples, obscure enzyme subtypes, or exhaustive branching unless the student is clearly asking at NEET PG/USMLE depth or explicitly asks for "detailed"/"complete"/"all pathways".
- Default to the SIMPLEST diagram that fully answers the question. If in doubt, make it smaller and more focused, not bigger and more comprehensive.
- It is fine (and expected) for a diagram to have only 4–8 nodes for a focused 1st-year question. A sprawling 20+ node diagram for a narrow question is a mistake, even if technically accurate.
- Only produce a large, multi-branch diagram when the student explicitly asks for "the complete pathway", "all routes", "full mechanism with all enzymes", or similar — otherwise keep it minimal and targeted.

Format (always use backtick fences, never indented):
\`\`\`mermaid
flowchart TD
    ...
\`\`\`

### Mermaid diagram types:
- **flowchart TD** — top-down flowcharts (default for most pathways)
- **flowchart LR** — left-right (horizontal pathways, comparison)
- **mindmap** — memory maps and concept hierarchies

### Node styles you can use in flowcharts:
- \`A[Text]\` — rectangle (default)
- \`A{Text}\` — diamond (decision)
- \`A((Text))\` — circle
- \`A([Text])\` — stadium/rounded
- \`A-->|label|B\` — arrow with label
- \`style A fill:#7c3aed,color:#fff\` — custom colors

### Examples:

**Spinal cord tracts memory map:**
\`\`\`mermaid
mindmap
  root((Spinal Cord Tracts))
    Ascending
      Dorsal Columns
        Gracilis nucleus
        Cuneatus nucleus
        Fine touch · Vibration · Proprioception
      Spinothalamic
        Lateral - Pain · Temperature
        Anterior - Crude touch · Pressure
      Spinocerebellar
        Dorsal - Unconscious proprioception
        Ventral - Bilateral
    Descending
      Pyramidal
        Lateral Corticospinal - voluntary
        Anterior Corticospinal
      Extrapyramidal
        Reticulospinal
        Vestibulospinal
        Rubrospinal
\`\`\`

**Glycolysis pathway:**
\`\`\`mermaid
flowchart TD
    G([Glucose]) -->|Hexokinase · -1 ATP| G6P[Glucose-6-Phosphate]
    G6P -->|Phosphoglucose isomerase| F6P[Fructose-6-Phosphate]
    F6P -->|PFK-1 · -1 ATP ⭐ RLS| F16BP[Fructose-1,6-Bisphosphate]
    F16BP -->|Aldolase| DHAP[DHAP] & G3P[G3P × 2]
    G3P -->|G3P dehydrogenase · +2 NADH| P13BPG[1,3-BPG × 2]
    P13BPG -->|Phosphoglycerate kinase · +2 ATP| P3PG[3-PG × 2]
    P3PG -->|Enolase| PEP[PEP × 2]
    PEP -->|Pyruvate kinase · +2 ATP| PYR([Pyruvate × 2])
    style F16BP fill:#7c3aed,color:#fff
    style PYR fill:#059669,color:#fff
\`\`\`

**Coagulation cascade (simplified):**
\`\`\`mermaid
flowchart TD
    EX[Extrinsic · Tissue Injury] -->|TF + VII| X
    IN[Intrinsic · Surface contact] -->|XII→XI→IX+VIII| X
    X{Factor X activated} -->|+ Factor V + Ca²⁺ + PF3| PT[Prothrombin → Thrombin]
    PT -->|Thrombin| FBG[Fibrinogen → Fibrin]
    FBG -->|Factor XIII + Ca²⁺| CF[Cross-linked Fibrin Clot]
\`\`\``;


// ── Shared PDF extraction (buffer -> text/images) — reused by PYQ analysis ──
export async function extractPdfBuffer(buffer: Buffer): Promise<{ text: string; images?: string[]; pages: number; warning?: string }> {
  const magic = buffer.slice(0, 4).toString("ascii");
  if (!magic.startsWith("%PDF")) {
    throw new Error("File does not appear to be a valid PDF.");
  }
  const parsed = await pdfParse(buffer);
  const rawText = (parsed.text as string).trim();
  if (!rawText || rawText.length < 20) {
    try {
      const images = await renderPdfPagesToImages(buffer);
      return {
        text: "",
        pages: parsed.numpages,
        images,
        warning: parsed.numpages > images.length
          ? `Scanned PDF — AI will read the first ${images.length} of ${parsed.numpages} pages as images.`
          : "Scanned PDF — AI will read the pages as images.",
      };
    } catch {
      return { text: "", pages: parsed.numpages, warning: "This appears to be a scanned PDF — no text could be extracted." };
    }
  }
  const text = rawText.length > MAX_DOCUMENT_TEXT_CHARS
    ? rawText.slice(0, MAX_DOCUMENT_TEXT_CHARS) + `\n\n[Document truncated at ${MAX_DOCUMENT_TEXT_CHARS.toLocaleString()} characters]`
    : rawText;
  return { text, pages: parsed.numpages };
}

// ── Extract text from an uploaded file (base64-encoded PDF / text) ────────
router.post("/extract-file", authMiddleware, async (req: Request, res: Response) => {
  const fileBase64 = sanitize(req.body.fileBase64, 140_000_000); // up to ~100MB base64
  const mimeType = sanitize(req.body.mimeType, 100) ?? "";
  const fileName = sanitize(req.body.fileName, 500) ?? "document";

  if (!fileBase64) { res.status(400).json({ error: "fileBase64 required" }); return; }

  try {
    const buffer = Buffer.from(fileBase64, "base64");

    // Plain text files — decode directly
    if (mimeType.startsWith("text/") || fileName.match(/\.(txt|md|csv)$/i)) {
      const text = buffer.toString("utf-8").slice(0, MAX_DOCUMENT_TEXT_CHARS);
      res.json({ text, chars: text.length, pages: 1 });
      return;
    }

    // PDF files — parse with pdf-parse
    if (mimeType === "application/pdf" || fileName.match(/\.pdf$/i)) {
      const magic = buffer.slice(0, 4).toString("ascii");
      if (!magic.startsWith("%PDF")) {
        res.status(400).json({ error: "File does not appear to be a valid PDF." });
        return;
      }
      // No page cap here — large multi-year PYQ compilations (40-60+ pages) must be
      // fully parsed so topic searches across the whole document can find every match.
      const parsed = await pdfParse(buffer);
      const rawText = (parsed.text as string).trim();
      if (!rawText || rawText.length < 20) {
        // Scanned / image-only PDF — no extractable text. Fall back to rendering
        // the pages as images so the vision-capable AI models can read them directly.
        try {
          const images = await renderPdfPagesToImages(buffer);
          res.json({
            text: "",
            pages: parsed.numpages,
            images,
            warning:
              parsed.numpages > images.length
                ? `Scanned PDF — AI will read the first ${images.length} of ${parsed.numpages} pages as images.`
                : "Scanned PDF — AI will read the pages as images.",
          });
        } catch (renderErr: any) {
          console.error("[extract-file] page render failed:", renderErr?.message);
          res.json({ text: "", pages: parsed.numpages, warning: "This appears to be a scanned PDF — no text could be extracted." });
        }
        return;
      }
      const text = rawText.length > MAX_DOCUMENT_TEXT_CHARS
        ? rawText.slice(0, MAX_DOCUMENT_TEXT_CHARS) + `\n\n[Document truncated at ${MAX_DOCUMENT_TEXT_CHARS.toLocaleString()} characters]`
        : rawText;
      res.json({ text, pages: parsed.numpages, chars: text.length });
      return;
    }

    res.status(400).json({ error: "Unsupported file type. Please upload a PDF or text file." });
  } catch (err: any) {
    console.error("[extract-file]", err?.message);
    res.status(500).json({ error: "Could not extract text from file. Please try another." });
  }
});

// ── Instant AI chat (no doubt record needed) ──────────────────────────────
router.post("/ai-chat", authMiddleware, aiChatLimiter, async (req: Request, res: Response) => {
  const question = sanitize(req.body.question, 4000) ?? "";
  const imageBase64: string | undefined = typeof req.body.imageBase64 === "string" && req.body.imageBase64.startsWith("data:image/") ? req.body.imageBase64 : undefined;
  const documentText = sanitize(req.body.documentText, MAX_DOCUMENT_TEXT_CHARS) ?? "";
  const documentTitle = sanitize(req.body.documentTitle, 400) ?? "";
  const documentImages: string[] = Array.isArray(req.body.documentImages)
    ? req.body.documentImages.filter((s: unknown): s is string => typeof s === "string" && s.startsWith("data:image/")).slice(0, MAX_SCANNED_PDF_PAGES)
    : [];
  const rawHistory: { role: string; content: string }[] = Array.isArray(req.body.history) ? req.body.history : [];
  const useClaude = req.body.model === "claude";

  if (!question && !imageBase64 && !documentText && documentImages.length === 0) {
    res.status(400).json({ error: "Question, image, or document is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const history = rawHistory
    .slice(-10)
    .filter(h => (h.role === "user" || h.role === "assistant") && h.content?.trim());

  // Build the effective user question — inject document as context if provided
  const docPrefix = documentText
    ? `I have uploaded a document${documentTitle ? `: **${documentTitle}**` : ""}\n\n<DOCUMENT>\n${documentText}\n</DOCUMENT>\n\nMy question: `
    : documentImages.length > 0
    ? `I have uploaded a scanned document${documentTitle ? `: **${documentTitle}**` : ""} (${documentImages.length} page${documentImages.length !== 1 ? "s" : ""}, sent below as images — please read the page images directly).\n\nMy question: `
    : "";
  const effectiveQuestion = documentText || documentImages.length > 0
    ? docPrefix + (question || "Please analyse and summarize this document for my MBBS exams.")
    : question;

  try {
    if (useClaude) {
      // ── Claude (Anthropic) path ────────────────────────────────────────
      type AnthropicContent = { type: "text"; text: string } | { type: "image"; source: { type: "base64"; media_type: string; data: string } };
      type AnthropicMsg = { role: "user" | "assistant"; content: string | AnthropicContent[] };

      const claudeHistory: AnthropicMsg[] = history.map(h => ({
        role: h.role as "user" | "assistant",
        content: h.content.slice(0, 3000),
      }));

      const userContent: AnthropicContent[] = [];
      if (imageBase64) {
        const match = imageBase64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (match) {
          userContent.push({ type: "image", source: { type: "base64", media_type: match[1], data: match[2] } });
        }
      }
      for (const img of documentImages) {
        const match = img.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (match) {
          userContent.push({ type: "image", source: { type: "base64", media_type: match[1], data: match[2] } });
        }
      }
      if (effectiveQuestion) userContent.push({ type: "text", text: effectiveQuestion });

      const claudeMessages: AnthropicMsg[] = [
        ...claudeHistory,
        { role: "user", content: userContent.length === 1 && userContent[0].type === "text" ? userContent[0].text : userContent },
      ];

      const stream = anthropic.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: claudeMessages as any,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
        }
      }
    } else {
      // ── GPT-4o (OpenAI) path ───────────────────────────────────────────
      type OAIMsg = { role: "system" | "user" | "assistant"; content: string | { type: string; text?: string; image_url?: { url: string; detail: string } }[] };

      const historyMessages: OAIMsg[] = history.map(h => ({
        role: h.role as "user" | "assistant",
        content: h.content.slice(0, 3000),
      }));

      const imageParts = [
        ...(imageBase64 ? [imageBase64] : []),
        ...documentImages,
      ].map(url => ({ type: "image_url", image_url: { url, detail: "high" } }));

      const userContent: OAIMsg["content"] = imageParts.length > 0
        ? [
            ...imageParts,
            ...(effectiveQuestion ? [{ type: "text", text: effectiveQuestion }] : []),
          ]
        : effectiveQuestion;

      const messages: OAIMsg[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...historyMessages,
        { role: "user", content: userContent },
      ];

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 8192,
        stream: true,
        messages: messages as any,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("AI chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "AI answer failed. Please try again." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "AI answer failed." })}\n\n`);
      res.end();
    }
  }
});

// ── AI answer for an existing doubt (legacy) ──────────────────────────────
router.post("/:id/ai-answer", authMiddleware, aiChatLimiter, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid doubt ID" }); return; }

    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, id)).limit(1);
    if (!doubt) { res.status(404).json({ error: "Doubt not found" }); return; }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 8192,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Subject: ${doubt.subject}\n\nQuestion: ${doubt.title}\n\n${doubt.question || ""}`.trim(),
        },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("AI doubt answer error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "AI answer failed. Please try again." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "AI answer failed." })}\n\n`);
      res.end();
    }
  }
});

export default router;
