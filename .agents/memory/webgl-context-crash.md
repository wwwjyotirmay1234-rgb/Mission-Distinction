---
name: WebGL context creation crash
description: Three.js/R3F throws synchronously when a browser can't create a WebGL context; must feature-detect + error-boundary, not just trust <Canvas> to degrade gracefully
---

Some devices/browsers (low-end phones, in-app webviews, hardware acceleration
disabled, too many WebGL contexts already open in the page) cannot create a
WebGL context at all. `THREE.WebGLRenderer`'s constructor throws synchronously
in that case, which React Three Fiber does not catch on its own — it crashes
the whole component tree unless the app catches it.

**Why:** Surfaced via a Sentry production error ("Error creating WebGL
context") on a 3D viewer page. `<Canvas>` alone provides no fallback for
context-creation failure.

**How to apply:** Any R3F `<Canvas>` mount should:
1. Feature-detect up front — create a throwaway `<canvas>`, try
   `getContext("webgl2")` / `"webgl"` / `"experimental-webgl")`, cache the
   boolean result — and skip mounting `<Canvas>` entirely if unsupported.
2. Also wrap `<Canvas>` in a React error boundary as a safety net, since some
   browsers only fail at the "real" renderer creation stage, not the cheap
   probe.
3. Show a plain-language fallback UI in both cases instead of a blank/crashed
   screen.
4. Consider `gl={{ failIfMajorPerformanceCaveat: false }}` so software/degraded
   rendering still gets a context, and a `webglcontextlost` listener
   (`e.preventDefault()`) so a GPU driver reset doesn't silently freeze the
   viewer.
