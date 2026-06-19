import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { contentReportsTable, confessionsTable, doubtsTable, mnemonicsTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";
import { parseId } from "../lib/auth";
import { logAudit } from "../lib/auditLog";
import rateLimit from "express-rate-limit";

const router = Router();

const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many reports submitted. Please wait." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Student: report content
router.post("/report", authMiddleware, reportLimiter, async (req: Request, res: Response) => {
  try {
    const reporterId = parseId((req as any).user?.id);
    const { contentType, contentId, reason, contentPreview } = req.body;
    if (!contentType || !contentId || !reason?.trim()) {
      res.status(400).json({ error: "contentType, contentId, reason required" }); return;
    }
    const validTypes = new Set(["confession", "doubt", "mnemonic", "community"]);
    if (!validTypes.has(contentType)) { res.status(400).json({ error: "Invalid content type" }); return; }

    await db.insert(contentReportsTable).values({
      reporterId,
      contentType,
      contentId: parseId(contentId),
      contentPreview: String(contentPreview ?? "").slice(0, 200),
      reason: reason.trim().slice(0, 300),
      status: "pending",
    }).onConflictDoNothing();

    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to submit report" }); }
});

// Admin: list reports
router.get("/reports", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || "pending";
    const reports = await db.select({
      id: contentReportsTable.id,
      contentType: contentReportsTable.contentType,
      contentId: contentReportsTable.contentId,
      contentPreview: contentReportsTable.contentPreview,
      reason: contentReportsTable.reason,
      status: contentReportsTable.status,
      reviewedAt: contentReportsTable.reviewedAt,
      createdAt: contentReportsTable.createdAt,
      reporterName: usersTable.fullName,
    })
    .from(contentReportsTable)
    .leftJoin(usersTable, eq(contentReportsTable.reporterId, usersTable.id))
    .where(eq(contentReportsTable.status, status))
    .orderBy(desc(contentReportsTable.createdAt))
    .limit(100);

    const pendingCount = await db.select({ c: sql<number>`COUNT(*)` })
      .from(contentReportsTable)
      .where(eq(contentReportsTable.status, "pending"));

    res.json({ reports, pendingCount: Number(pendingCount[0]?.c ?? 0) });
  } catch { res.status(500).json({ error: "Failed to load reports" }); }
});

// Admin: dismiss report
router.patch("/reports/:id/dismiss", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    await db.update(contentReportsTable).set({ status: "dismissed", reviewedBy: admin.id, reviewedAt: new Date() }).where(eq(contentReportsTable.id, id));
    await logAudit(admin.id, admin.name, "dismissed_report", "content_report", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to dismiss report" }); }
});

// Admin: remove content
router.delete("/reports/:id/remove", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const id = parseId(req.params.id);
    const [report] = await db.select().from(contentReportsTable).where(eq(contentReportsTable.id, id)).limit(1);
    if (!report) { res.status(404).json({ error: "Report not found" }); return; }

    if (report.contentType === "confession") {
      await db.delete(confessionsTable).where(eq(confessionsTable.id, report.contentId));
    } else if (report.contentType === "doubt") {
      await db.delete(doubtsTable).where(eq(doubtsTable.id, report.contentId));
    } else if (report.contentType === "mnemonic") {
      await db.delete(mnemonicsTable).where(eq(mnemonicsTable.id, report.contentId));
    }

    await db.update(contentReportsTable).set({ status: "removed", reviewedBy: admin.id, reviewedAt: new Date() }).where(eq(contentReportsTable.id, id));
    await db.update(contentReportsTable).set({ status: "removed" }).where(and(eq(contentReportsTable.contentType, report.contentType), eq(contentReportsTable.contentId, report.contentId)));
    await logAudit(admin.id, admin.name, `removed_${report.contentType}`, report.contentType, report.contentId, { reason: report.reason });

    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to remove content" }); }
});

export { router as moderationRouter };
