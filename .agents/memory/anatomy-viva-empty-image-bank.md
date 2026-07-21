---
name: Anatomy viva empty-image-bank fallback
description: What happens (and how it must be phrased) when a student picks an Anatomy Viva spotter category with no extracted specimen photos yet
---

The 5 Anatomy Viva spotter categories (Histology, Bone, Visceral, Section Anatomy, Prosection) each draw from a `anatomy_viva_images` bank populated only via admin-triggered AI extraction from uploaded PDFs (Admin → Anatomy Viva Images → pick a book → Extract). Categories with zero extracted images (e.g. Bone had 0 while Prosection/Histology/Visceral had some) hit a code fallback in `buildExaminerPersona()` in `artifacts/api-server/src/routes/practicalHub.ts`.

**Why it matters:** the fallback prompt text must never claim a specimen is "in front of you" / "displayed on screen" when no `station_image` SSE event was actually sent — the student sees nothing, so that phrasing is a straight-up lie that confuses them mid-viva. The fallback must explicitly frame the station as an ORAL clue-based question instead (state that there's no specimen today, then give concrete identifying clues) so what's said always matches what's rendered.

**How to apply:** if asked to fix/adjust anatomy spotter viva behavior for a specific category, first check `SELECT category, count(*) FROM anatomy_viva_images GROUP BY category;` — an empty count for that category means you're in fallback-prompt territory, not image-serving/SSE territory. The real long-term fix requires the admin to upload a category-appropriate atlas PDF and run extraction; the prompt fallback is just an honesty patch, not a substitute for real images.
