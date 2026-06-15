import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;

export function initAnalytics() {
  if (!KEY) return;
  posthog.init(KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
  });
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!KEY) return;
  posthog.capture(event, properties);
}

export function trackPage(path: string) {
  if (!KEY) return;
  posthog.capture("$pageview", { $current_url: path });
}

export function identifyUser(id: string | number, traits?: Record<string, unknown>) {
  if (!KEY) return;
  posthog.identify(String(id), traits);
}

export function resetAnalytics() {
  if (!KEY) return;
  posthog.reset();
}
