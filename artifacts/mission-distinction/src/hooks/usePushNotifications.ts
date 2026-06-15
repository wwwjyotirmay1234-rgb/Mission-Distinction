import { useState, useEffect } from "react";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("mission_token");
  return fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

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
    } catch { }
  }

  async function subscribe() {
    if (!supported) { toast.error("Push notifications not supported in this browser."); return; }
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const res = await fetch(`${BASE}/api/push/vapid-key`);
      const { publicKey } = await res.json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const subJson = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const saveRes = await apiFetch("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify(subJson),
      });
      if (!saveRes.ok) throw new Error("Failed to save subscription");
      setSubscribed(true);
      setPermission("granted");
      toast.success("Push notifications enabled!");
    } catch (err: any) {
      toast.error("Failed to enable push notifications.");
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
    } catch {
      toast.error("Failed to disable push notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function requestAndSubscribe() {
    if (!supported) { toast.error("Push notifications not supported."); return; }
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") await subscribe();
    else toast.error("Permission denied. Enable notifications in browser settings.");
  }

  return { supported, permission, subscribed, loading, requestAndSubscribe, unsubscribe };
}
