import { Request, Response, NextFunction } from "express";
import { parseToken, uaHash } from "../lib/auth";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  return _verifyToken(token, req, res, next);
}

/**
 * pdfAuthMiddleware — same as authMiddleware but also accepts ?token= query
 * param so PDF serve URLs can be embedded in <iframe> tags (which cannot set
 * custom headers). Only use on read-only, non-sensitive media endpoints.
 */
export async function pdfAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.token === "string" ? req.query.token : null;
  const rawToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : queryToken;
  if (!rawToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  return _verifyToken(rawToken, req, res, next);
}

async function _verifyToken(token: string, req: Request, res: Response, next: NextFunction) {
  const parsed = parseToken(token);
  if (!parsed) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  if (parsed.uah) {
    const currentUah = uaHash(req.headers["user-agent"]);
    if (currentUah && parsed.uah !== currentUah) {
      res.status(401).json({ error: "Session invalid. Please log in again." });
      return;
    }
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  if (user.bannedAt) {
    res.status(403).json({ error: "Your account has been suspended. Contact support." });
    return;
  }
  (req as any).user = user;
  next();
}

export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  await authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (user?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}

export async function superAdminMiddleware(req: Request, res: Response, next: NextFunction) {
  await authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (!user?.isSuperAdmin) {
      res.status(403).json({ error: "Super admin access required" });
      return;
    }
    next();
  });
}
