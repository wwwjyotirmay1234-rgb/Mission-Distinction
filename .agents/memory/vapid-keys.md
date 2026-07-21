---
name: Push VAPID key storage
description: How VAPID keys are generated and stored for web push notifications
---

## Rule
VAPID keys are generated once via `webpush.generateVAPIDKeys()` on first server startup and stored in the `app_settings` table as `vapid_public_key` and `vapid_private_key`. The public key is exposed unauthenticated at `GET /api/push/vapid-key`.

**Why:** This avoids requiring manual env var setup. Keys persist across server restarts via the DB.

**How to apply:** If VAPID keys need rotation, delete the rows in `app_settings` where `key IN ('vapid_public_key', 'vapid_private_key')` and restart the server.
