import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getFirebaseAdmin } from "../lib/firebase-admin";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post("/pdf", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    const admin = getFirebaseAdmin();
    const bucket = admin.storage().bucket();
    const fileName = `pdfs/${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
    const file = bucket.file(fileName);
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    res.json({ url: publicUrl, fileName });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

router.post("/book-cover", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    const admin = getFirebaseAdmin();
    const bucket = admin.storage().bucket();
    const fileName = `covers/${Date.now()}_${req.file.originalname.replace(/\s+/g, "_")}`;
    const file = bucket.file(fileName);
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    res.json({ url: publicUrl, fileName });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

export default router;
