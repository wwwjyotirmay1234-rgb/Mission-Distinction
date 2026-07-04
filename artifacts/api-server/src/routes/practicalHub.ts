import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ensureCompatibleFormat, speechToText } from "@workspace/integrations-openai-ai-server/audio";
import { ai as gemini } from "@workspace/integrations-gemini-ai";
import { db } from "@workspace/db";
import { vivaQuestionsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { CBME_CONTEXT } from "../lib/cbmeContext";

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

function isVivaSubject(value: unknown): value is VivaSubject {
  return typeof value === "string" && (VIVA_SUBJECTS as readonly string[]).includes(value);
}

async function fetchBankQuestions(subject: VivaSubject): Promise<string[]> {
  try {
    const rows = await db
      .select()
      .from(vivaQuestionsTable)
      .where(eq(vivaQuestionsTable.subject, subject))
      .orderBy(asc(vivaQuestionsTable.orderIndex));
    return rows.map((r) => r.questionText);
  } catch (err) {
    console.error("Practical Hub: failed to fetch question bank", err);
    return [];
  }
}

function buildExaminerPersona(subject: VivaSubject, bankQuestions: string[]): string {
  const bankBlock = bankQuestions.length
    ? `\nMANDATORY QUESTION LIST from the supervising professor for ${subject} — you MUST ask these, one at a time, in this order, before asking anything of your own. You may still add a brief natural follow-up probe on a listed question if the student's answer is incomplete, but do not skip ahead in the list until each is reasonably addressed:\n${bankQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\nOnce the entire list has been covered, you may ask 1-2 of your own fresh questions on ${subject} to round out the section before it ends.`
    : `\nNo fixed question list has been supplied for ${subject} — generate your own spot/case questions on ${subject} at NEET PG standard.`;

  return `You are Dr. Rao, a strict but fair MBBS practical/viva examiner conducting a real, spoken oral examination (viva voce / OSCE station). You are examining an Indian MBBS student on Subject: ${subject}, one section of a 3-section practical viva (Anatomy, Physiology, Biochemistry).

${CBME_CONTEXT}
${bankBlock}

Rules:
- Reference ONLY gold-standard textbooks (Gray's Anatomy, BD Chaurasia, Snell's, Ganong's, Guyton & Hall, Harper's, Robbins & Cotran, Harsh Mohan, KD Tripathi, Goodman & Gilman's, Ananthanarayan & Paniker, Harrison's, Davidson's, Bailey & Love's, Sabiston, Nelson, Ghai, Dutta's, Williams Obstetrics, Park's PSM) at NEET PG examination standard.
- Speak naturally, the way a real examiner speaks out loud in an exam hall — short, direct sentences. Do NOT use markdown, bullet points, asterisks, or headings; this is spoken audio, not text.
- Ask ONE question at a time. Never answer your own question. Never break character.
- When the student answers, briefly react like a real examiner would ("Hmm, not quite", "Good, correct", "Partially right, but...") in 1 sentence, then either probe deeper with a natural follow-up on the same topic, or move on to the next question. Keep total spoken response to 2-4 short sentences — real examiners don't lecture.
- Maintain a firm, professional, slightly intimidating exam-hall tone, but stay fair and encouraging when the student does well.
- If a "Panel note" from a co-examiner appears in your instructions, weave its suggested harder question in naturally as your own next question — never mention the co-examiner or that you received a note.
- If the student clearly says they want to stop or end the viva, wish them well briefly and end.
- After roughly 4-6 questions in this section (or once the mandatory list is exhausted plus 1-2 extra questions), tell the student this section is complete and they will now move to the next subject.`;
}

// Gemini panel member: generates ONE tougher/alternate cross-question to keep the exam rigorous.
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
              text: `${CBME_CONTEXT}\n\nYou are Dr. Mehta, a tough co-examiner on an MBBS ${subject} viva panel, sitting alongside the lead examiner. Based on the exam transcript so far, suggest ONE noticeably tougher or more clinically-applied follow-up/cross-question on ${subject} that would test deeper understanding than what has been asked. Return ONLY the question text, no preamble, no quotes.\n\nTranscript so far:\n${transcript.slice(-4000)}`,
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

async function openaiScoreOpinion(subject: VivaSubject, transcript: string): Promise<ScoreOpinion> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `You are an expert Indian medical educator scoring an MBBS viva voce transcript for Subject: ${subject}.\n\n${CBME_CONTEXT}\n\nReturn ONLY valid JSON: { "score": number (0-100), "strengths": string[] (2-4 short items), "improvements": string[] (2-4 short items), "verdict": string (one short encouraging sentence) }.`,
      },
      { role: "user", content: transcript },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }

  return {
    score: typeof parsed.score === "number" ? parsed.score : 0,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    verdict: typeof parsed.verdict === "string" ? parsed.verdict : "",
  };
}

// Gemini panel member: an independent second scoring opinion, cross-checking the primary examiner's score.
// Soft-fails (returns null) on any error so scoring is never blocked by the second AI.
async function geminiScoreOpinion(subject: VivaSubject, transcript: string): Promise<ScoreOpinion | null> {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are Dr. Mehta, an independent second examiner on an MBBS ${subject} viva panel, cross-checking the lead examiner's scoring. Score the student's performance yourself, independently, based on the transcript.\n\n${CBME_CONTEXT}\n\nReturn ONLY valid JSON (no markdown fences): { "score": number (0-100), "strengths": string[] (2-4 short items), "improvements": string[] (2-4 short items), "verdict": string (one short sentence) }.\n\nTranscript:\n${transcript}`,
            },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });
    const raw = (response.text ?? "{}").trim();
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
    console.error("Practical Hub: Gemini score opinion failed", err);
    return null;
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

// The 3 fixed sections of the practical viva, with an indicator of whether an admin question bank exists.
router.get("/viva/sections", authMiddleware, async (_req: Request, res: Response) => {
  try {
    const sections = await Promise.all(
      VIVA_SUBJECTS.map(async (subject) => ({
        subject,
        bankQuestionCount: (await fetchBankQuestions(subject)).length,
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
  if (!isVivaSubject(subject)) {
    res.status(400).json({ error: `subject must be one of ${VIVA_SUBJECTS.join(", ")}` });
    return;
  }

  sseHeaders(res);
  try {
    const bankQuestions = await fetchBankQuestions(subject);
    const persona = buildExaminerPersona(subject, bankQuestions);
    await streamExaminerAudioTurn(res, [
      { role: "system", content: persona },
      {
        role: "user",
        content: `Begin the ${subject} section of the viva${topic ? `, Topic: ${topic}` : ""}. Greet the student briefly like a real examiner (mention this is the ${subject} section), then ask your first spot/case question. Keep it short and spoken, 2-3 sentences total.`,
      },
    ]);
    sendEvent(res, { done: true, bankQuestionCount: bankQuestions.length });
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
  if (!isVivaSubject(subject) || !audioBase64) {
    res.status(400).json({ error: `subject (one of ${VIVA_SUBJECTS.join(", ")}) and audio required` });
    return;
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
    const userTranscript = (await speechToText(buffer, format)).trim();

    if (!userTranscript) {
      sendEvent(res, { type: "error", error: "Could not hear your answer clearly. Please try again." });
      res.end();
      return;
    }

    sendEvent(res, { type: "user_transcript", data: userTranscript });

    const bankQuestions = await fetchBankQuestions(subject);
    let persona = buildExaminerPersona(subject, bankQuestions) + `\nCurrent viva Subject: ${subject}${topic ? `, Topic: ${topic}` : ""}.`;

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

    const [openaiOpinion, geminiOpinion] = await Promise.all([
      openaiScoreOpinion(subject, transcript),
      geminiScoreOpinion(subject, transcript),
    ]);

    const finalScore = geminiOpinion
      ? Math.round((openaiOpinion.score + geminiOpinion.score) / 2)
      : openaiOpinion.score;

    const mergedStrengths = geminiOpinion
      ? Array.from(new Set([...openaiOpinion.strengths, ...geminiOpinion.strengths])).slice(0, 5)
      : openaiOpinion.strengths;
    const mergedImprovements = geminiOpinion
      ? Array.from(new Set([...openaiOpinion.improvements, ...geminiOpinion.improvements])).slice(0, 5)
      : openaiOpinion.improvements;

    res.json({
      subject,
      score: finalScore,
      strengths: mergedStrengths,
      improvements: mergedImprovements,
      verdict: openaiOpinion.verdict,
      panel: {
        openai: { examiner: "Dr. Rao", ...openaiOpinion },
        gemini: geminiOpinion ? { examiner: "Dr. Mehta", ...geminiOpinion } : null,
      },
    });
  } catch (err: any) {
    console.error("Practical Hub voice viva end error:", err);
    res.status(500).json({ error: err?.message || "Failed to summarize the viva." });
  }
});

export { router as practicalHubRouter, VIVA_SUBJECTS };
