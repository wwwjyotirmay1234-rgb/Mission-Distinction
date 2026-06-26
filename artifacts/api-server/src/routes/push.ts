import { Router, Request, Response } from "express";
import webpush from "web-push";
import { db } from "@workspace/db";
import { pushSubscriptionsTable, appSettingsTable } from "@workspace/db";
import { authMiddleware } from "../middlewares/auth";
import { eq, and } from "drizzle-orm";
import rateLimit from "express-rate-limit";

const router = Router();

const pushSubscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Too many subscription requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

async function getOrCreateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const envPublic = process.env.VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;
  if (envPublic && envPrivate) {
    return { publicKey: envPublic, privateKey: envPrivate };
  }

  const [pub] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, "vapid_public_key"));
  if (pub) {
    const [priv] = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, "vapid_private_key"));
    if (priv) {
      console.warn(
        "[Push] VAPID keys loaded from database. For better security, move them to Replit Secrets " +
        "as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY."
      );
      return { publicKey: pub.value, privateKey: priv.value };
    }
  }

  const keys = webpush.generateVAPIDKeys();
  await db.insert(appSettingsTable).values([
    { key: "vapid_public_key", value: keys.publicKey },
    { key: "vapid_private_key", value: keys.privateKey },
  ]);
  console.warn(
    "[Push] Generated new VAPID keys and stored in database. For better security, add them to " +
    "Replit Secrets as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY, then remove the DB entries."
  );
  return keys;
}

let vapidReady = false;
async function ensureVapid() {
  if (vapidReady) return;
  const keys = await getOrCreateVapidKeys();
  webpush.setVapidDetails(
    "mailto:missiondistinction108@gmail.com",
    keys.publicKey,
    keys.privateKey
  );
  vapidReady = true;
}

router.get("/vapid-key", async (_req: Request, res: Response) => {
  try {
    const keys = await getOrCreateVapidKeys();
    res.json({ publicKey: keys.publicKey });
  } catch {
    res.status(500).json({ error: "Failed to get VAPID key" });
  }
});

router.post("/subscribe", authMiddleware, pushSubscribeLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: "Invalid subscription" });
      return;
    }
    await db.insert(pushSubscriptionsTable).values({
      userId: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    }).onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.json({ message: "Subscribed to push notifications" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/subscribe", authMiddleware, pushSubscribeLimiter, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { endpoint } = req.body;
    if (!endpoint) { res.status(400).json({ error: "Missing endpoint" }); return; }
    await db.delete(pushSubscriptionsTable)
      .where(and(
        eq(pushSubscriptionsTable.endpoint, endpoint),
        eq(pushSubscriptionsTable.userId, user.id),
      ));
    res.json({ message: "Unsubscribed" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export async function sendPushToAll(title: string, body: string, url = "/") {
  try {
    await ensureVapid();
    const subs = await db.select().from(pushSubscriptionsTable);
    const payload = JSON.stringify({ title, body, url, icon: "/logo.jpeg" });
    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );
    const failedEndpoints = subs.filter((_, i) => {
      const r = results[i];
      return r.status === "rejected" || (r.status === "fulfilled" && (r.value.statusCode === 410 || r.value.statusCode === 404));
    }).map(s => s.endpoint);
    for (const ep of failedEndpoints) {
      await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, ep)).catch(() => {});
    }
  } catch { }
}

export default router;
