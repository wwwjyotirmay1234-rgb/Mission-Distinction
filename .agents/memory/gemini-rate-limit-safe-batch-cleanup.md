---
name: Gemini rate-limit-safe resumable batch cleanup
description: Pattern for running a slow per-row AI cleanup pass (e.g. label-erasing) over many DB rows without losing progress to rate limits.
---

When running an AI edit/verify pass (e.g. Gemini image label-erasing) over hundreds of existing DB rows via a background admin route:

- Query eligibility directly from the DB by absence of a "done" marker in a status/notes field (e.g. `notes NOT LIKE '%AI-cleaned%'`), not from an in-memory list, so the job is resumable across restarts/crashes.
- Keep concurrency low (~3) for paid AI edit calls — 8-way concurrency triggered mass `RATELIMIT_EXCEEDED` failures on Gemini even though the account otherwise looked fine.
- Wrap every AI call in retry-with-backoff scoped specifically to rate-limit errors (check error code/message for `RATELIMIT_EXCEEDED`), not a generic catch-and-continue.
- **Why:** the dangerous failure mode is an outer `catch` that treats a transient rate-limit exception the same as a genuine content failure and writes the "done" marker anyway — this permanently hides ~90% of rows from all future retry runs since they now match the "already processed" filter.
- **How to apply:** verify a thrown/caught error is truly a terminal failure (content rejected, no image returned) before writing any "done"/"processed" note; a caught exception from the API layer itself should NOT set that marker, so the row remains eligible for retry.
