import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { photoDoubtsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";
import { openai } from "@workspace/integrations-openai-ai-server";
import { awardXp } from "../lib/xp";
import multer from "multer";
import rateLimit from "express-rate-limit";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
    } else {
      cb(null, true);
    }
  },
});

const router = Router();

const solveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 500 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many photo doubt requests. Please wait." },
});

async function uploadToCloudinary(buffer: Buffer, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "mission-distinction/photo-doubts",
        resource_type: "image",
        quality: "auto",
        fetch_format: "auto",
      },
      (err, result) => {
        if (err || !result) reject(err ?? new Error("Cloudinary upload failed"));
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ─── POST /photo-doubt — upload image + get AI explanation ───────────────────
router.post("/", authMiddleware, solveLimiter, upload.single("image"), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const file = req.file;

    if (!file) { res.status(400).json({ error: "image file is required" }); return; }

    const question = String(req.body.question ?? "").slice(0, 500);
    const subject = String(req.body.subject ?? "").slice(0, 100);

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file.buffer, file.mimetype);

    // Call GPT-4o vision
    const systemPrompt = `You are an expert MBBS tutor for Indian medical students (1st-3rd year). 
A student has photographed a textbook question, diagram, or clinical image and needs a clear, accurate explanation.

Your response must be structured as JSON with these fields:
{
  "topic": "one-line topic name",
  "subject": "which MBBS subject (Anatomy/Physiology/Biochemistry/etc)",
  "explanation": "comprehensive explanation in 3-5 clear paragraphs. Start with what the image shows, then explain the underlying concept, then give clinical relevance",
  "keyPoints": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "memoryTip": "a short mnemonic or trick to remember this",
  "relatedTopics": ["related topic 1", "related topic 2"]
}

Be accurate to standard Indian MBBS textbooks (Gray's, Guyton, Harper's, Robbins, etc.). Use simple English.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
          ...(question
            ? [{ type: "text", text: `Student's question: ${question}` }]
            : [{ type: "text", text: "Please explain what is shown in this image." }]),
        ],
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages,
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) { res.status(500).json({ error: "AI explanation unavailable" }); return; }

    const parsed = JSON.parse(content);
    const aiExplanation = JSON.stringify(parsed);

    // Save to DB
    const [saved] = await db.insert(photoDoubtsTable).values({
      userId: user.id,
      imageUrl,
      question: question || null,
      aiExplanation,
      subject: parsed.subject ?? subject ?? null,
    }).returning();

    // Award XP (once per day max handled by awardXp internally — type acts as daily key)
    awardXp(user.id, 20, "photo_doubt_solved", "Used Photo Doubt Solver").catch(() => {});

    res.json({ id: saved.id, imageUrl, ...parsed });
  } catch (err: any) {
    console.error("photo-doubt error:", err);
    if (err.message?.includes("Only image")) {
      res.status(400).json({ error: "Only image files are allowed (JPG, PNG, HEIC, etc.)" });
      return;
    }
    res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

// ─── GET /photo-doubt/my-history — student's past doubts ─────────────────────
router.get("/my-history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const rows = await db
      .select()
      .from(photoDoubtsTable)
      .where(eq(photoDoubtsTable.userId, user.id))
      .orderBy(desc(photoDoubtsTable.createdAt))
      .limit(20);

    const parsed = rows.map(r => {
      try {
        return { ...r, aiExplanation: JSON.parse(r.aiExplanation) };
      } catch {
        return { ...r, aiExplanation: { explanation: r.aiExplanation } };
      }
    });

    res.json({ doubts: parsed });
  } catch (err) {
    console.error("photo-doubt history error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as photoDoubtRouter };
