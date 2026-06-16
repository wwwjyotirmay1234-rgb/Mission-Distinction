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
  const parsed = parseToken(token);
  if (!parsed) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  if (parsed.uah) {
    const currentUah = uaHash(req.headers["user-agent"]);
    if (currentUah && parsed.uah !== currentUah) {
      console.warn(
        `[Security] JWT user-agent mismatch for userId=${parsed.userId} — ` +
        `token_uah=${parsed.uah} request_uah=${currentUah}. ` +
        `Possible token reuse across devices or browser change.`
      );
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
