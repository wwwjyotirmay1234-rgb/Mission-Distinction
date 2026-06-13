import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "md_salt_2025").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: number, role: string): string {
  const payload = `${userId}:${role}:${Date.now()}`;
  return Buffer.from(payload).toString("base64");
}

export function parseToken(token: string): { userId: number; role: string } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId, role] = decoded.split(":");
    return { userId: parseInt(userId), role };
  } catch {
    return null;
  }
}
