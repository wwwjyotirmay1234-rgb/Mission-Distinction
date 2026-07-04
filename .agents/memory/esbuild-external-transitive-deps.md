---
name: esbuild external list needs the consuming artifact's own dependency, not just the lib package's
description: Why "Cannot find package" ERR_MODULE_NOT_FOUND crashes appear at runtime for a package that IS installed, when api-server's build.mjs externalizes it
---

`artifacts/api-server/build.mjs` externalizes several native/SDK packages (e.g. `@google/*`, `@aws-sdk/*`) instead of bundling them, so at runtime Node resolves them via normal `node_modules` lookup from `dist/index.mjs`'s location.

If a shared `lib/*` package (e.g. `lib/integrations-gemini-ai`) depends on one of those externalized packages (e.g. `@google/genai`) but api-server itself does NOT declare it as a direct dependency, pnpm's strict `node_modules` won't make it resolvable from api-server's install tree — the build succeeds but the server crashes on boot with `ERR_MODULE_NOT_FOUND`.

**Why:** esbuild's `external` list skips bundling, so the transitive dependency chain (api-server → lib/integrations-gemini-ai → @google/genai) that TypeScript/bundling normally resolves is *not* enough at pure Node runtime resolution — only api-server's own declared deps are guaranteed hoisted/linked into its resolution path.

**How to apply:** Whenever you wire a new `lib/*` integration package into api-server (or any artifact with a similar esbuild `external` list) and that package's own dependency also appears in the `external` array, add that dependency directly to the consuming artifact's `package.json` too, then `pnpm install`, before trusting a clean typecheck to mean the server will actually boot.
