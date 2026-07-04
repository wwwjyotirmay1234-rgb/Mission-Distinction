import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ensureCompatibleFormat, speechToText } from "@workspace/integrations-openai-ai-server/audio";
import rateLimit from "express-rate-limit";

const router = Router();

const voiceLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: { error: "Too many voice viva requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const EXAMINER_PERSONA = `You are Dr. Rao, a strict but fair MBBS practical/viva examiner conducting a real, spoken oral examination (viva voce / OSCE station). You are examining an Indian MBBS student.

Rules:
- Reference ONLY gold-standard textbooks (Gray's Anatomy, BD Chaurasia, Snell's, Ganong's, Guyton & Hall, Harper's, Robbins & Cotran, Harsh Mohan, KD Tripathi, Goodman & Gilman's, Ananthanarayan & Paniker, Harrison's, Davidson's, Bailey & Love's, Sabiston, Nelson, Ghai, Dutta's, Williams Obstetrics, Park's PSM) at NEET PG examination standard.
- Speak naturally, the way a real examiner speaks out loud in an exam hall — short, direct sentences. Do NOT use markdown, bullet points, asterisks, or headings; this is spoken audio, not text.
- Ask ONE question at a time. Never answer your own question. Never break character.
- When the student answers, briefly react like a real examiner would ("Hmm, not quite", "Good, correct", "Partially right, but...") in 1 sentence, then either probe deeper with a natural follow-up on the same topic, or move on to a fresh spot/case question. Keep total spoken response to 2-4 short sentences — real examiners don't lecture.
- Maintain a firm, professional, slightly intimidating exam-hall tone, but stay fair and encouraging when the student does well.
- If the student clearly says they want to stop or end the viva, wish them well briefly and end.`;

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

// Begin a voice viva: examiner greets the student and asks the opening question, as speech.
router.post("/viva/start-voice", authMiddleware, voiceLimiter, async (req: Request, res: Response) => {
  const subject = sanitizeText(req.body.subject, 100);
  const topic = sanitizeText(req.body.topic, 200);
  if (!subject) { res.status(400).json({ error: "subject required" }); return; }

  sseHeaders(res);
  try {
    await streamExaminerAudioTurn(res, [
      { role: "system", content: EXAMINER_PERSONA },
      {
        role: "user",
        content: `Begin the viva for Subject: ${subject}${topic ? `, Topic: ${topic}` : ""}. Greet the student briefly like a real examiner, then ask your first spot/case question. Keep it short and spoken, 2-3 sentences total.`,
      },
    ]);
    sendEvent(res, { done: true });
  } catch (err: any) {
    console.error("Practical Hub voice viva start error:", err);
    sendEvent(res, { type: "error", error: err?.message || "Failed to start the viva." });
  } finally {
    res.end();
  }
});

// Continue a voice viva: transcribe the student's spoken answer, then stream the examiner's next spoken turn.
router.post("/viva/turn-voice", authMiddleware, voiceLimiter, async (req: Request, res: Response) => {
  const subject = sanitizeText(req.body.subject, 100);
  const topic = sanitizeText(req.body.topic, 200);
  const history = sanitizeHistory(req.body.history);
  const audioBase64 = typeof req.body.audio === "string" ? req.body.audio : null;
  if (!subject || !audioBase64) { res.status(400).json({ error: "subject and audio required" }); return; }

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

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content: EXAMINER_PERSONA + `\nCurrent viva Subject: ${subject}${topic ? `, Topic: ${topic}` : ""}.`,
      },
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

// End a voice viva: produce a short performance summary/score.
router.post("/viva/end", authMiddleware, voiceLimiter, async (req: Request, res: Response) => {
  try {
    const subject = sanitizeText(req.body.subject, 100);
    const history = sanitizeHistory(req.body.history);
    if (!subject || history.length === 0) {
      res.status(400).json({ error: "subject and history required" });
      return;
    }

    const transcript = history
      .map((h) => `${h.role === "assistant" ? "Examiner" : "Student"}: ${h.content}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `You are an expert Indian medical educator scoring an MBBS viva voce transcript for Subject: ${subject}. Return ONLY valid JSON: { "score": number (0-100), "strengths": string[] (2-4 short items), "improvements": string[] (2-4 short items), "verdict": string (one short encouraging sentence) }.`,
        },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    res.json({
      score: typeof parsed.score === "number" ? parsed.score : 0,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      verdict: typeof parsed.verdict === "string" ? parsed.verdict : "",
    });
  } catch (err: any) {
    console.error("Practical Hub voice viva end error:", err);
    res.status(500).json({ error: err?.message || "Failed to summarize the viva." });
  }
});

export { router as practicalHubRouter };
