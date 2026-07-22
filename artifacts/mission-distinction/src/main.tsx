import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
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
    beforeSend(event, hint) {
      const err = hint?.originalException;
      const msg = err instanceof Error ? err.message : String(err ?? "");
      // Chunk load failures after a new deploy are expected — the app auto-reloads
      // via the vite:preloadError handler. Don't fill Sentry with these.
      if (
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("error loading dynamically imported module")
      ) {
        return null;
      }
      return event;
    },
  });
}

initAnalytics();

console.log("API URL:", import.meta.env.VITE_API_URL);

setBaseUrl(import.meta.env.VITE_API_URL);

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
  // NOTE: controllerchange / SW_UPDATED reload is handled by the inline script
  // in index.html to avoid duplicating reload logic here.
}

// Request persistent storage so iOS/Android don't evict our token/session data
if ("storage" in navigator && "persist" in navigator.storage) {
  navigator.storage.persist().catch(() => {});
}

// When a lazy-loaded chunk fails to fetch (e.g. after a new deployment replaces
// old hashed filenames), Vite emits this event. Reloading forces the browser to
// re-fetch index.html and get the new chunk URLs — one automatic reload, then done.
window.addEventListener("vite:preloadError", () => {
  const key = "_md_chunk_reload";
  const lastReload = Number(sessionStorage.getItem(key) || "0");
  if (Date.now() - lastReload > 10_000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
});
createRoot(document.getElementById("root")!).render(<App />);
