---
name: PWA install prompt never fires inside an iframe
description: beforeinstallprompt requires a top-level browsing context; testing a PWA install button inside a canvas/embedded iframe preview will always silently fail, and that's expected browser behavior, not an app bug.
---

Browsers (Chrome and others) will not fire `beforeinstallprompt`, and generally won't consider a page "installable," when it's loaded inside an `<iframe>` rather than as the top-level document. This matters specifically in this workspace because the canvas board embeds live app previews via iframes (see `mockup-sandbox`/canvas skill) — if a user checks for an "Install" button while looking at the app through a canvas iframe embed, it will never appear, regardless of whether the manifest/service worker are correctly configured.

**Why:** Investigated a "Install option not showing" report where the user's canvas viewport had the app open as an iframe shape. All PWA install criteria (manifest, icons, service worker, base-path templating) were otherwise correct.

**How to apply:** Before debugging a missing PWA install prompt, first confirm the user is testing in a real top-level browser tab (direct URL or the deployed domain), not an embedded/iframe preview. Also remember iOS Safari never fires `beforeinstallprompt` at all — only Android/desktop Chromium browsers do; iOS only supports manual Share → Add to Home Screen.
