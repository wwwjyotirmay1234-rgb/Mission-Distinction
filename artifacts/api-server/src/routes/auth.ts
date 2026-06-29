import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { db } from "@workspace/db";
import { usersTable, emailTokensTable, refreshTokensTable, bookmarksTable, activityTable, feedbackTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
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

// ── Per-IP limits — set high so entire college campus (shared WiFi) is never blocked ──
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

// ── Per-credential brute-force protection (keyed on email/phone) ────────────
// Prevents an attacker targeting a specific account, even from different IPs.
const perCredentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const id = req.body?.identifier || req.body?.email || req.body?.phone || "unknown";
    return String(id).toLowerCase().trim().slice(0, 100);
  },
  message: { error: "Too many attempts for this account. Please try again in 15 minutes." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again in an hour." },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again in 15 minutes." },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset attempts. Please try again in an hour." },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many token refresh requests. Please try again shortly." },
});

const googleAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200_000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many Google sign-in attempts. Please try again shortly." },
});

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("md_refresh", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie("md_refresh", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

// ─── Student Register ────────────────────────────────────────────────────────
router.post("/student/register", registerLimiter, async (req: Request, res: Response) => {
  try {
    const { fullName, email: rawEmail, mobileNumber, password, year, sessionYear, college } = req.body;
    if (!fullName || !rawEmail || !password || !year || !sessionYear || !college) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const email = rawEmail.trim().toLowerCase();
    const pwError = validatePasswordStrength(password);
    if (pwError) { res.status(400).json({ error: pwError }); return; }
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
      sessionYear,
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
    let emailSent = false;
    try {
      const { html: verifyHtml, text: verifyText } = verifyEmailTemplate(verifyUrl, user.fullName);
      emailSent = await sendEmail(user.email, "Verify your Mission Distinction account", verifyHtml, verifyText);
    } catch (emailErr) {
      console.warn("[register] email send failed (non-fatal):", (emailErr as any)?.message);
    }

    const jwtToken = generateToken(user.id, user.role, req.headers["user-agent"] as string | undefined);
    const refreshValue = randomUUID();
    await db.insert(refreshTokensTable).values({ userId: user.id, token: refreshValue, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    setRefreshCookie(res, refreshValue);
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
router.post("/student/login", loginLimiter, perCredentialLimiter, async (req: Request, res: Response) => {
  try {
    const { identifier: rawIdentifier, password } = req.body;
    if (!rawIdentifier || !password) {
      res.status(400).json({ error: "Missing credentials" });
      return;
    }
    const identifier = rawIdentifier.trim().toLowerCase();
    const [user] = await db.select().from(usersTable).where(
      or(eq(usersTable.email, identifier), eq(usersTable.mobileNumber, identifier))
    );
    if (!user || user.role !== "student") {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (!user.passwordHash) {
      res.status(401).json({ error: "This account was created with Google. Please sign in using the Google button." });
      return;
    }
    if (!await verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id, user.role, req.headers["user-agent"] as string | undefined);
    const refreshValue = randomUUID();
    await db.insert(refreshTokensTable).values({ userId: user.id, token: refreshValue, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    setRefreshCookie(res, refreshValue);
    res.json({ token, refreshToken: refreshValue, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin Register ───────────────────────────────────────────────────────────
router.post("/admin/register", registerLimiter, async (req: Request, res: Response) => {
  try {
    const { fullName, workEmail: rawWorkEmail, password, inviteCode } = req.body;
    if (!fullName || !rawWorkEmail || !password || !inviteCode) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const workEmail = rawWorkEmail.trim().toLowerCase();
    const pwError = validatePasswordStrength(password);
    if (pwError) { res.status(400).json({ error: pwError }); return; }
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
    const token = generateToken(user.id, user.role, req.headers["user-agent"] as string | undefined);
    const refreshValue = randomUUID();
    await db.insert(refreshTokensTable).values({ userId: user.id, token: refreshValue, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    setRefreshCookie(res, refreshValue);
    res.status(201).json({ token, refreshToken: refreshValue, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin Login ──────────────────────────────────────────────────────────────
router.post("/admin/login", loginLimiter, perCredentialLimiter, async (req: Request, res: Response) => {
  try {
    const { email: rawAdminEmail, password } = req.body;
    if (!rawAdminEmail || !password) {
      res.status(400).json({ error: "Missing credentials" });
      return;
    }
    const email = rawAdminEmail.trim().toLowerCase();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user || user.role !== "admin") {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (!await verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id, user.role, req.headers["user-agent"] as string | undefined);
    const refreshValue = randomUUID();
    await db.insert(refreshTokensTable).values({ userId: user.id, token: refreshValue, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    setRefreshCookie(res, refreshValue);
    res.json({ token, refreshToken: refreshValue, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.post("/google", googleAuthLimiter, async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ error: "Missing idToken" });
      return;
    }
    const { getFirebaseAuth } = await import("../lib/firebase-admin");
    const firebaseAuth = getFirebaseAuth();
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const { email: rawGoogleEmail, name, uid } = decoded;
    if (!rawGoogleEmail) {
      res.status(400).json({ error: "Google account has no email" });
      return;
    }
    const email = rawGoogleEmail.trim().toLowerCase();
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
      // Auto-create a student account for new Google sign-ins
      const displayName = (name || email.split("@")[0]).trim().slice(0, 80);
      const [created] = await db.insert(usersTable).values({
        fullName: displayName,
        email,
        passwordHash: "",
        role: "student",
        emailVerified: true,
      }).returning();
      user = created;
    } else if (!user.emailVerified) {
      // Mark existing users as verified if they sign in via Google
      await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id));
      user = { ...user, emailVerified: true };
    }
    const token = generateToken(user.id, user.role, req.headers["user-agent"] as string | undefined);
    const refreshValue = randomUUID();
    await db.insert(refreshTokensTable).values({ userId: user.id, token: refreshValue, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    setRefreshCookie(res, refreshValue);
    res.json({ token, refreshToken: refreshValue, user: sanitizeUser(user) });
  } catch (err: any) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Google sign-in failed. Please try again." });
  }
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
router.post("/forgot-password", forgotPasswordLimiter, async (req: Request, res: Response) => {
  try {
    const { email: rawForgotEmail } = req.body;
    if (!rawForgotEmail) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const email = rawForgotEmail.trim().toLowerCase();
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
    const { html: resetHtml, text: resetText } = resetPasswordEmail(resetUrl);
    const emailSent = await sendEmail(user.email, "Reset your Mission Distinction password", resetHtml, resetText);

    res.json({
      message: "If that email is registered, a reset link has been sent.",
      ...(process.env.NODE_ENV !== "production" && !emailSent && { devLink: resetUrl }),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
router.post("/reset-password", resetPasswordLimiter, async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }
    const pwError = validatePasswordStrength(newPassword);
    if (pwError) { res.status(400).json({ error: pwError }); return; }
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
    const { html: rv2Html, text: rv2Text } = verifyEmailTemplate(verifyUrl, user.fullName);
    const emailSent = await sendEmail(user.email, "Verify your Mission Distinction account", rv2Html, rv2Text);

    res.json({
      message: emailSent ? "Verification email sent." : "Could not send email — use the link below to verify.",
      emailSent,
      ...(!emailSent && { verifyLink: verifyUrl }),
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
    const pwError = validatePasswordStrength(newPassword);
    if (pwError) { res.status(400).json({ error: pwError }); return; }
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
router.post("/refresh", refreshLimiter, async (req: Request, res: Response) => {
  try {
    const refreshToken = (req as any).cookies?.md_refresh || req.body?.refreshToken;
    if (!refreshToken) { res.status(400).json({ error: "Missing refresh token" }); return; }
    const [tokenRow] = await db.select().from(refreshTokensTable).where(eq(refreshTokensTable.token, refreshToken));
    if (!tokenRow || tokenRow.expiresAt < new Date()) {
      clearRefreshCookie(res);
      res.status(401).json({ error: "Refresh token invalid or expired. Please log in again." }); return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, tokenRow.userId));
    if (!user || user.bannedAt) {
      clearRefreshCookie(res);
      res.status(401).json({ error: "Account not found or suspended" }); return;
    }
    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.id, tokenRow.id));
    const newRefreshValue = randomUUID();
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(refreshTokensTable).values({ userId: user.id, token: newRefreshValue, expiresAt: newExpiry });
    setRefreshCookie(res, newRefreshValue);
    const newAccessToken = generateToken(user.id, user.role, req.headers["user-agent"] as string | undefined);
    res.json({ token: newAccessToken, refreshToken: newRefreshValue, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post("/logout", async (req: Request, res: Response) => {
  const refreshToken = (req as any).cookies?.md_refresh || req.body?.refreshToken;
  if (refreshToken) {
    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.token, refreshToken)).catch(() => {});
  }
  clearRefreshCookie(res);
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
    const timestamp = new Date().toISOString();
    const testHtml =
      "<!DOCTYPE html><html><body style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px;background:#f4f4f7;\">" +
      "<h2 style=\"color:#7c3aed;\">Mission Distinction</h2>" +
      "<h3>Email system is working!</h3>" +
      "<p>Test email sent via <strong>SendGrid</strong> at <strong>" + timestamp + "</strong></p>" +
      "<p>All transactional emails (registration verification, password reset) are operational.</p>" +
      "</body></html>";
    const testText = "Mission Distinction — Email system test\n\nEmail system is working!\nTest sent at " + timestamp;
    const sent = await sendEmail(
      toEmail,
      "Mission Distinction — Email system test",
      testHtml,
      testText,
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

// ─── Delete Account (DPDPA §12 Right to Erasure) ────────────────────────────
router.delete("/account", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: "Password is required to confirm account deletion." });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Incorrect password. Account not deleted." });
      return;
    }

    await db.delete(refreshTokensTable).where(eq(refreshTokensTable.userId, userId));
    await db.delete(emailTokensTable).where(eq(emailTokensTable.userId, userId));
    await db.delete(feedbackTable).where(eq(feedbackTable.userId, userId));
    await db.delete(bookmarksTable).where(eq(bookmarksTable.userId, userId));
    await db.delete(activityTable).where(eq(activityTable.userId, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));

    console.info(`[Auth] Account deleted per DPDPA erasure request`);
    res.json({ message: "Your account and all associated personal data have been permanently deleted." });
  } catch (err) {
    console.error("Account deletion error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default router;
