---
name: Vite manualChunks and Three.js / R3F
description: Adding Three.js to manualChunks promotes it from async to sync, crashing mobile with "tt.useLayoutEffect undefined"
---

## Rule
**Never add Three.js / @react-three/fiber / @react-three/drei to `manualChunks` in vite.config.ts.**

AnatomyHub is loaded via `React.lazy()` in App.tsx. This means Three.js is only reachable through a dynamic import boundary and Rollup naturally places it in an async chunk. Adding it to `manualChunks` promotes it to a *synchronous* named chunk (`vendor-three`), which breaks the React loading order on mobile browsers.

**Why:** When `manualChunks` creates a named synchronous chunk for Three.js, Rollup generates cross-chunk imports where `vendor-three` references React (via R3F's `import * as React` namespace import). If React lives in `vendor-misc` (which may contain many other deps), any circular dependency or evaluation ordering issue causes `React` (minified as `tt`) to be `undefined` at evaluation time — resulting in `TypeError: undefined is not an object (evaluating 'tt.useLayoutEffect')` on every page load, not just the Anatomy page.

**How to apply:** Leave Three.js out of `manualChunks` entirely. Rollup + Vite correctly keep it async as part of the AnatomyHub lazy chunk. Only add a `vendor-three` entry if you can confirm nothing in the synchronous bundle graph imports it AND you fully control the loading order (e.g. `<link rel="modulepreload">`).

Same rule applies to any large library that is *only* imported behind a `React.lazy()` boundary — let Rollup manage it as async.
