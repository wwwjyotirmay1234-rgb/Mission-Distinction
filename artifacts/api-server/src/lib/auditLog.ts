import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";

export async function logAudit(
  adminId: number,
  adminName: string,
  action: string,
  entityType?: string,
  entityId?: number,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({ adminId, adminName, action, entityType: entityType ?? null, entityId: entityId ?? null, details: details ?? null });
  } catch {
    // non-blocking
  }
}
