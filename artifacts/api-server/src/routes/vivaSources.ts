import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { vivaSourcesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { adminMiddleware } from "../middlewares/auth";
import { stripHtml } from "../lib/sanitize";
import { VIVA_SUBJECTS } from "./practicalHub";

const router = Router();

// Admin: list source notes for all subjects (fills in subjects with no row yet)
router.get("/", adminMiddleware, async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(vivaSourcesTable);
    const bySubject = new Map(rows.map((r) => [r.subject, r]));
    const result = VIVA_SUBJECTS.map((subject) => {
      const row = bySubject.get(subject);
      return {
        subject,
        sourceText: row?.sourceText ?? "",
        updatedAt: row?.updatedAt ?? null,
      };
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to load source notes" });
  }
});

// Admin: upsert source notes for a subject
router.put("/:subject", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const subject = String(req.params.subject);
    if (!(VIVA_SUBJECTS as readonly string[]).includes(subject)) {
      res.status(400).json({ error: `subject must be one of ${VIVA_SUBJECTS.join(", ")}` });
      return;
    }
    const safeSourceText = stripHtml(String(req.body?.sourceText ?? "")).trim().slice(0, 8000) || null;

    const [existing] = await db.select().from(vivaSourcesTable).where(eq(vivaSourcesTable.subject, subject));
    const [saved] = existing
      ? await db
          .update(vivaSourcesTable)
          .set({ sourceText: safeSourceText, updatedBy: admin.id, updatedAt: new Date() })
          .where(eq(vivaSourcesTable.subject, subject))
          .returning()
      : await db
          .insert(vivaSourcesTable)
          .values({ subject, sourceText: safeSourceText, updatedBy: admin.id })
          .returning();

    res.json(saved);
  } catch {
    res.status(500).json({ error: "Failed to save source notes" });
  }
});

export { router as vivaSourcesRouter };
