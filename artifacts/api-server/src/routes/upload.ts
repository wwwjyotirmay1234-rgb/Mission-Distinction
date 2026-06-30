import { Router, Request, Response, NextFunction } from "express";
import { adminMiddleware, authMiddleware, pdfAuthMiddleware } from "../middlewares/auth";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { gcsClient } from "../lib/gcs";

const REPLIT_SIDECAR = "http://127.0.0.1:1106";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

// Verify credentials at startup
cloudinary.api.ping()
  .then(() => console.log("[Cloudinary] ✓ Credentials verified — uploads ready."))
  .catch((e: any) => console.error("[Cloudinary] ✗ Credential check failed:", e?.message ?? e));

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

// ─── PDF: request a presigned PUT URL so the browser uploads directly to GCS ──
// This bypasses the Replit proxy body-size limit — files go browser → GCS directly.
async function signPdfUploadURL(bucketId: string, fileName: string): Promise<string> {
  const body = {
    bucket_name: bucketId,
    object_name: `pdfs/${fileName}`,
    method: "PUT",
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
  const resp = await fetch(`${REPLIT_SIDECAR}/object-storage/signed-object-url`, { // nosemgrep: react-insecure-request
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) throw new Error(`Sidecar returned ${resp.status}`);
  const { signed_url } = await resp.json() as { signed_url: string };
  return signed_url;
}

router.post("/submission/request-upload-url", authMiddleware, async (req: Request, res: Response) => {
  try {
    const rawName = String(req.body?.fileName ?? "file.pdf");
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Storage not configured" }); return; }
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}_${safeName}`;
    const signedUrl = await signPdfUploadURL(bucketId, fileName);
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const host = req.get("x-forwarded-host") || req.get("host");
    const serveUrl = `${proto}://${host}/api/upload/pdf/serve/${fileName}`;
    res.json({ signedUrl, serveUrl, fileName });
  } catch (err: any) {
    console.error("Submission presign error:", err);
    res.status(500).json({ error: "Failed to generate upload URL. Please try again." });
  }
});

router.post("/pdf/request-upload-url", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const rawName = String(req.body?.fileName ?? "file.pdf");
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Storage not configured" }); return; }
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}_${safeName}`;
    const signedUrl = await signPdfUploadURL(bucketId, fileName);
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const host = req.get("x-forwarded-host") || req.get("host");
    const serveUrl = `${proto}://${host}/api/upload/pdf/serve/${fileName}`;
    res.json({ signedUrl, serveUrl, fileName });
  } catch (err: any) {
    console.error("PDF presign error:", err);
    res.status(500).json({ error: "Failed to generate upload URL. Please try again." });
  }
});

// ─── PDF serve (streams from GCS — any authenticated user can view) ───────────
router.get("/pdf/serve/:fileName", pdfAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).end(); return; }
    const bucket = gcsClient.bucket(bucketId);
    const fileRef = bucket.file(`pdfs/${req.params.fileName}`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${req.params.fileName}"`);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    fileRef.createReadStream().pipe(res);
  } catch {
    res.status(404).end();
  }
});

// ─── PDF upload (Replit Object Storage / GCS — up to 50 MB) ───────────────────
router.post("/pdf", adminMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    const realMime = await detectMime(req.file.buffer);
    if (realMime !== ALLOWED_PDF_MIME) { res.status(400).json({ error: "Only PDF files are allowed" }); return; }
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) { res.status(500).json({ error: "Storage not configured" }); return; }
    const bucket = gcsClient.bucket(bucketId);
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}_${safeName}`;
    const fileRef = bucket.file(`pdfs/${fileName}`);
    await fileRef.save(req.file.buffer, { metadata: { contentType: "application/pdf" } });
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const host = req.get("x-forwarded-host") || req.get("host");
    const url = `${proto}://${host}/api/upload/pdf/serve/${fileName}`;
    res.json({ url, fileName });
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
    // Return a root-relative path so it works in both dev (Vite proxy) and prod
    // without depending on x-forwarded-proto/host which Vite does not forward.
    const url = `/api/upload/avatar/${fileName}`;
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
      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!bucketId) { res.status(500).json({ error: "Storage not configured" }); return; }
      const bucket = gcsClient.bucket(bucketId);
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${Date.now()}_${safeName}`;
      const fileRef = bucket.file(`pdfs/${fileName}`);
      await fileRef.save(req.file.buffer, { metadata: { contentType: "application/pdf" } });
      const proto = req.get("x-forwarded-proto") || req.protocol;
      const host = req.get("x-forwarded-host") || req.get("host");
      const url = `${proto}://${host}/api/upload/pdf/serve/${fileName}`;
      result = { secure_url: url, public_id: fileName };
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
