const CACHE_VERSION = "v18"; // absolute icon/manifest paths + registration-scope BASE fix

// Derive the app base from the SW registration scope, not the SW script URL.
// This is correct regardless of where sw.js itself is served (root vs sub-path).
const BASE = new URL(self.registration.scope).pathname;

const CACHE_NAME = `mission-distinction-${CACHE_VERSION}`;
const API_CACHE_NAME = `mission-distinction-api-${CACHE_VERSION}`;
const ASSET_CACHE_NAME = `mission-distinction-assets-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  BASE,
  BASE + "index.html",
];

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

// ── Alarm scheduling ──────────────────────────────────────────────────────────
// alarmTimers: in-memory map alarmId → timeoutId.
// Alarm records are persisted in IDB so they survive SW restarts.
const alarmTimers = new Map();

function openAlarmIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("md_alarm_schedule", 1);
    req.onupgradeneeded = e => {
      if (!e.target.result.objectStoreNames.contains("alarms")) {
        e.target.result.createObjectStore("alarms", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAlarmRecord(alarm) {
  const db = await openAlarmIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("alarms", "readwrite");
    tx.objectStore("alarms").put(alarm);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteAlarmRecord(id) {
  const db = await openAlarmIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("alarms", "readwrite");
    tx.objectStore("alarms").delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllAlarmRecords() {
  const db = await openAlarmIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("alarms", "readonly");
    const req = tx.objectStore("alarms").getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function clearAllAlarmRecords() {
  const db = await openAlarmIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("alarms", "readwrite");
    tx.objectStore("alarms").clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function scheduleAlarmTimer(alarm) {
  if (alarmTimers.has(alarm.id)) {
    clearTimeout(alarmTimers.get(alarm.id));
    alarmTimers.delete(alarm.id);
  }
  if (!alarm.active) return;

  const [h, m] = alarm.time.split(":").map(Number);
  const now = new Date();
  const fire = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  const missedByMs = Date.now() - fire.getTime();
  if (missedByMs >= 0 && missedByMs < 5 * 60 * 1000) {
    // Alarm fired within the last 5 minutes while SW was killed — fire immediately
    fire.setTime(Date.now() + 500);
  } else if (fire.getTime() <= Date.now()) {
    // Missed by more than 5 minutes — schedule for same time tomorrow
    fire.setDate(fire.getDate() + 1);
  }
  const delay = fire.getTime() - Date.now();

  const timerId = setTimeout(async () => {
    alarmTimers.delete(alarm.id);

    // Show persistent status-bar notification
    try {
      await self.registration.showNotification(
        `⏰ ${alarm.label || `Alarm at ${alarm.time}`}`,
        {
          body: alarm.label
            ? `${alarm.label} · ${alarm.time}`
            : `Your ${alarm.time} alarm is ringing!`,
          icon: BASE + "icon-192.png",
          badge: BASE + "icon-192.png",
          tag: "alarm-" + alarm.id,
          requireInteraction: true,
          vibrate: [500, 300, 500, 300, 500, 300, 500, 300, 500],
          actions: [{ action: "dismiss", title: "Dismiss" }],
          data: { alarmId: alarm.id, type: "alarm", url: BASE + "student/tools" },
        }
      );
    } catch {}

    // Remove from persistent IDB (fired)
    try { await deleteAlarmRecord(alarm.id); } catch {}

    // Tell all open page clients so they can play audio + update UI
    try {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of allClients) {
        client.postMessage({ type: "ALARM_FIRED", alarmId: alarm.id });
      }
    } catch {}
  }, delay);

  alarmTimers.set(alarm.id, timerId);
}

async function rescheduleAllAlarms() {
  try {
    const records = await getAllAlarmRecords();
    for (const alarm of records) {
      scheduleAlarmTimer(alarm);
    }
  } catch {}
}

// Page sends alarm commands to the SW via postMessage
self.addEventListener("message", event => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === "ALARM_SCHEDULE") {
    saveAlarmRecord(data.alarm)
      .then(() => scheduleAlarmTimer(data.alarm))
      .catch(() => {});

  } else if (data.type === "ALARM_CANCEL") {
    if (alarmTimers.has(data.alarmId)) {
      clearTimeout(alarmTimers.get(data.alarmId));
      alarmTimers.delete(data.alarmId);
    }
    deleteAlarmRecord(data.alarmId).catch(() => {});

  } else if (data.type === "PING") {
    // Keep-alive from the page — no-op, just receiving the message keeps the SW alive
    event.source?.postMessage({ type: "PONG" });

  } else if (data.type === "ALARM_RESCHEDULE_ALL") {
    // Full sync: page is the source of truth; SW clears and rebuilds its schedule
    clearAllAlarmRecords().then(async () => {
      for (const [, tid] of alarmTimers) clearTimeout(tid);
      alarmTimers.clear();
      if (Array.isArray(data.alarms)) {
        for (const alarm of data.alarms) {
          if (alarm.active && !alarm.fired) {
            await saveAlarmRecord(alarm).catch(() => {});
            scheduleAlarmTimer(alarm);
          }
        }
      }
    }).catch(() => {});
  }
});

// ── Cache lifecycle ────────────────────────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE_NAME && k !== ASSET_CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => rescheduleAllAlarms()) // re-arm any alarms that survived SW restart
  );
});

// ── Fetch handler ─────────────────────────────────────────────────────────────
function isCacheableApi(url) {
  return CACHEABLE_API_PREFIXES.some(prefix => url.pathname.startsWith(prefix));
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

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  if (isCacheableApi(url)) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached && !isExpired(cached)) {
          fetch(event.request)
            .then(fresh => cacheApiResponse(event.request, fresh))
            .catch(() => {});
          return cached;
        }
        return fetch(event.request)
          .then(response => cacheApiResponse(event.request, response))
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

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const shell =
            await caches.match(new URL(BASE + "index.html", self.location).href)
            || await caches.match(new URL(BASE, self.location).href);
          return shell || new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  if (url.pathname.startsWith(BASE + "assets/")) {
    event.respondWith(
      caches.open(ASSET_CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        });
      })
    );
    return;
  }

  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf)$/)) {
    event.respondWith(
      caches.open(ASSET_CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached || new Response("", { status: 404 }));
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ── Push notifications ─────────────────────────────────────────────────────────
self.addEventListener("push", event => {
  let data = {
    title: "Mission Distinction",
    body: "You have a new notification",
    url: BASE,
    icon: BASE + "icon-192.png",
  };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch {}
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

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", event => {
  const action = event.action;
  const nData = event.notification.data || {};

  event.notification.close();

  // Alarm "Dismiss" action — just stop; don't open the app
  if (action === "dismiss" && nData.type === "alarm") {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          client.postMessage({ type: "ALARM_DISMISS", alarmId: nData.alarmId });
        }
      })
    );
    return;
  }

  // Default — open/focus the app
  const targetUrl = nData.type === "alarm"
    ? (BASE + "student/tools")
    : (nData.url || BASE);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
