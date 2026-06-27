import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai, generateImageBuffer } from "@workspace/integrations-openai-ai-server";
import rateLimit from "express-rate-limit";

const router = Router();

function sanitizePromptInput(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/[\x00-\x1F\x7F]/g, " ").slice(0, maxLen);
  return trimmed || null;
}

function safeParams(obj: Record<string, string | number>): Record<string, string | number> {
  return JSON.parse(JSON.stringify(obj)) as Record<string, string | number>;
}

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: "Too many AI requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const SYSTEM_PROMPT = `You are an expert Indian medical educator and NEET PG question-setter.
Reference ONLY gold-standard textbooks:
• Anatomy: Gray's Anatomy (42nd Ed), BD Chaurasia's Human Anatomy, Snell's Clinical Anatomy
• Physiology: Ganong's Review (26th Ed), Guyton & Hall Medical Physiology (14th Ed)
• Biochemistry: Harper's Illustrated Biochemistry (32nd Ed), Lippincott's Illustrated Biochemistry
• Pathology: Robbins & Cotran (10th Ed), Harsh Mohan Textbook of Pathology
• Pharmacology: KD Tripathi Essentials (8th Ed), Goodman & Gilman's
• Microbiology: Ananthanarayan & Paniker (10th Ed), Murray's Medical Microbiology
• Medicine: Harrison's Principles (21st Ed), Davidson's Principles & Practice
• Surgery: Bailey & Love's (28th Ed), Sabiston Textbook of Surgery
• Pediatrics: Nelson Textbook of Pediatrics, Ghai Essential Pediatrics
• Obstetrics & Gynecology: Dutta's Obstetrics & Gynecology, Williams Obstetrics
• Community Medicine: Park's Textbook of Preventive and Social Medicine (26th Ed)
All content must be factually accurate, evidence-based, and at NEET PG examination standard.
Return ONLY valid JSON, no markdown, no preamble.`;

function getDifficultyInstruction(difficulty: string): string {
  if (difficulty === "foundation") {
    return "Difficulty: 1st–2nd Year MBBS Foundation level. Test understanding of core mechanisms and concepts — not just memorised facts. Questions should require reasoning, not mere recall.";
  }
  if (difficulty === "clinical") {
    return "Difficulty: Final Year MBBS / Clinical level. Integrate basic sciences with clinical presentations. Use case-based scenarios testing applied reasoning and clinical decision-making.";
  }
  return "Difficulty: NEET PG / Postgraduate Entrance level. Questions must be at peak difficulty: tricky single-best-answer format, plausible distractors, test mechanistic and applied knowledge. Every distractor must be clinically plausible. Include recent advances and guideline-based content.";
}

// Generate MCQs
router.post("/mcq", authMiddleware, aiLimiter, async (req: Request, res: Response) => {
  try {
    const { count = 5, difficulty = "neet-pg" } = req.body;
    const subject = sanitizePromptInput(req.body.subject, 100);
    const topic = sanitizePromptInput(req.body.topic, 200);
    if (!subject || !topic) { res.status(400).json({ error: "subject and topic required" }); return; }
    const n = Math.min(Math.max(parseInt(count) || 5, 1), 10);

    const diffInstr = getDifficultyInstruction(difficulty);
    const p = safeParams({ subject, topic, n });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Subject: ${p.subject}
Topic: ${p.topic}
${diffInstr}

Generate ${p.n} high-quality MCQ questions. Each must:
- Be a single-best-answer type (not multiple correct)
- Have 4 options (A, B, C, D) with plausible distractors
- Include a detailed explanation citing the gold-standard textbook concept
- For NEET PG level: use clinical vignettes or mechanism-based scenarios
- Avoid trivially easy or overly obvious questions

Return valid JSON array only (no markdown):
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A",
    "explanation": "...(cite relevant textbook concept and why distractors are wrong)"
  }
]`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "[]";
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    if (jsonStart === -1 || jsonEnd === -1) { res.status(500).json({ error: "AI returned invalid format" }); return; }
    const mcqs = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    res.json(mcqs);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to generate MCQs" });
  }
});

const SUMMARISE_SYSTEM_PROMPT = `You are an expert Indian medical educator helping MBBS/NEET PG students revise.
Reference gold-standard textbooks (Gray's Anatomy, Ganong's Physiology, Harper's Biochemistry, Robbins Pathology, KD Tripathi Pharmacology, etc.).
All content must be factually accurate and at NEET PG examination standard.
Respond ONLY in clean Markdown. Rules:
- Use ## for section headings
- Use - for bullet lists (never use * for bullets)
- Use | tables | like | this | for structured data (key terms, comparisons)
- Use **bold** only for the most critical facts or terms
- Never output raw JSON, code blocks, or asterisk-only formatting
- Keep language concise and exam-focused`;

// Summarise text / notes
router.post("/summarise", authMiddleware, aiLimiter, async (req: Request, res: Response) => {
  try {
    const text = sanitizePromptInput(req.body.text, 8000);
    const subject = sanitizePromptInput(req.body.subject, 100);
    if (!text) { res.status(400).json({ error: "text required" }); return; }

    const p = safeParams({ text, subject: subject ?? "" });
    const subjectPrefix = p.subject ? `Subject: ${p.subject}\n` : "";
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: SUMMARISE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `${subjectPrefix}Summarise the following notes for MBBS/NEET PG revision using this exact structure:

## Key Points
(8-10 concise bullet points of the most exam-relevant facts)

## High-Yield Questions
(3 NEET PG style Q&A pairs, each as: **Q:** … followed by **A:** …)

## Key Terms

| Term | Definition / Clinical Significance |
|------|--------------------------------------|
(5-8 rows, one term per row)

Notes to summarise:
${p.text}`,
        },
      ],
    });

    res.json({ summary: completion.choices[0]?.message?.content ?? "" });
  } catch {
    res.status(500).json({ error: "Failed to summarise" });
  }
});

// Generate a mnemonic
router.post("/mnemonic", authMiddleware, aiLimiter, async (req: Request, res: Response) => {
  try {
    const subject = sanitizePromptInput(req.body.subject, 100);
    const topic = sanitizePromptInput(req.body.topic, 200);
    if (!subject || !topic) { res.status(400).json({ error: "subject and topic required" }); return; }

    const p = safeParams({ subject, topic });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Subject: ${p.subject}
Topic: ${p.topic}

Create a memorable mnemonic for MBBS/NEET PG students.
Prefer mnemonics that are commonly used in Indian medical colleges or NEET PG resources.
Return JSON only:
{
  "mnemonic": "the mnemonic phrase (acronym, rhyme or story)",
  "description": "Detailed explanation of what each letter/word represents with clinical context"
}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) { res.status(500).json({ error: "AI returned invalid format" }); return; }
    const result = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to generate mnemonic" });
  }
});

// Generate flashcard set
router.post("/flashcards", authMiddleware, aiLimiter, async (req: Request, res: Response) => {
  try {
    const { count = 8, difficulty = "neet-pg" } = req.body;
    const subject = sanitizePromptInput(req.body.subject, 100);
    const topic = sanitizePromptInput(req.body.topic, 200);
    if (!subject || !topic) { res.status(400).json({ error: "subject and topic required" }); return; }
    const n = Math.min(Math.max(parseInt(count) || 8, 3), 15);

    const diffInstr = getDifficultyInstruction(difficulty);
    const p = safeParams({ subject, topic, n });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Subject: ${p.subject}
Topic: ${p.topic}
${diffInstr}

Generate ${p.n} flashcards for NEET PG spaced repetition revision.
Front: a focused question or term that tests applied knowledge — not just "define X".
Back: a precise, high-yield answer with the key clinical or mechanistic insight.
Return JSON array only:
[
  { "front": "Mechanism by which ACE inhibitors reduce proteinuria in CKD", "back": "Efferent arteriole dilation → decreased intraglomerular pressure → reduced filtration of protein" }
]`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "[]";
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    if (jsonStart === -1 || jsonEnd === -1) { res.status(500).json({ error: "AI returned invalid format" }); return; }
    const cards = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    res.json({ cards });
  } catch {
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

// ── Generate a textbook-quality SVG anatomical diagram via gpt-5.4 ────────────

const DIAGRAM_SVG_SYSTEM_PROMPT = `You are a precision medical illustration AI for MBBS university exams. Generate SVG diagrams — either flowcharts or anatomical diagrams depending on the request.

CRITICAL: Do NOT include width or height attributes on <svg>. Use ONLY viewBox="0 0 820 680".
Always start with: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 680">
Always add: <rect width="820" height="680" fill="white"/>

══════════════════════════════════════════════════════
STEP 1 — DETECT TYPE from the user's request:
  → If request includes "flowchart", "flow chart", "flow diagram", "steps of", "cascade", "sequence" → TYPE A
  → Otherwise → TYPE B

══════════════════════════════════════════════════════
TYPE A — FLOWCHART:
  Define arrowhead in <defs>:
    <marker id="arr" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#5b21b6"/>
    </marker>

  Layout — vertical chain, all boxes centered at x=410:
  - Bold title: x="410" y="35" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e1b4b"
  - Each step box: <rect x="170" width="480" height="48" rx="8" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>
  - Text inside each box: x="410" text-anchor="middle" dominant-baseline="middle" font-size="12.5" fill="#1e1b4b"
    Place text at y = box_y + 24 (vertical center of box)
  - NEVER place text outside its box
  - Connecting arrow: <line x1="410" y1="[bottom of box]" x2="410" y2="[top of next box]" stroke="#7c3aed" stroke-width="1.5" marker-end="url(#arr)"/>
  - First box top at y=60. Gap between boxes: 18px. Box height 48px. Step pitch = 66px.
  - If steps > 9: reduce box height to 40px, gap to 12px, pitch = 52px
  - Italic caption at y=660: x="410" text-anchor="middle" font-size="10" fill="#666"

TYPE B — ANATOMICAL DIAGRAM (BD Chaurasia style):
  Drawing zone: x=210 to x=610, y=55 to y=615. Draw ALL anatomy strictly inside this zone.
  Left label zone: x=10 to x=195 (text-anchor="end")
  Right label zone: x=625 to x=810 (text-anchor="start")

  Rules:
  - Black ink outlines: stroke="#1a1a1a" stroke-width="1.8" (major), "0.8" (fine detail)
  - Soft tissue fill: #f0ede8. Key structures (max 4): fill="#e8c840" fill-opacity="0.75"
  - Leader lines: stroke="#aaa" stroke-width="0.6" — horizontal line from label to structure boundary
  - Labels: font-family="Arial,sans-serif" font-size="11" fill="#111"
  - Labels MUST stay in the label zones — NEVER inside the drawing zone
  - Labels must be spaced minimum 17px apart vertically on each side to prevent overlap
  - Bold title: x="410" y="30" text-anchor="middle" font-size="14" font-weight="bold"
  - Italic caption: x="410" y="668" text-anchor="middle" font-size="10" fill="#555" font-style="italic"
  - Two views side-by-side if exam-relevant (ventral+dorsal etc.)
  - Fine hatching for cut surfaces; wavy lines for nerves; branching for vessels
  - Include ALL named structures tested in MBBS university exams

══════════════════════════════════════════════════════
Return ONLY valid SVG code: start <svg … end </svg>. No markdown, no fences, no explanation.`;

router.post("/generate-diagram-svg", authMiddleware, aiLimiter, async (req: Request, res: Response) => {
  try {
    const description = sanitizePromptInput(req.body.description, 800);
    if (!description) { res.status(400).json({ error: "description required (max 800 chars)" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: DIAGRAM_SVG_SYSTEM_PROMPT },
        { role: "user", content: `Generate an accurate anatomical SVG diagram for a university MBBS exam: ${description}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const start = raw.indexOf("<svg");
    const end = raw.lastIndexOf("</svg>") + 6;
    if (start === -1 || end < 6) { res.status(500).json({ error: "AI did not return valid SVG. Please retry." }); return; }
    const svg = raw.slice(start, end);
    res.json({ svg });
  } catch (err: any) {
    console.error("SVG diagram generation error:", err);
    res.status(500).json({ error: err?.message || "Diagram generation failed. Please try again." });
  }
});

// ── Generate a medical diagram image via gpt-image-1 ──────────────────────────
router.post("/generate-diagram", authMiddleware, aiLimiter, async (req: Request, res: Response) => {
  try {
    const description = sanitizePromptInput(req.body.description, 800);
    if (!description) { res.status(400).json({ error: "description required (max 800 chars)" }); return; }

    const imagePrompt = `Medical textbook illustration, clean white background, black ink line art style. Accurate anatomical/physiological diagram: ${description}. Include clear labels with leader lines for every structure. Style: professional medical textbook, similar to Gray's Anatomy illustrations. High detail, exam-quality diagram, no color fills except light grey for depth, no decorative borders or text boxes outside the diagram.`;

    const buffer = await generateImageBuffer(imagePrompt, "1024x1024");
    res.json({ b64_json: buffer.toString("base64") });
  } catch (err: any) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: err?.message || "Image generation failed. Please try again." });
  }
});

export { router as aiToolsRouter };
