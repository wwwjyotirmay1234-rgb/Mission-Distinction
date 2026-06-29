---
name: SW API cache strategy
description: Service worker API caching must be network-first, not stale-while-revalidate, to prevent stale empty-array responses causing blank pages on multi-device setups.
---

## Rule
API routes cached by the service worker must use **network-first**, not stale-while-revalidate.

**Why:** Students who first open a page before their year/session is set (Google signup flow, no year required) get an empty `[]` API response. With stale-while-revalidate, that `[]` is cached and served for up to the TTL even after the profile is updated. React Query renders with `[]`, page looks blank. This is especially visible on tablets (second device) where the SW cache is fresh and hasn't been updated since the user updated their profile on their phone.

**How to apply:**
```js
// Network-first: try network, fall back to cache only when offline
event.respondWith(
  fetch(event.request)
    .then(response => cacheApiResponse(event.request, response))
    .catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response(JSON.stringify({ error: "You are offline." }), { status: 503, ... });
    })
);
```

This ensures: online users always get fresh data; offline users get the last good cached response.
