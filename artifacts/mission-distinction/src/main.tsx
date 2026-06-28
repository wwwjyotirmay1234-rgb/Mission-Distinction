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
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    try {
      if (import.meta.env.DEV) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      await navigator.serviceWorker.register(swUrl);
    } catch {
    }
  });
}

// Request persistent storage so iOS/Android don't evict our token/session data
if ("storage" in navigator && "persist" in navigator.storage) {
  navigator.storage.persist().catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
