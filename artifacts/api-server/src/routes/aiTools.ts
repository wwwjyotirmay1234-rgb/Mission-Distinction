import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
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
      temperature: 0.5,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${subjectPrefix}Summarise the following notes for MBBS/NEET PG revision. Provide:
1. A concise bullet-point summary of key exam-relevant points (max 10 bullets)
2. 3 high-yield NEET PG type questions with brief answers
3. Key terms and their clinical significance

Notes:
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

export { router as aiToolsRouter };
