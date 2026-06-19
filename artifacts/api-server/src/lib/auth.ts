import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Add it to Replit Secrets before starting the server.");
}
const JWT_EXPIRES_IN = "7d";
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.length === 64 && !hash.startsWith("$2")) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

function uaHash(userAgent?: string): string | undefined {
  if (!userAgent) return undefined;
  return createHash("sha256").update(userAgent).digest("hex").slice(0, 16);
}

export function generateToken(userId: number, role: string, userAgent?: string): string {
  const payload: Record<string, unknown> = { userId, role };
  const uah = uaHash(userAgent);
  if (uah) payload.uah = uah;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function parseToken(token: string): { userId: number; role: string; uah?: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string; uah?: string };
    return { userId: decoded.userId, role: decoded.role, uah: decoded.uah };
  } catch {
    return null;
  }
}

export { uaHash };

export function parseId(param: string): number | null {
  const id = parseInt(param, 10);
  return isNaN(id) || id <= 0 ? null : id;
}
