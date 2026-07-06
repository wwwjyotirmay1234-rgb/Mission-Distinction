---
name: Samsung Internet never fires beforeinstallprompt
description: Samsung Internet browser frequently never dispatches the beforeinstallprompt event even on a fully installable PWA — code relying solely on that event to enable an Install button will leave it permanently disabled/no-op for these users.
---

Samsung Internet (Android) has long-standing, version-inconsistent bugs where it does not fire `beforeinstallprompt` at all, even when a page passes every installability criterion (valid manifest, HTTPS, registered service worker with a fetch handler). Any Install button gated purely on `deferredPrompt` being set will look broken to these users — not disabled with an error, just permanently inert.

**Why:** A user reported "Install option not showing" specifically on Samsung browser. All other diagnostics (manifest correctness, base-path templating, iframe testing context) were ruled out first; the actual cause was Samsung Internet's own unreliable event firing.

**How to apply:** Detect Samsung Internet via UA (`/SamsungBrowser/i`) and treat it like iOS — show manual "Tap menu (☰) → Add page to → Home screen" instructions as a fallback whenever no `beforeinstallprompt` event has arrived, rather than leaving the button waiting indefinitely. Still prefer the native prompt if it does fire (some versions support it).
