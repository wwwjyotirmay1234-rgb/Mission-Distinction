import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import rateLimit from "express-rate-limit";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: { error: "Too many anatomy AI requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /anatomy/explain
 * SSE streaming endpoint — explains any anatomy structure or label
 * using BD Chaurasia and Gray's Anatomy as primary references.
 *
 * Body: { structureName: string; systemName: string; labelName?: string }
 */
router.post(
  "/explain",
  authMiddleware,
  aiLimiter,
  async (req: Request, res: Response) => {
    const { structureName, systemName, labelName } = req.body as {
      structureName?: string;
      systemName?: string;
      labelName?: string;
    };

    if (!structureName || !systemName) {
      res.status(400).json({ error: "structureName and systemName are required" });
      return;
    }

    const sName = String(structureName).slice(0, 120);
    const sysName = String(systemName).slice(0, 80);
    const lName = labelName ? String(labelName).slice(0, 120) : null;

    const target = lName ? `${lName}` : sName;
    const context = lName
      ? `The 1st Year MBBS student has tapped on the "${lName}" label on a 3D anatomical model of the ${sName} (${sysName}).`
      : `The 1st Year MBBS student is studying the ${sName} (${sysName}).`;

    const systemPrompt = `You are an expert anatomy professor for 1st Year MBBS students in India. Your primary references are:
- BD Chaurasia's Human Anatomy (Volumes 1–4) — the gold standard for Indian MBBS
- Gray's Anatomy (42nd ed.) — for detailed descriptions and clinical notes
- Snell's Clinical Anatomy — for applied anatomy
- Last's Anatomy — for surgical anatomy

When explaining any structure, always:
1. Draw facts from BD Chaurasia and Gray's Anatomy specifically
2. Use clear bold section headers (e.g. **Description:**, **Relations:**)
3. Prioritise high-yield facts tested in MBBS exams and university practicals
4. Include clinical correlations / applied anatomy
5. Add relevant mnemonics where they help memory
6. Keep the tone educational, clear, and concise`;

    const userPrompt = `${context}

Explain **${target}** for a 1st Year MBBS student with the following structured sections:

**Description (BD Chaurasia / Gray's):**
Key anatomical description — shape, size, position, surfaces, borders, features.

**Important Relations:**
Immediate anatomical neighbours — what lies above, below, anterior, posterior, medial, lateral.

**Blood Supply:**
Arterial supply, venous drainage.

**Nerve Supply:**
Motor and/or sensory innervation.

**Clinical / Applied Anatomy:**
High-yield clinical points — fractures, injury patterns, surgical importance, pathology.

**Exam High-Yield Points:**
3–5 bullet points most likely to be asked in MBBS written/viva exams.

**Mnemonic (if applicable):**
A useful mnemonic to remember key facts.

Keep each section focused and exam-relevant. Reference BD Chaurasia or Gray's by name where relevant.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 1800,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (e: any) {
      res.write(
        `data: ${JSON.stringify({ error: "AI service unavailable. Please try again shortly." })}\n\n`,
      );
      res.end();
    }
  },
);

export { router as anatomyAIRouter };
