---
name: Mobile PWA lessons
description: Hard-won mobile/PWA fixes for Mission Distinction — auth, PDF viewing, service worker, viewport
---

## JWT expiry causes "login again and again"
**Rule:** JWT_EXPIRES_IN was "15m" — too short for mobile users. Set to "7d".
**Why:** Mobile browsers don't always send the refresh cookie reliably (especially from PWA home-screen shortcuts), so short-lived tokens get users kicked out constantly.
**How to apply:** Keep JWT_EXPIRES_IN at "7d". The refresh token (30d, httpOnly cookie) handles rotation for active sessions.

## Google login on mobile: skip popup, use redirect + onAuthStateChanged fallback
**Rule:** On mobile (`/Mobi|Android|iPhone|iPad/i`), call `signInWithRedirect` directly. Also add an `onAuthStateChanged` fallback for when `getRedirectResult` drops the auth event.
**Why:** Mobile browsers block popups. Additionally, iOS (ITP) and some Android browsers silently throw `auth/no-auth-event` from `getRedirectResult` — the user IS signed into Firebase but the backend never gets notified, causing "multiple attempts needed". Firebase still has the user in local persistence, so `onAuthStateChanged` catches them.
**How to apply:** In the `useEffect`, after `getRedirectResult`, if `redirectPending===true` register an `onAuthStateChanged` listener. Guard with a `handledByRedirectResult` flag + 500ms delay so `getRedirectResult` gets first pick. Only call `finishGoogleAuth` once. Unsubscribe on cleanup.

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
