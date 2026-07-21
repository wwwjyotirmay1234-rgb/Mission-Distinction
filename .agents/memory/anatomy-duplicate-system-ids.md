---
name: Anatomy system ids must be unique
description: ANATOMY_SYSTEMS array had two entries sharing one id ("digestive"), which silently breaks any id-keyed lookup or system-first (non-region) navigation.
---

`anatomyData.ts`'s `ANATOMY_SYSTEMS` is a flat array of top-level systems, each with an `id` used as the lookup key everywhere (`SYSTEM_COLORS[system.id]`, `REGION_SYSTEM_IDS`, section-label maps). Two entries had the same id ("digestive") — one general GI tract, one abdominal viscera/liver specifically. Region-filtered browsing masked this (each region's list only referenced one of them), but any feature that lists/finds systems by id directly (e.g. a system-first "By System" picker) would only ever surface the first match.

**Why:** Discovered while adding an InnerBody.com-style "browse by system directly" mode — the moment systems are addressed by id outside the region-filter path, duplicate ids become a real, user-visible bug (missing/unreachable system).

**How to apply:** Before adding any new id-keyed system lookup/UI, grep `ANATOMY_SYSTEMS` for duplicate `id:` values first. If content is legitimately distinct (e.g. "abdominal viscera" vs "general digestive tract"), give it its own id, add matching entries in `SYSTEM_COLORS` and any region/section-label maps in `AnatomyHub.tsx` and `CadavericGallery.tsx`.
