---
name: Local vision model loading
description: Constraint and fallback for browser-only MediaPipe features in this workspace
---

Browser-only MediaPipe features can use the published vision bundle and model files at runtime when the package firewall prevents linking the package directly into an artifact. Keep the video local, load the WASM/model assets from the CDN after an explicit user action, and provide a clear fallback if the model cannot load.

**Why:** The package was present in the workspace's transitive pnpm store but direct package installation was blocked, while Rollup rejects unresolved static imports.

**How to apply:** Use a Vite-ignored dynamic import with a local ambient module declaration, and never treat a failed optional detector as permission to upload camera frames or silently claim detection is active.