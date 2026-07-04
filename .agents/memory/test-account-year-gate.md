---
name: Test account year/session gating to reach student dashboard
description: Why a freshly registered test student can get redirected to /coming-soon instead of /student/dashboard
---

Login only lands on `/student/dashboard` if the student's `year` and `sessionYear` exactly match the app's currently active cohort (`ACTIVE_MBBS_YEAR` / `ACTIVE_SESSION_YEAR` in `artifacts/mission-distinction/src/lib/colleges.ts`, e.g. `"1st Year"` / `"2025-26"`). Any other value (including plausible-looking ones like `"1st"`) routes to `/coming-soon` instead.

**Why:** The product currently only serves 1st Year MBBS for one active session; other years/sessions show a waitlist page. This is easy to trip over when creating temp test accounts via the register API, since the field accepts any string with no validation error.

**How to apply:** When creating temp/test student accounts (via API or SQL) for e2e testing, always set `year`/`session_year` to the current values in `colleges.ts` before asserting dashboard access — otherwise the test will falsely "fail" on an unrelated coming-soon redirect.
