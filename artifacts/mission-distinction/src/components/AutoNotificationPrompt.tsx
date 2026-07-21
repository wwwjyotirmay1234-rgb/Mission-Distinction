import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const STORAGE_KEY = "mission_notif_auto_prompted_v1";

/**
 * Automatically triggers the browser push-notification permission prompt
 * once per student, instead of requiring them to find the toggle in
 * Settings. Browsers require an explicit user gesture/consent for
 * Notification.requestPermission(), so this cannot bypass that dialog —
 * it just surfaces it proactively on first dashboard load.
 *
 * Behavior:
 * - If the student already granted permission previously but has no
 *   active push subscription (e.g. cleared site data), silently
 *   re-subscribes with no prompt.
 * - If permission is still "default" (never asked), shows the native
 *   browser prompt once. Whatever the student chooses (allow/deny/
 *   dismiss), we don't ask again automatically — they can still use
 *   the Settings page to retry manually.
 * - Skips entirely on unsupported browsers/environments (iOS Safari
 *   not installed, in-app browsers, etc.) where prompting would be
 *   confusing or impossible anyway.
 */
export function AutoNotificationPrompt() {
  const { user } = useAuth();
  const { supported, blockReason, permission, subscribed, requestAndSubscribe } = usePushNotifications();
  const attempted = useRef(false);

  useEffect(() => {
    if (!user || attempted.current) return;
    if (!supported || blockReason) return; // unsupported / ios-not-installed / in-app-browser / denied

    const key = `${STORAGE_KEY}:${user.id}`;
    if (localStorage.getItem(key)) return;

    // Already granted but not subscribed (e.g. after clearing storage) — resubscribe silently.
    if (permission === "granted" && !subscribed) {
      attempted.current = true;
      localStorage.setItem(key, "1");
      requestAndSubscribe();
      return;
    }

    // Never asked yet — trigger the native prompt automatically.
    if (permission === "default") {
      attempted.current = true;
      localStorage.setItem(key, "1");
      requestAndSubscribe();
    }
  }, [user, supported, blockReason, permission, subscribed, requestAndSubscribe]);

  return null;
}
