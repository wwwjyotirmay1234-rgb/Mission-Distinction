import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { adminMiddleware, authMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import rateLimit from "express-rate-limit";


const searchLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: "Too many searches. Slow down." }, standardHeaders: true, legacyHeaders: false });
const adminListLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, message: { error: "Too many requests." }, standardHeaders: true, legacyHeaders: false });

const router = Router();

router.get("/", adminMiddleware, adminListLimiter, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const role = req.query.role as string | undefined;

    const DB_CAP = 10000;
    const allUsers = role
      ? await db.select().from(usersTable).where(eq(usersTable.role, role)).orderBy(desc(usersTable.createdAt)).limit(DB_CAP)
      : await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(DB_CAP);

    const total = allUsers.length;
    const paginated = allUsers.slice((page - 1) * limit, page * limit);

    res.json({
      users: paginated.map(sanitizeUser),
      total,
      page,
      limit,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/search", authMiddleware, searchLimiter, async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 2) { res.json([]); return; }
    const requester = (req as any).user;
    const results = await db
      .select({ id: usersTable.id, fullName: usersTable.fullName, avatarUrl: usersTable.avatarUrl, college: usersTable.college })
      .from(usersTable)
      .where(and(eq(usersTable.role, "student"), ilike(usersTable.fullName, `%${q}%`)))
      .limit(10);
    res.json(results.filter(u => u.id !== requester.id));
  } catch { res.status(500).json({ error: "Internal server error" }); }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid user ID" }); return; }

    const requestingUser = (req as any).user;
    if (requestingUser.role !== "admin" && requestingUser.id !== id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid user ID" }); return; }

    const requestingUser = (req as any).user;
    if (requestingUser.role !== "admin" && requestingUser.id !== id) {
      res.status(403).json({ error: "You can only update your own profile" });
      return;
    }

    const { fullName, year, college, avatarUrl } = req.body;

    if (fullName !== undefined && (typeof fullName !== "string" || fullName.trim().length < 2)) {
      res.status(400).json({ error: "Name must be at least 2 characters" }); return;
    }

    if (avatarUrl !== undefined && avatarUrl !== null && avatarUrl !== "") {
      try {
        const u = new URL(avatarUrl);
        if (u.protocol !== "https:") {
          res.status(400).json({ error: "avatarUrl must be an HTTPS URL" }); return;
        }
      } catch {
        res.status(400).json({ error: "avatarUrl must be a valid URL" }); return;
      }
    }

    const [user] = await db.update(usersTable)
      .set({
        fullName: fullName?.trim(),
        year: year?.trim(),
        college: college?.trim(),
        avatarUrl: avatarUrl?.trim() || null,
      })
      .where(eq(usersTable.id, id))
      .returning();

    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid user ID" }); return; }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

function sanitizeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export default router;
