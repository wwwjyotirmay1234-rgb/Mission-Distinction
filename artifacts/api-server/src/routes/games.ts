import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import rateLimit from "express-rate-limit";

const router = Router();

const gameLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 500 : 40,
  message: { error: "Too many game requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry"];

function parseJsonObj(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  return JSON.parse(text.slice(start, end + 1));
}

function parseJsonArr(text: string): any[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found");
  return JSON.parse(text.slice(start, end + 1));
}

// ── Word Scramble ─────────────────────────────────────────────────────────────
router.post("/word-scramble", authMiddleware, gameLimiter, async (req: Request, res: Response) => {
  try {
    const { subject = "Anatomy" } = req.body;
    if (!SUBJECTS.includes(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 256,
      messages: [
        { role: "system", content: "You are a medical education expert for 1st Year MBBS. Return only valid JSON, no markdown." },
        { role: "user", content: `Generate 1 word scramble challenge for 1st Year MBBS ${subject}.
Pick an important single medical term (4-10 letters, no hyphens or spaces, UPPERCASE).
Return JSON only:
{
  "word": "FEMUR",
  "definition": "The longest bone in the human body, located in the thigh",
  "hint": "A lower limb bone"
}` },
      ],
    });

    const data = parseJsonObj(completion.choices[0]?.message?.content ?? "{}");
    const word = ((data.word as string) || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (!word) { res.status(500).json({ error: "AI returned invalid word" }); return; }

    const letters = word.split("");
    let scrambled = [...letters];
    let attempts = 0;
    do {
      for (let i = scrambled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
      }
      attempts++;
    } while (scrambled.join("") === word && attempts < 30);

    res.json({ word, scrambled: scrambled.join(""), definition: data.definition ?? "", hint: data.hint ?? "", subject });
  } catch {
    res.status(500).json({ error: "Failed to generate word scramble" });
  }
});

// ── Memory Match ──────────────────────────────────────────────────────────────
router.post("/memory-match", authMiddleware, gameLimiter, async (req: Request, res: Response) => {
  try {
    const { subject = "Anatomy" } = req.body;
    if (!SUBJECTS.includes(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 800,
      messages: [
        { role: "system", content: "You are a medical education expert for 1st Year MBBS. Return only valid JSON, no markdown." },
        { role: "user", content: `Generate 8 term-definition pairs for a 1st Year MBBS memory match game on ${subject}.
Definitions must be concise (max 8 words). Use important, exam-relevant terms.
Return JSON array only:
[
  { "term": "Mitral valve", "definition": "Left AV valve with two leaflets" }
]` },
      ],
    });

    const pairs = parseJsonArr(completion.choices[0]?.message?.content ?? "[]");
    res.json({ pairs: pairs.slice(0, 8), subject });
  } catch {
    res.status(500).json({ error: "Failed to generate memory match" });
  }
});

// ── Diagnosis Challenge ────────────────────────────────────────────────────────
router.post("/diagnosis", authMiddleware, gameLimiter, async (req: Request, res: Response) => {
  try {
    const { subject = "Physiology" } = req.body;
    if (!SUBJECTS.includes(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 600,
      messages: [
        { role: "system", content: "You are a medical education expert for 1st Year MBBS. Return only valid JSON, no markdown." },
        { role: "user", content: `Generate a clinical/conceptual challenge for a 1st Year MBBS student studying ${subject}.
It can be a clinical case, lab value interpretation, or conceptual scenario relevant to ${subject}.
Return JSON only:
{
  "scenario": "Clinical/conceptual scenario description (2-3 sentences)",
  "question": "The specific question to answer",
  "options": ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
  "answer": "A",
  "explanation": "Why this answer is correct and why others are wrong (2-3 sentences)"
}` },
      ],
    });

    const data = parseJsonObj(completion.choices[0]?.message?.content ?? "{}");
    res.json({ ...data, subject });
  } catch {
    res.status(500).json({ error: "Failed to generate diagnosis challenge" });
  }
});

// ── Spelling Bee ──────────────────────────────────────────────────────────────
router.post("/spelling-bee", authMiddleware, gameLimiter, async (req: Request, res: Response) => {
  try {
    const { subject = "Anatomy" } = req.body;
    if (!SUBJECTS.includes(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 800,
      messages: [
        { role: "system", content: "You are a medical education expert for 1st Year MBBS. Return only valid JSON, no markdown." },
        { role: "user", content: `Generate 6 medical spelling bee words for 1st Year MBBS ${subject}.
Choose terms that are commonly misspelled or tricky. Word must be a single medical term (UPPERCASE).
Return JSON array only:
[
  {
    "word": "PERISTALSIS",
    "phonetic": "per-i-STAL-sis",
    "definition": "Wave-like muscle contractions that move food through the digestive tract",
    "hint": "A digestive movement pattern"
  }
]` },
      ],
    });

    const words = parseJsonArr(completion.choices[0]?.message?.content ?? "[]");
    res.json({ words: words.slice(0, 6), subject });
  } catch {
    res.status(500).json({ error: "Failed to generate spelling bee" });
  }
});

// ── Crossword ─────────────────────────────────────────────────────────────────
router.post("/crossword", authMiddleware, gameLimiter, async (req: Request, res: Response) => {
  try {
    const { subject = "Anatomy" } = req.body;
    if (!SUBJECTS.includes(subject)) { res.status(400).json({ error: "Invalid subject" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 1500,
      messages: [
        { role: "system", content: "You are a medical crossword puzzle designer for 1st Year MBBS. Return only valid JSON." },
        { role: "user", content: `Design a medical crossword for 1st Year MBBS ${subject} on a 10×10 grid (rows/cols 0-9).
Include 6-7 interlocking words. Rules:
- All words: UPPERCASE, single words, letters A-Z only
- across: word goes left→right starting at (row, col)
- down: word goes top→bottom starting at (row, col)
- Intersections MUST share the exact same letter at that cell
- word length + start position must stay within 0-9
- Every word must intersect with at least one other word

Return JSON only:
{
  "size": 10,
  "words": [
    { "number": 1, "word": "FEMUR", "clue": "Longest bone in the body", "direction": "across", "row": 0, "col": 0 },
    { "number": 2, "word": "FIBULA", "clue": "Lateral leg bone", "direction": "down", "row": 0, "col": 2 }
  ]
}
Note: In the example above, FEMUR[col=2]='M' and FIBULA[row=0]='F' — these don't match, so fix intersections before responding.` },
      ],
    });

    const data = parseJsonObj(completion.choices[0]?.message?.content ?? "{}");
    res.json({ size: data.size ?? 10, words: data.words ?? [], subject });
  } catch {
    res.status(500).json({ error: "Failed to generate crossword" });
  }
});

export { router as gamesRouter };
