import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mission_distinction_jwt_2025_changeme_in_production";
const JWT_EXPIRES_IN = "30d";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "md_salt_2025").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: number, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function parseToken(token: string): { userId: number; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
}

export function parseId(param: string): number | null {
  const id = parseInt(param, 10);
  return isNaN(id) || id <= 0 ? null : id;
}
