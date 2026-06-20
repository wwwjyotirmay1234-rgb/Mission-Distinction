import { Router, Request, Response, NextFunction } from "express";
import { adminMiddleware, authMiddleware } from "../middlewares/auth";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { Storage } from "@google-cloud/storage";

const REPLIT_SIDECAR = "http://127.0.0.1:1106";
const gcsClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => String((req as any).user?.id ?? req.ip),
  message: { error: "Too many avatar uploads. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// ─── Magic-byte type detection ────────────────────────────────────────────────
async function detectMime(buffer: Buffer): Promise<string | undefined> {
  try {
    const { fileTypeFromBuffer } = await import("file-type");
    const result = await fileTypeFromBuffer(buffer);
    return result?.mime;
  } catch {
    return undefined;
  }
}

const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_PDF_MIME = "application/pdf";
const ALLOWED_NOTE_MIMES = new Set([...ALLOWED_IMAGE_MIMES, ALLOWED_PDF_MIME]);

// ─── Multer configs (initial gating — magic bytes are the final check) ─────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIMES.has(file.mimetype) || file.mimetype === ALLOWED_PDF_MIME) cb(null, true);
    else cb(new Error("Invalid file type. Only PDF and images are allowed."));
  },
});

const noteFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_NOTE_MIMES.has(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Allowed: Photo (JPG/PNG/WebP), PDF."));
  },
});

const communityUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIMES.has(file.mimetype) || file.mimetype === ALLOWED_PDF_MIME) cb(null, true);
    else cb(new Error("Only images and PDFs are allowed."));
  },
});

function uploadToCloudinary(buffer: Buffer, options: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
router.post("/pdf", adminMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    const realMime = await detectMime(req.file.buffer);
    if (realMime !== ALLOWED_PDF_MIME) { res.status(400).json({ error: "Only PDF files are allowed" }); return; }
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "mission-distinction/pdfs",
      resource_type: "raw",
      public_id: `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
      use_filename: true,
      unique_filename: false,
    });
    res.json({ url: result.secure_url, fileName: result.public_id });
  } catch (err: any) {
    console.error("PDF upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

// ─── Book cover ───────────────────────────────────────────────────────────────
router.post("/book-cover", adminMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    const realMime = await detectMime(req.file.buffer);
    if (!realMime || !ALLOWED_IMAGE_MIMES.has(realMime)) { res.status(400).json({ error: "Only image files are allowed for book covers" }); return; }
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "mission-distinction/covers",
      resource_type: "image",
      transformation: [{ width: 400, height: 560, crop: "fill", quality: "auto", fetch_format: "auto" }],
    });
    res.json({ url: result.secure_url, fileName: result.public_id });
  } catch (err: any) {
    console.error("Cover upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

// ─── Image ────────────────────────────────────────────────────────────────────
router.post("/image", adminMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    const realMime = await detectMime(req.file.buffer);
    if (!realMime || !ALLOWED_IMAGE_MIMES.has(realMime)) { res.status(400).json({ error: "Only image files are allowed" }); return; }
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "mission-distinction/images",
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    res.json({ url: result.secure_url, fileName: result.public_id });
  } catch (err: any) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

// ─── Avatar serve (streams from GCS — no auth needed to view) ─────────────────
router.get("/avatar/:fileName", async (req: Request, res: Response) => {
  try {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).end(); return; }
    const bucket = gcsClient.bucket(bucketId);
    const fileRef = bucket.file(`avatars/${req.params.fileName}`);
    const [meta] = await fileRef.getMetadata();
    res.setHeader("Content-Type", meta.contentType as string);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    fileRef.createReadStream().pipe(res);
  } catch {
    res.status(404).end();
  }
});

// ─── Avatar upload (Replit Object Storage — GCS sidecar auth) ─────────────────
router.post("/avatar", authMiddleware, avatarLimiter, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    const realMime = await detectMime(req.file.buffer);
    if (!realMime || !ALLOWED_IMAGE_MIMES.has(realMime)) { res.status(400).json({ error: "Only JPG, PNG, WebP or GIF images are allowed" }); return; }
    const userId = (req as any).user?.id;
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Storage not configured" }); return; }
    const bucket = gcsClient.bucket(bucketId);
    const fileName = `avatar_${userId}_${Date.now()}.jpg`;
    const fileRef = bucket.file(`avatars/${fileName}`);
    await fileRef.save(req.file.buffer, { metadata: { contentType: realMime } });
    // Serve via our own proxy (GCS bucket has public access prevention)
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const host = req.get("x-forwarded-host") || req.get("host");
    const url = `${proto}://${host}/api/upload/avatar/${fileName}`;
    res.json({ url });
  } catch (err: any) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

// ─── Note file ────────────────────────────────────────────────────────────────
router.post("/note-file", adminMiddleware, noteFileUpload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    const realMime = await detectMime(req.file.buffer);
    if (!realMime || !ALLOWED_NOTE_MIMES.has(realMime)) { res.status(400).json({ error: "Unsupported file type" }); return; }
    const isImage = ALLOWED_IMAGE_MIMES.has(realMime);
    const fileType = isImage ? "image" : "pdf";
    let result;
    if (isImage) {
      result = await uploadToCloudinary(req.file.buffer, {
        folder: "mission-distinction/notes",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      });
    } else {
      result = await uploadToCloudinary(req.file.buffer, {
        folder: "mission-distinction/notes",
        resource_type: "raw",
        public_id: `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
        use_filename: true,
        unique_filename: false,
      });
    }
    res.json({ url: result.secure_url, fileType, fileName: result.public_id });
  } catch (err: any) {
    console.error("Note file upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

// ─── Community file ───────────────────────────────────────────────────────────
router.post("/community-file", authMiddleware, communityUpload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    const realMime = await detectMime(req.file.buffer);
    if (!realMime || (!ALLOWED_IMAGE_MIMES.has(realMime) && realMime !== ALLOWED_PDF_MIME)) {
      res.status(400).json({ error: "Only images and PDFs are allowed" }); return;
    }
    const isImage = ALLOWED_IMAGE_MIMES.has(realMime);
    let result;
    if (isImage) {
      result = await uploadToCloudinary(req.file.buffer, {
        folder: "mission-distinction/community",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto", width: 1200, crop: "limit" }],
      });
    } else {
      result = await uploadToCloudinary(req.file.buffer, {
        folder: "mission-distinction/community",
        resource_type: "raw",
        public_id: `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
        use_filename: true,
        unique_filename: false,
      });
    }
    res.json({ url: result.secure_url, fileType: isImage ? "image" : "pdf", fileName: req.file.originalname });
  } catch (err: any) {
    console.error("Community file upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

// ─── Quiz answer image (student-accessible) ───────────────────────────────────
router.post("/quiz-answer", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    const realMime = await detectMime(req.file.buffer);
    if (!realMime || !ALLOWED_IMAGE_MIMES.has(realMime)) {
      res.status(400).json({ error: "Only JPG, PNG, WebP or GIF images are allowed" }); return;
    }
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "mission-distinction/quiz-answers",
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto", width: 2000, crop: "limit" }],
    });
    res.json({ url: result.secure_url });
  } catch (err: any) {
    console.error("Quiz answer upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

// ─── Multer & general error handler ──────────────────────────────────────────
// Must have 4 params so Express recognises it as an error-handling middleware.
// Multer validation errors (file type / size) end up here instead of the
// try-catch inside each route handler because multer calls next(err) before
// the handler body runs.
router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "File is too large. Maximum size is 50 MB." });
    return;
  }
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err?.message) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Upload failed. Please try again." });
});

export default router;
