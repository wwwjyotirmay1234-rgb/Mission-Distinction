---
name: Viva examiner voices are gender-locked
description: How spoken voice is assigned per named AI examiner in the practical viva simulator.
---

The audio viva panel is presented to students as one named examiner per subject (`EXAMINER_NAMES`), and each name has a fixed real-world gender: Dr. Rajiv (Physiology) is male; Dr. Mamata (Anatomy, a middle-aged lady) and Dr. Madhu (Biochemistry) are female with warm voices.

`streamExaminerAudioTurn()` in `artifacts/api-server/src/routes/practicalHub.ts` takes the OpenAI `gpt-audio` voice as an explicit parameter — there is no hardcoded default baked into the function anymore. The mapping lives in `EXAMINER_VOICE` (echo for the male examiner, shimmer/nova for the two female examiners) and both call sites (`/viva/start-voice` and `/viva/turn-voice`) must pass `EXAMINER_VOICE[subject]`.

Examiner names/voices are ALSO duplicated in the frontend (`artifacts/mission-distinction/src/pages/student/PracticalHub.tsx` EXAMINER_BY_SUBJECT + ENTRANCE_LINES, and `.../admin/VivaQuestionBank.tsx` EXAMINER_NAMES) purely for display/entrance-line text — renaming an examiner requires updating all of these, not just the backend persona map.

**Why:** Previously every examiner used the same hardcoded "onyx" voice regardless of the character's name/gender, which sounded wrong for Dr. Madhu.

**How to apply:** If a new subject/examiner is added, add both a `EXAMINER_NAMES` entry and a matching `EXAMINER_VOICE` entry (pick from the lib's supported set: alloy, echo, fable, onyx, nova, shimmer) consistent with that examiner's stated gender/character.
