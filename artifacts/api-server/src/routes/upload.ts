import { Router, Request, Response } from "express";
import { adminMiddleware } from "../middlewares/auth";
import { getFirebaseAdmin } from "../lib/firebase-admin";
import multer from "multer";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedPdf = ["application/pdf"];
    const allowedImage = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (file.fieldname === "file" && (allowedPdf.includes(file.mimetype) || allowedImage.includes(file.mimetype))) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

router.post("/pdf", adminMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    if (req.file.mimetype !== "application/pdf") {
      res.status(400).json({ error: "Only PDF files are allowed" });
      return;
    }
    const admin = getFirebaseAdmin();
    const bucket = admin.storage().bucket();
    const fileName = `pdfs/${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const file = bucket.file(fileName);
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    res.json({ url: publicUrl, fileName });
  } catch (err: any) {
    console.error("PDF upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

router.post("/book-cover", adminMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    const admin = getFirebaseAdmin();
    const bucket = admin.storage().bucket();
    const fileName = `covers/${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const file = bucket.file(fileName);
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    res.json({ url: publicUrl, fileName });
  } catch (err: any) {
    console.error("Cover upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

export default router;
