import posthog from "posthog-js";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

function ga(...args: unknown[]) {
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

export function initAnalytics() {
  if (POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: false,
    });
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (POSTHOG_KEY) posthog.capture(event, properties);
  ga("event", event, properties ?? {});
}

export function trackPage(path: string) {
  if (POSTHOG_KEY) posthog.capture("$pageview", { $current_url: path });
  if (GA_ID) ga("config", GA_ID, { page_path: path, send_page_view: true });
}

export function identifyUser(id: string | number, traits?: Record<string, unknown>) {
  if (POSTHOG_KEY) posthog.identify(String(id), traits);
  ga("set", "user_properties", { user_id: String(id), ...(traits ?? {}) });
}

export function resetAnalytics() {
  if (POSTHOG_KEY) posthog.reset();
}
