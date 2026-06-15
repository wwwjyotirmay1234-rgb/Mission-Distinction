import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { usersTable, emailTokensTable, refreshTokensTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import {
  generateEmailToken,
  getAppUrl,
  sendEmail,
  resetPasswordEmail,
  verifyEmailTemplate,
} from "../lib/email";
import rateLimit from "express-rate-limit";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again in an hour." },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again in 15 minutes." },
});

// ─── Student Register ────────────────────────────────────────────────────────
router.post("/student/register", registerLimiter, async (req: Request, res: Response) => {
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
      passwordHash: await hashPassword(password),
      role: "student",
      year,
      college,
      studyStreak: 0,
      emailVerified: false,
    }).returning();

    // Create email verification token
    const verifyToken = generateEmailToken();
    const verifyExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await db.insert(emailTokensTable).values({
      userId: user.id,
      email: user.email,
      token: verifyToken,
      type: "verify",
      expiresAt: verifyExpiresAt,
    });

    const verifyUrl = `${getAppUrl()}/verify-email?token=${verifyToken}`;
    const emailSent = await sendEmail(user.email, "Verify your email — Mission Distinction", verifyEmailTemplate(verifyUrl, user.fullName));

    const jwtToken = generateToken(user.id, user.role);
    const refreshValue = randomUUID();
    await db.insert(refreshTokensTable).values({ userId: user.id, token: refreshValue, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    res.status(201).json({
      token: jwtToken,
      refreshToken: refreshValue,
      user: sanitizeUser(user),
      ...(process.env.NODE_ENV !== "production" && !emailSent && { verifyLink: verifyUrl }),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Student Login ────────────────────────────────────────────────────────────
router.post("/student/login", loginLimiter, async (req: Request, res: Response) => {
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
    if (!await verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id, user.role);
    const refreshValue = randomUUID();
    await db.insert(refreshTokensTable).values({ userId: user.id, token: refreshValue, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    res.json({ token, refreshToken: refreshValue, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin Register ───────────────────────────────────────────────────────────
router.post("/admin/register", registerLimiter, async (req: Request, res: Response) => {
  try {
    const { fullName, workEmail, password, inviteCode } = req.body;
    if (!fullName || !workEmail || !password || !inviteCode) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const validInviteCode = process.env.ADMIN_INVITE_CODE;
    if (!validInviteCode) {
      res.status(500).json({ error: "Admin registration is not configured. Contact the platform owner." });
      return;
    }
    if (inviteCode !== validInviteCode) {
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
      passwordHash: await hashPassword(password),
      role: "admin",
      emailVerified: true,
    }).returning();
    const token = generateToken(user.id, user.role);
    const refreshValue = randomUUID();
    await db.insert(refreshTokensTable).values({ userId: user.id, token: refreshValue, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    res.status(201).json({ token, refreshToken: refreshValue, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin Login ──────────────────────────────────────────────────────────────
router.post("/admin/login", loginLimiter, async (req: Request, res: Response) => {
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
    if (!await verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id, user.role);
    const refreshValue = randomUUID();
    await db.insert(refreshTokensTable).values({ userId: user.id, token: refreshValue, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    res.json({ token, refreshToken: refreshValue, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────
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
        passwordHash: await hashPassword(uid),
        role: "student",
        studyStreak: 0,
        emailVerified: true, // Google already verified the email
      }).returning();
    } else if (!user.emailVerified) {
      // Mark existing users as verified if they sign in via Google
      await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id));
      user = { ...user, emailVerified: true };
    }
    const token = generateToken(user.id, user.role);
    const refreshValue = randomUUID();
    await db.insert(refreshTokensTable).values({ userId: user.id, token: refreshValue, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    res.json({ token, refreshToken: refreshValue, user: sanitizeUser(user) });
  } catch (err: any) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Google sign-in failed. Please try again." });
  }
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
router.post("/forgot-password", forgotPasswordLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    // Always respond the same to prevent email enumeration
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
      res.json({ message: "If that email is registered, a reset link has been sent." });
      return;
    }

    // Delete existing unused reset tokens for this user
    await db.delete(emailTokensTable).where(
      and(eq(emailTokensTable.userId, user.id), eq(emailTokensTable.type, "reset"))
    );

    const token = generateEmailToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.insert(emailTokensTable).values({
      userId: user.id,
      email: user.email,
      token,
      type: "reset",
      expiresAt,
    });

    const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;
    const emailSent = await sendEmail(user.email, "Reset your password — Mission Distinction", resetPasswordEmail(resetUrl));

    res.json({
      message: "If that email is registered, a reset link has been sent.",
      ...(process.env.NODE_ENV !== "production" && !emailSent && { devLink: resetUrl }),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const [tokenRow] = await db.select().from(emailTokensTable).where(
      and(eq(emailTokensTable.token, token), eq(emailTokensTable.type, "reset"))
    );
    if (!tokenRow || tokenRow.used || tokenRow.expiresAt < new Date()) {
      res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
      return;
    }
    await db.update(usersTable)
      .set({ passwordHash: await hashPassword(newPassword) })
      .where(eq(usersTable.id, tokenRow.userId));
    await db.update(emailTokensTable).set({ used: true }).where(eq(emailTokensTable.id, tokenRow.id));
    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Missing verification token" });
      return;
    }
    const [tokenRow] = await db.select().from(emailTokensTable).where(
      and(eq(emailTokensTable.token, token), eq(emailTokensTable.type, "verify"))
    );
    if (!tokenRow || tokenRow.used || tokenRow.expiresAt < new Date()) {
      res.status(400).json({ error: "This verification link is invalid or has expired." });
      return;
    }
    await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, tokenRow.userId));
    await db.update(emailTokensTable).set({ used: true }).where(eq(emailTokensTable.id, tokenRow.id));
    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Resend Verification ──────────────────────────────────────────────────────
router.post("/resend-verification", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (user.emailVerified) { res.json({ message: "Email is already verified." }); return; }

    // Delete existing verify tokens
    await db.delete(emailTokensTable).where(
      and(eq(emailTokensTable.userId, user.id), eq(emailTokensTable.type, "verify"))
    );

    const token = generateEmailToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(emailTokensTable).values({
      userId: user.id, email: user.email, token, type: "verify", expiresAt
    });

    const verifyUrl = `${getAppUrl()}/verify-email?token=${token}`;
    const emailSent = await sendEmail(user.email, "Verify your email — Mission Distinction", verifyEmailTemplate(verifyUrl, user.fullName));

    res.json({
      message: "Verification email sent.",
      ...(process.env.NODE_ENV !== "production" && !emailSent && { devLink: verifyUrl }),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Change Password ──────────────────────────────────────────────────────────
router.post("/change-password", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters" });
      return;
    }
    const userId = (req as any).user?.id;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (!await verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    await db.update(usersTable).set({ passwordHash: await hashPassword(newPassword) }).where(eq(usersTable.id, userId));
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ error: "Missing refresh token" }); return; }
    const [tokenRow] = await db.select().from(refreshTokensTable).where(eq(refreshTokensTable.token, refreshToken));
    if (!tokenRow || tokenRow.expiresAt < new Date()) {
      res.status(401).json({ error: "Refresh token invalid or expired. Please log in again." }); return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tokenRow.userId));
    if (!user || user.bannedAt) {
      res.status(401).json({ error: "Account not found or suspended" }); return;
    }
    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.id, tokenRow.id));
    const newRefreshValue = randomUUID();
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(refreshTokensTable).values({ userId: user.id, token: newRefreshValue, expiresAt: newExpiry });
    const newAccessToken = generateToken(user.id, user.role);
    res.json({ token: newAccessToken, refreshToken: newRefreshValue, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post("/logout", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.token, refreshToken)).catch(() => {});
  }
  res.json({ message: "Logged out" });
});

// ─── Me ───────────────────────────────────────────────────────────────────────
router.get("/me", authMiddleware, (req: Request, res: Response) => {
  res.json(sanitizeUser((req as any).user));
});

// ─── Admin: Test Email ────────────────────────────────────────────────────────
router.post("/admin/test-email", adminMiddleware, async (req: Request, res: Response) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_EMAIL;
  const toEmail = fromEmail || "admin@missiondistinction.in";

  const envCheck = {
    SENDGRID_API_KEY: !!apiKey,
    SENDGRID_FROM_EMAIL: !!fromEmail,
  };

  if (!apiKey) {
    res.status(503).json({
      ok: false,
      message: "SENDGRID_API_KEY not configured in environment.",
      envCheck,
    });
    return;
  }

  try {
    const sent = await sendEmail(
      toEmail,
      "✅ Mission Distinction — Email system test",
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f0f1a;color:#e2e8f0;padding:40px;border-radius:12px;">
        <h2 style="color:#7c3aed;margin-top:0;">Mission Distinction</h2>
        <h3>✅ Email system is working!</h3>
        <p style="color:#94a3b8;">Test email sent via <strong>SendGrid</strong> at <strong>${new Date().toISOString()}</strong></p>
        <p style="color:#94a3b8;">All transactional emails (registration verification, password reset) are operational.</p>
      </div>`
    );

    if (!sent) throw new Error("SendGrid returned false — check API key and sender verification.");

    res.json({
      ok: true,
      message: `Test email delivered to ${toEmail} via SendGrid`,
      envCheck,
      appUrl: getAppUrl(),
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      message: `Email failed: ${err.message}`,
      envCheck,
    });
  }
});

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default router;
