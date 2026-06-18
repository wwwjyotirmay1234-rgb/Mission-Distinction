import { Router, Request, Response } from "express";
import { adminMiddleware, authMiddleware } from "../middlewares/auth";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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

// ─── Avatar ───────────────────────────────────────────────────────────────────
router.post("/avatar", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    const realMime = await detectMime(req.file.buffer);
    if (!realMime || !ALLOWED_IMAGE_MIMES.has(realMime)) { res.status(400).json({ error: "Only JPG, PNG, WebP or GIF images are allowed" }); return; }
    const userId = (req as any).user?.id;
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "mission-distinction/avatars",
      resource_type: "image",
      public_id: `avatar_${userId}_${Date.now()}`,
    });
    // Apply transformations via URL (avoids signature mismatch with transformation param)
    const transformedUrl = result.secure_url.replace(
      "/upload/",
      "/upload/w_400,h_400,c_fill,g_face,q_auto,f_auto/"
    );
    res.json({ url: transformedUrl });
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

export default router;
