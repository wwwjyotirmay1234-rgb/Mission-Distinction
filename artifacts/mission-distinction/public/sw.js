const CACHE_NAME = "mission-distinction-v10";
const STATIC_ASSETS = ["/", "/index.html"];
const API_CACHE_NAME = "mission-distinction-api-v10";
const ASSET_CACHE_NAME = "mission-distinction-assets-v10";

const CACHEABLE_API_PREFIXES = [
  "/api/quizzes",
  "/api/pdfs",
  "/api/notes",
  "/api/books",
  "/api/announcements",
  "/api/leaderboard",
  "/api/dashboard",
  "/api/subjects",
  "/api/flashcards",
  "/api/mnemonics",
  "/api/exams",
  "/api/confessions",
  "/api/study-rooms",
  "/api/doubts",
];

const API_CACHE_TTL_MS = 10 * 60 * 1000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME && k !== ASSET_CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isCacheableApi(url) {
  return CACHEABLE_API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function isExpired(response) {
  const cachedAt = response.headers.get("sw-cached-at");
  if (!cachedAt) return false;
  return Date.now() - Number(cachedAt) > API_CACHE_TTL_MS;
}

async function cacheApiResponse(request, response) {
  if (!response.ok) return response;
  const cache = await caches.open(API_CACHE_NAME);
  const headers = new Headers(response.headers);
  headers.set("sw-cached-at", String(Date.now()));
  const cloned = new Response(await response.clone().arrayBuffer(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  cache.put(request, cloned);
  return response;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  // ── Cacheable API routes (stale-while-revalidate) ──────────────────────────
  if (isCacheableApi(url)) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached && !isExpired(cached)) {
          fetch(event.request)
            .then((fresh) => cacheApiResponse(event.request, fresh))
            .catch(() => {});
          return cached;
        }
        return fetch(event.request)
          .then((response) => cacheApiResponse(event.request, response))
          .catch(() => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({ error: "You are offline. Showing cached data when available." }),
              { status: 503, headers: { "Content-Type": "application/json" } }
            );
          });
      })
    );
    return;
  }

  // ── Skip non-cacheable API routes ─────────────────────────────────────────
  if (url.pathname.startsWith("/api/")) return;

  // ── Navigation requests (HTML shell) ──────────────────────────────────────
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // ── Vite-hashed assets (/assets/*.js, /assets/*.css, /assets/*.woff2 etc.)
  //    These are immutable (content-hash in filename) → cache-first forever ──
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(ASSET_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        });
      })
    );
    return;
  }

  // ── Static public files (icons, fonts, images) — cache-first ──────────────
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf)$/)
  ) {
    event.respondWith(
      caches.open(ASSET_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached || new Response("", { status: 404 }));
      })
    );
    return;
  }

  // ── Everything else — network, fall back to cache ─────────────────────────
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Mission Distinction",
    body: "You have a new notification",
    url: "/",
    icon: "/logo.jpeg",
  };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: "/logo.jpeg",
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
