import { db } from "@workspace/db";
import { deviceEventsTable } from "@workspace/db/schema";
import { detectPlatform } from "./deviceDetect";

export async function logDeviceEvent(
  userId: number | null,
  type: "login" | "install",
  userAgent: string | undefined
): Promise<void> {
  try {
    const platform = detectPlatform(userAgent);
    await db.insert(deviceEventsTable).values({
      userId: userId ?? undefined,
      type,
      platform,
      userAgent: userAgent ?? null,
    });
  } catch (err) {
    console.error("[deviceEvents] logDeviceEvent error:", err);
  }
}
