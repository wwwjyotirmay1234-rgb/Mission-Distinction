import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
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
      const reg = await navigator.serviceWorker.ready;
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
      // Wait for the SW to be fully active before subscribing.
      const reg = await navigator.serviceWorker.ready;

      // Fetch the server's VAPID public key.
      const keyRes = await fetch("/api/push/vapid-key", { credentials: "include" });
      if (!keyRes.ok) throw new Error(`VAPID key fetch failed (${keyRes.status})`);
      const { publicKey } = await keyRes.json();
      if (!publicKey) throw new Error("Server returned no VAPID public key");

      // Pass the Uint8Array directly — NOT .buffer — to avoid corrupting the
      // key on browsers that require a BufferSource view, not a raw ArrayBuffer.
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Unsubscribe any stale subscription first so we start fresh.
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
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
        throw new Error(body.error || `Save subscription failed (${saveRes.status})`);
      }

      setSubscribed(true);
      setPermission("granted");
      toast.success("Push notifications enabled!");
    } catch (err: any) {
      console.error("[Push] subscribe error:", err);
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("permission")) {
        toast.error("Notification permission denied. Allow it in your browser/app settings and try again.");
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
      const reg = await navigator.serviceWorker.ready;
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
    // Fast-fail if already hard-blocked so the user sees an actionable message
    // before the browser even shows its own permission prompt.
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
