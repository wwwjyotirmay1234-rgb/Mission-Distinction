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

// Generate MCQs
router.post("/mcq", authMiddleware, aiLimiter, async (req: Request, res: Response) => {
  try {
    const { count = 5 } = req.body;
    const subject = sanitizePromptInput(req.body.subject, 100);
    const topic = sanitizePromptInput(req.body.topic, 200);
    if (!subject || !topic) { res.status(400).json({ error: "subject and topic required" }); return; }
    const n = Math.min(Math.max(parseInt(count) || 5, 1), 10);

    const p = safeParams({ subject, topic, n });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert MBBS medical educator. Generate accurate, clinically relevant MCQs. Return only valid JSON." },
        { role: "user", content: "Subject: " + p.subject },
        { role: "user", content: "Topic: " + p.topic },
        { role: "user", content: "Generate " + p.n + " high-quality MCQ questions for a 1st Year MBBS student. Format response as valid JSON array only (no markdown):\n[\n  {\n    \"question\": \"...\",\n    \"options\": [\"A. ...\", \"B. ...\", \"C. ...\", \"D. ...\"],\n    \"answer\": \"A\",\n    \"explanation\": \"...\"\n  }\n]" },
      ],
      temperature: 0.7,
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
    const subjectPrefix = p.subject ? "Subject: " + p.subject + "\n" : "";
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert MBBS medical tutor who creates concise, exam-focused summaries." },
        { role: "user", content: subjectPrefix + "Summarise the following notes for a 1st Year MBBS student. Provide:\n1. A concise bullet-point summary of key points (max 10 bullets)\n2. 3 important exam questions with brief answers\n3. Key terms to remember\n\nNotes:\n" + p.text },
      ],
      temperature: 0.5,
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
      messages: [
        { role: "system", content: "You are an expert MBBS medical educator who creates memorable mnemonics. Be creative, accurate, and clinically relevant. Return only valid JSON." },
        { role: "user", content: "Subject: " + p.subject },
        { role: "user", content: "Topic: " + p.topic },
        { role: "user", content: "Create a mnemonic for a 1st Year MBBS student. Return JSON only:\n{\n  \"mnemonic\": \"the mnemonic phrase (e.g. acronym or rhyme)\",\n  \"description\": \"explanation of what each letter/word represents\"\n}" },
      ],
      temperature: 0.8,
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
    const { count = 8 } = req.body;
    const subject = sanitizePromptInput(req.body.subject, 100);
    const topic = sanitizePromptInput(req.body.topic, 200);
    if (!subject || !topic) { res.status(400).json({ error: "subject and topic required" }); return; }
    const n = Math.min(Math.max(parseInt(count) || 8, 3), 15);

    const p = safeParams({ subject, topic, n });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert MBBS medical educator. Generate high-quality flashcards for spaced repetition. Return only valid JSON." },
        { role: "user", content: "Subject: " + p.subject },
        { role: "user", content: "Topic: " + p.topic },
        { role: "user", content: "Generate " + p.n + " flashcards for a 1st Year MBBS student. Return JSON array only:\n[\n  { \"front\": \"question or term\", \"back\": \"answer or definition\" }\n]" },
      ],
      temperature: 0.6,
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
