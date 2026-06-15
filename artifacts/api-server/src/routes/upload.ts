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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedPdf = ["application/pdf"];
    const allowedImage = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedPdf.includes(file.mimetype) || allowedImage.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and images are allowed."));
    }
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

router.post("/pdf", adminMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    if (req.file.mimetype !== "application/pdf") {
      res.status(400).json({ error: "Only PDF files are allowed" }); return;
    }

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

router.post("/book-cover", adminMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

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

router.post("/image", adminMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

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

router.post("/avatar", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      res.status(400).json({ error: "Only JPG, PNG, WebP or GIF images are allowed" }); return;
    }
    const userId = (req as any).user?.id;
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "mission-distinction/avatars",
      resource_type: "image",
      public_id: `avatar_${userId}_${Date.now()}`,
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }],
    });
    res.json({ url: result.secure_url });
  } catch (err: any) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

export default router;
