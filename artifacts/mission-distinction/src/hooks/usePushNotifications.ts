import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { isIOSDevice, isStandaloneDisplay, isInAppBrowser } from "@/lib/browserEnv";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

// ── Device / environment detection ────────────────────────────────────────
export type NotifBlockReason =
  | "unsupported"       // browser has no Notification/PushManager/serviceWorker
  | "ios-not-installed" // iOS Safari but not added to Home Screen
  | "ios-browser"       // iOS Chrome/Firefox (WebKit, no push support ever)
  | "in-app-browser"    // Instagram / WhatsApp / Facebook in-app browser
  | "denied"            // user/OS blocked
  | null;               // no block — can proceed

function detectBlockReason(): NotifBlockReason {
  const ua = navigator.userAgent;

  // Check basic API support first
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }

  if (isInAppBrowser()) return "in-app-browser";

  const isIOS = isIOSDevice();

  // iOS browsers that aren't Safari also can't do push (Chrome/Firefox on iOS = WebKit)
  // CriOS = Chrome iOS, FxiOS = Firefox iOS — these use WebKit and don't support push
  if (isIOS && (/crios|fxios|opios/i.test(ua))) {
    return "ios-browser";
  }

  // iOS Safari — only works if installed as PWA (standalone)
  if (isIOS && !isStandaloneDisplay()) {
    return "ios-not-installed";
  }

  // Permission denied at OS/browser level
  if (Notification.permission === "denied") return "denied";

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Resolves with the SW registration or rejects after `ms` milliseconds.
function swReady(ms = 10000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Service worker timed out. Try reloading the page.")), ms)
    ),
  ]);
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockReason, setBlockReason] = useState<NotifBlockReason>(null);

  const supported = blockReason !== "unsupported";

  useEffect(() => {
    const reason = detectBlockReason();
    setBlockReason(reason);
    if (!reason || reason === "denied") {
      if ("Notification" in window) setPermission(Notification.permission);
    }
    if (!reason) checkSubscription();
  }, []);

  // Re-check block reason after permission changes (e.g. user allowed via system settings)
  useEffect(() => {
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);
    const reason = detectBlockReason();
    setBlockReason(reason);
  }, []);

  async function checkSubscription() {
    try {
      const reg = await swReady(5000);
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {
      setSubscribed(false);
    }
  }

  async function subscribe() {
    setLoading(true);
    try {
      const reg = await swReady(10000);

      const keyRes = await fetch(`${BASE}/api/push/vapid-key`, { credentials: "include" });
      if (!keyRes.ok) throw new Error(`VAPID key fetch failed (${keyRes.status})`);
      const { publicKey } = await keyRes.json();
      if (!publicKey) throw new Error("Server returned no VAPID public key");

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Unsubscribe stale subscription first
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        try { await existing.unsubscribe(); } catch {}
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Push subscription is missing required fields");
      }

      const saveRes = await apiFetch("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify(subJson),
      });
      if (!saveRes.ok) {
        const body = await saveRes.json().catch(() => ({}));
        throw new Error((body as any).error || `Save subscription failed (${saveRes.status})`);
      }

      setSubscribed(true);
      setPermission("granted");
      toast.success("Push notifications enabled!");
    } catch (err: any) {
      console.error("[Push] subscribe error:", err);
      const msg: string = err?.message ?? "";

      if (/denied|not allowed|permission/i.test(msg)) {
        setBlockReason("denied");
        toast.error("Notification permission denied. Allow it in your device settings and try again.");
      } else if (/timed out/i.test(msg)) {
        toast.error("Could not connect to notification service. Reload the page and try again.");
      } else if (/vapid|key/i.test(msg)) {
        toast.error("Push setup error — please try again in a few seconds.");
      } else if (/not supported|push.*support/i.test(msg)) {
        toast.error("This browser doesn't support push notifications.");
      } else {
        toast.error(`Could not enable notifications: ${msg || "unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await swReady(5000);
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiFetch("/api/push/subscribe", {
          method: "DELETE",
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Push notifications disabled.");
    } catch (err: any) {
      console.error("[Push] unsubscribe error:", err);
      toast.error("Failed to disable push notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function requestAndSubscribe() {
    // Re-check at call time (user may have changed settings)
    const reason = detectBlockReason();
    setBlockReason(reason);

    if (reason === "unsupported") {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }
    if (reason === "ios-not-installed") {
      toast.error("Tap the Share button → Add to Home Screen, then open the app from your home screen to enable notifications.");
      return;
    }
    if (reason === "ios-browser") {
      toast.error("Push notifications on iPhone require Safari. Open this app in Safari and install it to your Home Screen.");
      return;
    }
    if (reason === "in-app-browser") {
      toast.error("This is an in-app browser. Tap the ⋯ menu → Open in Chrome (or Safari) and try again.");
      return;
    }
    if (reason === "denied") {
      toast.error("Notifications are blocked. Go to your browser or phone Settings → Notifications → allow this site, then try again.");
      return;
    }

    // Permission already granted — skip the prompt and subscribe directly
    if (Notification.permission === "granted") {
      await subscribe();
      return;
    }

    // Default — request permission
    let perm: NotificationPermission;
    try {
      perm = await Notification.requestPermission();
    } catch {
      // Some older browsers return via callback not promise
      perm = await new Promise(resolve => Notification.requestPermission(resolve));
    }
    setPermission(perm);

    if (perm === "granted") {
      await subscribe();
    } else if (perm === "denied") {
      setBlockReason("denied");
      toast.error("Permission denied. Go to Settings → Notifications for this site and allow it, then try again.");
    } else {
      // "default" = dismissed without choosing — prompt them again next time, don't error hard
      toast.info("Tap Enable again when you're ready to allow notifications.");
    }
  }

  return {
    supported,
    blockReason,
    permission,
    subscribed,
    loading,
    requestAndSubscribe,
    unsubscribe,
    recheckSubscription: checkSubscription,
  };
}
