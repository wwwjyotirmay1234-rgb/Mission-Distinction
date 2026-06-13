import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/student/register", async (req: Request, res: Response) => {
  try {
    const { fullName, email, mobileNumber, password, year, college } = req.body;
    if (!fullName || !email || !password || !year || !college) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const [user] = await db.insert(usersTable).values({
      fullName,
      email,
      mobileNumber: mobileNumber || null,
      passwordHash: hashPassword(password),
      role: "student",
      year,
      college,
      studyStreak: 0,
    }).returning();
    const token = generateToken(user.id, user.role);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/student/login", async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ error: "Missing credentials" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, identifier));
    if (!user || user.role !== "student") {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (!verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id, user.role);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/register", async (req: Request, res: Response) => {
  try {
    const { fullName, workEmail, password, inviteCode } = req.body;
    if (!fullName || !workEmail || !password || !inviteCode) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    if (inviteCode !== "2004") {
      res.status(400).json({ error: "Invalid invite code" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, workEmail));
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const [user] = await db.insert(usersTable).values({
      fullName,
      email: workEmail,
      passwordHash: hashPassword(password),
      role: "admin",
    }).returning();
    const token = generateToken(user.id, user.role);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Missing credentials" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user || user.role !== "admin") {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (!verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id, user.role);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/google", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ error: "Missing idToken" });
      return;
    }
    const { getFirebaseAdmin } = await import("../lib/firebase-admin");
    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { email, name, uid } = decoded;
    if (!email) {
      res.status(400).json({ error: "Google account has no email" });
      return;
    }
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
      [user] = await db.insert(usersTable).values({
        fullName: name || email.split("@")[0],
        email,
        passwordHash: hashPassword(uid),
        role: "student",
        studyStreak: 0,
      }).returning();
    }
    const token = generateToken(user.id, user.role);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err: any) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Google sign-in failed: " + err.message });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.json({ message: "Logged out" });
});

router.get("/me", authMiddleware, (req: Request, res: Response) => {
  res.json(sanitizeUser((req as any).user));
});

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default router;
