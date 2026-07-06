---
name: Viva examiner voices are gender-locked
description: How spoken voice is assigned per named AI examiner in the practical viva simulator.
---

The audio viva panel is presented to students as one named examiner per subject (`EXAMINER_NAMES`), and each name has a fixed real-world gender: Dr. Aswini (Anatomy) and Dr. Rajiv (Physiology) are male; Dr. Madhu (Biochemistry) is female with a warm/sweet voice.

`streamExaminerAudioTurn()` in `artifacts/api-server/src/routes/practicalHub.ts` takes the OpenAI `gpt-audio` voice as an explicit parameter — there is no hardcoded default baked into the function anymore. The mapping lives in `EXAMINER_VOICE` (onyx/echo for the two male examiners, nova for the female examiner) and both call sites (`/viva/start-voice` and `/viva/turn-voice`) must pass `EXAMINER_VOICE[subject]`.

**Why:** Previously every examiner used the same hardcoded "onyx" voice regardless of the character's name/gender, which sounded wrong for Dr. Madhu.

**How to apply:** If a new subject/examiner is added, add both a `EXAMINER_NAMES` entry and a matching `EXAMINER_VOICE` entry (pick from the lib's supported set: alloy, echo, fable, onyx, nova, shimmer) consistent with that examiner's stated gender/character.
