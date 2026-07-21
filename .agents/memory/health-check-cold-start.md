---
name: Autoscale health-check cold-start false failure
description: A deployment "failed to publish" build where the app was actually fine — the promote-step health checker gave up too fast during a slow cold start.
---

A promote-step failure (build succeeds, but deployment marked "failed") can happen even when the app has no code bug: the health checker retries the startup probe (e.g. `/api/healthz`) only for a short window right after container start, and gives up if the process is slow to bind/warm up on that particular cold start — even though the same process would have returned 200 seconds later.

**Why:** Observed in production runtime logs — several rapid `healthcheck failed ... status 500` lines within under a second of container start, then total silence, then the app served a normal 200 about a minute later. The old (previously-promoted) version kept serving traffic the whole time, so users saw no outage.

**How to apply:** Before assuming a code regression, verify:
1. Old version is still live and healthy (`curl` the production health path) — if yes, no user impact yet.
2. Run the exact production build/run command locally (`node --enable-source-maps dist/index.mjs` with prod env) and hammer the health path every ~100-200ms from process start — confirm it reaches 200 reasonably fast (single digit seconds) with no 500s in between (only connection-refused before listen, then a clean 200).
3. If local repro is clean, treat it as a transient cold-start/infra flake, not a bug — no code fix needed, just retry the publish (`suggestDeploy`).
4. If local repro reproduces real 500s (not just connection-refused) before the app is ready, that points to a genuine startup-ordering bug (e.g. middleware/route registered before some blocking init) — fix that instead.
