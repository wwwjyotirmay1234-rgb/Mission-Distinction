---
name: ffmpeg missing as system dependency
description: "spawn ffmpeg ENOENT" in production/dev for audio conversion (webm/mp4/ogg -> wav) means ffmpeg was never declared as a Nix system dependency, even if it happens to resolve in an interactive shell.
---

`child_process.spawn("ffmpeg", ...)` (used by `ensureCompatibleFormat`/`convertToWav` in the OpenAI audio integration libs) threw `ENOENT` because `ffmpeg` was not declared as a project dependency — it only appeared in the interactive shell's PATH via an ambient nix-store runtime path, which is not guaranteed to exist for the actual server process or in production deploys.

**Why:** binaries available in the Replit shell tool are not necessarily available to the app's own process/deployment unless declared via `replit.nix` / `installSystemDependencies`. Relying on "it works when I run `which ffmpeg`" is not sufficient evidence.

**How to apply:** for any `spawn`/`exec` of an external binary (ffmpeg, imagemagick, jq, etc.), use the package-management skill's `installSystemDependencies({ packages: [...] })` (adds to `replit.nix`) rather than assuming it's present. Verify the fix with a direct `child_process.spawn` test from Node (not just a shell `which`/`-version` check), since that's what actually mirrors the app's runtime.
