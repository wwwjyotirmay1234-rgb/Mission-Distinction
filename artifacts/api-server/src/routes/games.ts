import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import rateLimit from "express-rate-limit";

const router = Router();

const gameLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 500 : 40,
  message: { error: "Too many game requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// All AI-powered game endpoints have been removed.
// Routes below return 503 so the frontend can show a graceful message.

router.post("/word-scramble", authMiddleware, gameLimiter, (_req: Request, res: Response) => {
  res.status(503).json({ error: "Word scramble is currently unavailable." });
});

router.post("/memory-match", authMiddleware, gameLimiter, (_req: Request, res: Response) => {
  res.status(503).json({ error: "Memory match is currently unavailable." });
});

router.post("/diagnosis", authMiddleware, gameLimiter, (_req: Request, res: Response) => {
  res.status(503).json({ error: "Diagnosis challenge is currently unavailable." });
});

router.post("/spelling-bee", authMiddleware, gameLimiter, (_req: Request, res: Response) => {
  res.status(503).json({ error: "Spelling bee is currently unavailable." });
});

router.post("/crossword", authMiddleware, gameLimiter, (_req: Request, res: Response) => {
  res.status(503).json({ error: "Crossword is currently unavailable." });
});

export { router as gamesRouter };
