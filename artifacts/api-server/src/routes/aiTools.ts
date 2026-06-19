import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import rateLimit from "express-rate-limit";

const router = Router();

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
    const { subject, topic, count = 5 } = req.body;
    if (!subject || !topic?.trim()) { res.status(400).json({ error: "subject and topic required" }); return; }
    const n = Math.min(Math.max(parseInt(count) || 5, 1), 10);

    const prompt = `Generate ${n} high-quality MCQ questions for a 1st Year MBBS student studying ${subject} — specifically the topic: "${topic}".

Format your response as valid JSON array only (no markdown, no explanation):
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A",
    "explanation": "..."
  }
]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert MBBS medical educator. Generate accurate, clinically relevant MCQs. Return only valid JSON." },
        { role: "user", content: prompt },
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
    const { text, subject } = req.body;
    if (!text?.trim()) { res.status(400).json({ error: "text required" }); return; }
    if (text.trim().length > 8000) { res.status(400).json({ error: "Text too long (max 8000 characters)" }); return; }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert MBBS medical tutor who creates concise, exam-focused summaries." },
        { role: "user", content: `Summarise the following ${subject ? subject + " " : ""}notes for a 1st Year MBBS student. Provide:
1. A concise bullet-point summary of key points (max 10 bullets)
2. 3 important exam questions with brief answers
3. Key terms to remember

Notes:
${text.trim()}` },
      ],
      temperature: 0.5,
    });

    res.json({ summary: completion.choices[0]?.message?.content ?? "" });
  } catch {
    res.status(500).json({ error: "Failed to summarise" });
  }
});

export { router as aiToolsRouter };
