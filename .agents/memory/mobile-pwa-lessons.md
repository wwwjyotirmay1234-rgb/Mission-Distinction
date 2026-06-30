---
name: Mobile PWA lessons
description: Hard-won mobile/PWA fixes for Mission Distinction — auth, PDF viewing, service worker, viewport
---

## JWT expiry causes "login again and again"
**Rule:** JWT_EXPIRES_IN was "15m" — too short for mobile users. Set to "7d".
**Why:** Mobile browsers don't always send the refresh cookie reliably (especially from PWA home-screen shortcuts), so short-lived tokens get users kicked out constantly.
**How to apply:** Keep JWT_EXPIRES_IN at "7d". The refresh token (30d, httpOnly cookie) handles rotation for active sessions.

## Google login: always use signInWithPopup first on ALL platforms
**Rule:** Use `signInWithPopup` on both desktop AND mobile. Only fall back to `signInWithRedirect` if the error code is specifically `auth/popup-blocked`. Keep the `onAuthStateChanged` + `getRedirectResult` useEffect as fallback for the rare redirect case.
**Why:** `signInWithRedirect` + `getRedirectResult` is broken in Chrome 115+ and Safari ITP because both block third-party cookies, which Firebase relies on to relay the auth result back. The result: user completes Google sign-in, is redirected back, but `getRedirectResult` returns null silently. Modern mobile browsers (Chrome on Android, Safari on iOS) DO allow popups triggered by a real user gesture (tap). Switching to popup-first completely bypasses the cookie issue. The "add domain to Firebase" fix kept being needed because redirect was the real silent failure.
**How to apply:** In `handleGoogleSignIn`, call `signInWithPopup` directly. Catch `auth/popup-blocked` → fall back to redirect. Catch `auth/popup-closed-by-user` / `auth/cancelled-popup-request` → reset loading silently. Keep the useEffect `getRedirectResult` + `onAuthStateChanged` chain as a safety net for the redirect fallback path.

## PDF/document viewer on mobile
**Rule:** Google Docs viewer (`docs.google.com/viewer?url=...`) is unreliable on mobile — often blank or "Unable to preview". On mobile, show direct "Read PDF" + "Download" buttons instead.
**Why:** The iframe-based Google Docs viewer requires a redirect chain that breaks in many mobile browsers.
**How to apply:** Detect `isMobile` in PdfViewerModal; show action buttons on mobile, embedded viewer on desktop.

## Service worker: cache Vite hashed assets
**Rule:** Add a dedicated `ASSET_CACHE_NAME` cache for `/assets/*` (Vite content-hashed files) using cache-first strategy.
**Why:** The old SW only cached `/` and `/index.html`. Vite JS/CSS bundles (e.g. `/assets/index-ABC.js`) were never cached so the app couldn't load offline at all.
**How to apply:** In sw.js fetch handler, check `url.pathname.startsWith("/assets/")` → cache-first with `ASSET_CACHE_NAME`.

## index.html pitfalls for PWA
- **no-cache meta tags** (`no-cache, no-store, must-revalidate`) prevent the HTML shell from being cached, breaking offline navigation fallback. Remove them.
- **`maximum-scale=1`** in the viewport meta tag blocks pinch-to-zoom — an accessibility violation. Remove it.
- **SW version query param** (`/sw.js?v=N`) must be bumped whenever sw.js changes, or browsers serve the old cached SW.

## PDF offline reading requires IndexedDB + server proxy
**Rule:** When a user wants to read a PDF offline, the bytes must be stored in IndexedDB (not the download folder). Use a server-side proxy endpoint (`GET /api/pdfs/:id/proxy`) to fetch the PDF bytes server-side (avoids CORS on Google Drive / Cloudinary), then stream the blob to the client and store it via `savePdfBlob(id, blob, title)` in `lib/pdfOfflineCache.ts`.
**Why:** Google Drive and Cloudinary URLs don't support cross-origin `fetch()` from the browser. `window.open(downloadUrl)` saves to the device file system — completely separate from browser storage. The PDF viewer iframe then can't reach those bytes when offline.
**How to apply:** In `PdfViewerModal`: on mount call `getPdfBlob(id)` → if found, `URL.createObjectURL(blob)` and use as `iframe.src`. If offline + no blob, show instructional wall. Add "Save Offline" button that calls `/api/pdfs/:id/proxy` with auth header, reads the response as a stream, builds a `Blob`, calls `savePdfBlob`. Show a small `HardDrive` indicator on saved PDF cards.

## Avatar file input on Android
**Rule:** Use `accept="image/*"` not specific MIME types like `accept="image/jpeg,image/png"`.
**Why:** Some Android phones only show the camera/gallery chooser for `image/*`; specific MIME types suppress it.

## Stale chunk crash after deployment (vite:preloadError)
**Rule:** Add a `vite:preloadError` listener in main.tsx that reloads the page once when a lazy chunk fails to fetch.
**Why:** Every deployment regenerates chunk hashes. Users with cached old HTML try to load old chunk URLs that no longer exist → "Failed to fetch dynamically imported module". One auto-reload fetches fresh HTML with new chunk URLs.
**How to apply:**
```js
window.addEventListener("vite:preloadError", () => {
  const key = "_md_chunk_reload";
  const lastReload = Number(sessionStorage.getItem(key) || "0");
  if (Date.now() - lastReload > 10_000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
});
```
The 10s guard prevents infinite reload loops.

## Production BASE_PATH is "/" not "/mission-distinction/"
**Rule:** Replit's deployment system rebuilds the app using `BASE_PATH="/"` from artifact.toml. Local dev builds use `BASE_PATH=/mission-distinction/`. These produce different chunk hashes — never compare local dist hashes to production hashes.
**Why:** The artifact.toml `[services.env]` sets `BASE_PATH = "/"` for the deployed build. The `/mission-distinction/` prefix is added by Replit's proxy, not baked into the build.

## Google login: always add prompt="select_account"
**Rule:** Set `googleProvider.setCustomParameters({ prompt: "select_account" })` on the GoogleAuthProvider.
**Why:** Without it, if the user has one Google account signed in, they skip the account picker. On shared college devices this silently logs in the wrong person.

## Proactive token refresh threshold must be 24h, not 7d
**Rule:** In `AuthContext`, the on-mount and on-visibility proactive refresh must only fire when `expiresIn < 24 * 60 * 60 * 1000` (24 hours), NOT 7 days.
**Why:** JWT access tokens live for 7 days. A brand-new token (e.g. just issued by Google login) is always "within 7 days of expiry", so a 7-day threshold triggers `doRefresh()` immediately on mount — before `login()` has stored the new refresh token. The single-use refresh token gets consumed, the rotation returns a new one, but the old one from the Google auth response is now invalid. Next refresh attempt gets 400 "Missing refresh token" → `auth:logout` fires → user gets kicked out seconds after Google login.
**How to apply:** Keep the threshold at 24h for both `checkOnMount()` and the `visibilitychange` handler. The `apiFetch` 401 interceptor handles mid-session expiry automatically; the proactive refresh is only needed for truly near-expiry tokens.

## Google-only accounts have empty passwordHash
**Rule:** Guard `verifyPassword` against empty string before calling bcrypt: `if (!hash) return false`.
**Why:** Google sign-up creates users with `passwordHash: ""`. `bcrypt.compare(anything, "")` throws on invalid hash format → 500 crash instead of clean "use Google button" error.
