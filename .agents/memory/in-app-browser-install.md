---
name: In-app browser PWA install detection
description: Why install prompts must special-case WhatsApp/Instagram/Facebook in-app browsers, and where the shared detector lives.
---

Students share study-app links in WhatsApp groups constantly. Tapping those links opens WhatsApp/Instagram/Facebook's built-in in-app browser (webview), which can **never** trigger `beforeinstallprompt` or expose the OS share-sheet — so a generic "Install" button silently does nothing there.

**Why:** without detecting this, users in the single most common real-world entry path (a shared WhatsApp link) see an install UI that appears to work but never installs anything, with no explanation.

**How to apply:** detect in-app browsers via UA sniffing (FBAN/FBAV/Instagram/LinkedInApp/Snapchat/Line/MicroMessenger/GSA tokens, Android `wv` flag, or iOS webview without `safari` token) before showing any install CTA, and branch to "open in Chrome/Safari" instructions instead. In this project the shared detector lives in `artifacts/mission-distinction/src/lib/browserEnv.ts` (`isInAppBrowser`, `isIOSDevice`, `isStandaloneDisplay`) — reuse it rather than re-deriving UA regexes per component (it was previously duplicated between the push-notification hook and the install prompt).
