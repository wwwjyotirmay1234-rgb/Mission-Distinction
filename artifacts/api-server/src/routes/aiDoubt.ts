import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middlewares/auth";
import { db } from "@workspace/db";
import { doubtsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
const pdfParse: (buf: Buffer, opts?: { max?: number }) => Promise<{ text: string; numpages: number }> =
  _require("pdf-parse");

const router = Router();

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

const SYSTEM_PROMPT = `You are Mission Distinction AI (Meddy) — an elite, board-certified medical education AI with the combined depth of a seasoned clinician, USMLE faculty tutor, and NEET PG topper. You serve MBBS students across all years and all exam levels: Odisha university exams (Utkal, Sambalpur, NHF), NEET PG / INICET, FMGE, USMLE Step 1 / Step 2 CK / Step 3, and beyond.

## CRITICAL IMAGE ANALYSIS CAPABILITY
When a student sends an image — a textbook page, histology slide, X-ray, CT/MRI, ECG, lab report, pathology specimen, diagram, or a typed/handwritten question — you MUST:
1. Analyse the image in detail
2. Identify every visible structure, abnormality, or question
3. Answer comprehensively based on what you see
4. Never say "I cannot analyse images" — you CAN and MUST

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

### 3. NEET PG / INICET / MCQ Question
Use this structure:
- **Answer:** State the correct answer with a crisp 1-line reason
- **Explanation:** High-yield concept with key facts
- **Mnemonics / Memory Tricks**
- **Common MCQ Traps:** frequently confused points, look-alike options
- **Related High-Yield Facts** for NEET PG

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


// ── Extract text from an uploaded file (base64-encoded PDF / text) ────────
router.post("/extract-file", authMiddleware, async (req: Request, res: Response) => {
  const fileBase64 = sanitize(req.body.fileBase64, 50_000_000); // up to ~35MB base64
  const mimeType = sanitize(req.body.mimeType, 100) ?? "";
  const fileName = sanitize(req.body.fileName, 500) ?? "document";

  if (!fileBase64) { res.status(400).json({ error: "fileBase64 required" }); return; }

  try {
    const buffer = Buffer.from(fileBase64, "base64");

    // Plain text files — decode directly
    if (mimeType.startsWith("text/") || fileName.match(/\.(txt|md|csv)$/i)) {
      const text = buffer.toString("utf-8").slice(0, 80_000);
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
      const parsed = await pdfParse(buffer, { max: 80 });
      const rawText = (parsed.text as string).trim();
      if (!rawText || rawText.length < 20) {
        res.json({ text: "", pages: parsed.numpages, warning: "This appears to be a scanned PDF — no text could be extracted." });
        return;
      }
      const text = rawText.length > 80_000 ? rawText.slice(0, 80_000) + "\n\n[Document truncated at 80,000 characters]" : rawText;
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
  const documentText = sanitize(req.body.documentText, 80_000) ?? "";
  const documentTitle = sanitize(req.body.documentTitle, 400) ?? "";
  const rawHistory: { role: string; content: string }[] = Array.isArray(req.body.history) ? req.body.history : [];
  const useClaude = req.body.model === "claude";

  if (!question && !imageBase64 && !documentText) {
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
    : "";
  const effectiveQuestion = documentText
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

      const userContent: OAIMsg["content"] = imageBase64
        ? [
            { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
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
