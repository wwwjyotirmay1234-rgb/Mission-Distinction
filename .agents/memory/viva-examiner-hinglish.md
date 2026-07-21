---
name: Examiner Hinglish/Odinglish speech
description: How the AI viva examiners mix Hindi/Odia words into their spoken English.
---

`buildExaminerPersona()` in `artifacts/api-server/src/routes/practicalHub.ts` includes a LANGUAGE STYLE rule letting examiners naturally sprinkle in casual Hindi or Odia words/phrases (Hinglish/Odinglish) — but only for small-talk, filler, and informal reactions (e.g. "Theek hai, chalo agla sawaal"), always written in Roman/Latin script, never Devanagari or Odia script.

The actual medical question text and technical/terminology content must always stay in clear English — only the conversational wrapper around it may mix languages. This matters because exact terminology is what's being scored.

**Why:** Real Indian MBBS examiners naturally code-switch this way; a purely robotic all-English tone felt less authentic. But letting the LLM code-switch inside the actual medical question/scoring content would risk ambiguity in what's being asked or evaluated.

**How to apply:** The student-side transcription (`speechToText(..., "en")` in the same file) is still pinned to English regardless of this change — the mixing is examiner-speech-only, not a change to how student answers are transcribed. If a future change lets students answer in Hindi/Odia too, that STT `language` pin would need separate reconsideration.
