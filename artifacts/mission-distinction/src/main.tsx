import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAnalytics } from "./lib/analytics";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

initAnalytics();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // Use BASE_URL so the path is correct in dev (/mission-distinction/sw.js)
      // and in production (/sw.js). A hardcoded /sw.js fails in dev because
      // Vite serves the public folder under the configured base path.
      await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
        updateViaCache: "none", // always fetch fresh sw.js — never serve from HTTP cache
      });
    } catch (err) {
      console.warn("[SW] Registration failed:", err);
    }
  });

  // When a new service worker takes control (after a deployment), reload once
  // so the page fetches fresh JS chunks instead of serving stale cached ones.
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Request persistent storage so iOS/Android don't evict our token/session data
if ("storage" in navigator && "persist" in navigator.storage) {
  navigator.storage.persist().catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
