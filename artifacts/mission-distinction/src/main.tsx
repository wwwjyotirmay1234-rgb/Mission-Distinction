import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAnalytics } from "./lib/analytics";

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
