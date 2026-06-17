const CACHE_NAME = "mission-distinction-v5";
const STATIC_ASSETS = ["/", "/index.html"];
const API_CACHE_NAME = "mission-distinction-api-v5";

const CACHEABLE_API_PREFIXES = [
  "/api/quizzes",
  "/api/pdfs",
  "/api/notes",
  "/api/announcements",
  "/api/leaderboard",
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
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim()).then(() =>
      self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
    )
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

  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("/index.html"));
    })
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
