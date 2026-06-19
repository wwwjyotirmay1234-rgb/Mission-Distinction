import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { db } from "@workspace/db";
import { doubtsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `You are an expert medical tutor for 1st Year MBBS students in India, specialising in Anatomy, Physiology, and Biochemistry.

Guidelines:
- Give clear, accurate, well-structured answers suitable for MBBS 1st year level
- Use bullet points and numbered lists where helpful
- Include relevant clinical correlations when appropriate
- Keep answers focused and concise (avoid unnecessary length)
- If a question is outside 1st year MBBS scope, still answer helpfully
- Always be encouraging and supportive to students`;

router.post("/:id/ai-answer", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid doubt ID" }); return; }

    const [doubt] = await db.select().from(doubtsTable).where(eq(doubtsTable.id, id)).limit(1);
    if (!doubt) { res.status(404).json({ error: "Doubt not found" }); return; }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: "gpt-5-mini",
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
