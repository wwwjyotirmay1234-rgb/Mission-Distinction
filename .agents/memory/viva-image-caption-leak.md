---
name: Viva image caption answer leak
description: Physiology apparatus/specimen image data revealed the identification answer directly to the student.
---

`physiologyHematologyImages.ts` and `physiologyClinicalImages.ts` (Physiology station image data, keyed by `PhysiologyClinicalImage`) each entry's `topic` and `caption` fields name the apparatus/specimen directly (e.g. "Westergren tube and stand for ESR estimation..."). The AI examiner's first question at an image station is a spot-identification question ("what is this?"), so showing that same name/caption text to the student on screen handed them the answer before they even attempted it.

Fix: each entry now also has a `displayCaption` — an instruction ("Identify the apparatus shown, explain the procedure...") that never names the object — used only in the frontend Card. The original `caption` (with the name) is unchanged and still sent to the backend (`imageCaption` in the viva start/turn API calls) so the AI examiner has full context to phrase its question and grade the answer.

**Why:** the backend genuinely needs the real name to build a correct persona/question; only the student-facing UI needed the leak removed.

**How to apply:** any new apparatus/specimen image data added to these files (or a similar pattern elsewhere, e.g. anatomy spotter images) must include a non-revealing `displayCaption`/label for anything shown on the student's screen — never render the raw identification-bearing `caption`/`topic` field directly in a station where the AI is testing recognition of that same object.
