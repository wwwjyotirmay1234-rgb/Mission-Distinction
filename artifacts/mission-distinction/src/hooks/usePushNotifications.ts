import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Resolves with the SW registration or rejects after `ms` milliseconds.
// Prevents the subscribe flow from hanging forever when the SW failed to register.
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
  const supported =
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  useEffect(() => {
    if (!supported) return;
    setPermission(Notification.permission);
    checkSubscription();
  }, [supported]);

  async function checkSubscription() {
    try {
      const reg = await swReady(5000);
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {}
  }

  async function subscribe() {
    if (!supported) {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }
    setLoading(true);
    try {
      // Wait for the SW to be fully active — with a timeout so we don't hang forever.
      const reg = await swReady(10000);

      // Fetch the server's VAPID public key using the correct base path.
      const keyRes = await fetch(`${BASE}/api/push/vapid-key`, { credentials: "include" });
      if (!keyRes.ok) throw new Error(`VAPID key fetch failed (${keyRes.status})`);
      const { publicKey } = await keyRes.json();
      if (!publicKey) throw new Error("Server returned no VAPID public key");

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Unsubscribe any stale subscription first so we start fresh.
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

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
      if (msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("permission")) {
        toast.error("Notification permission denied. Allow it in your browser/app settings and try again.");
      } else if (msg.includes("timed out")) {
        toast.error("Could not connect to notification service. Try reloading the page.");
      } else if (msg.includes("VAPID") || msg.includes("key")) {
        toast.error("Push setup error — please try again.");
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
    if (!supported) {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }
    if (Notification.permission === "denied") {
      toast.error(
        "Notifications are blocked. Open your browser or phone settings, allow notifications for this site, then tap Enable again."
      );
      return;
    }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      await subscribe();
    } else {
      toast.error("Permission denied. Enable notifications in your browser settings and try again.");
    }
  }

  return { supported, permission, subscribed, loading, requestAndSubscribe, unsubscribe };
}
