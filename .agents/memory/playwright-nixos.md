---
name: Playwright NixOS environment constraint
description: Why Playwright browser tests can't run in Replit's NixOS sandbox, and what does work.
---

# Playwright NixOS environment constraint

Playwright's headless Chromium shell binary requires `libglib-2.0.so.0`, which is not present in Replit's NixOS sandbox path. The binary exits with code 127 on launch.

**What passes:** Pure fetch-based tests (`async ()` — no `{ page }` fixture) run fine under the `[chromium]` project because they never actually launch a browser.

**What fails:** Any test using `{ page }`, `{ browser }`, or `{ context }` fixture.

**Why:** `replit.nix` doesn't exist; the `.replit` file uses `[nix] channel = "stable-25_05"` but doesn't include chromium or glib deps.

**How to apply:** Write critical flow assertions as pure fetch/API tests. Use the screenshot tool for visual verification of browser rendering. Mark browser test failures in CI with `skip_validation_reason` when they fail due to this constraint.
