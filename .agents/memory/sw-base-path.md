---
name: SW base path for production
description: How to make sw.js path-matching work at both / (dev) and /mission-distinction/ (prod).
---

## Rule
Derive the base path dynamically in `sw.js`:
```javascript
const BASE = new URL("./", self.location).pathname;
// dev  → "/"
// prod → "/mission-distinction/"
```
Then use `BASE` for all path checks:
- Assets: `url.pathname.startsWith(BASE + "assets/")`
- Nav fallback: `caches.match(new URL(BASE + "index.html", self.location).href)`
- Static pre-cache: `[BASE, BASE + "index.html"]`

## Why
Vite builds assets to `/mission-distinction/assets/*.js` in production (base path configured). The old SW checked `/assets/` which never matched → nothing was cached → offline mode was entirely broken. The navigation fallback used `/index.html` which also didn't exist at that path.

## How to apply
Never hardcode `/assets/` or `/index.html` in sw.js. Always prefix with `BASE`. Also remove any duplicate SW registration in `index.html` that uses a hardcoded `/sw.js` path — only the `main.tsx` registration with `${import.meta.env.BASE_URL}sw.js` is correct.
