---
name: Speech-to-text hallucinates on silent audio
description: gpt-4o-mini-transcribe (and Whisper-family STT models generally) can return a plausible-sounding transcript for silent/near-silent audio instead of empty text — this can produce fake scored answers for students who never spoke.
---

Symptom: a user records no real answer (stays silent, mic issue, etc.) but the viva/exam scoring flow shows a fabricated "Your answer: ..." that closely matches the ideal answer and gets partial/full credit — while a separate cross-check AI opinion correctly reports "no student response in transcript". This is STT hallucination, not a scoring-prompt bug: the transcript text itself was invented by the transcription model.

**Why:** Whisper-family STT models are trained to always emit *some* text and are known to hallucinate plausible content from silence/noise rather than returning `""`. Checking `if (!transcript)` after transcription does not catch this — the hallucinated text is non-empty.

**How to apply:** for any voice-answer pipeline (viva, oral exam, dictation, etc.), screen the raw/converted audio for silence *before* calling the transcription API — e.g. ffmpeg's `volumedetect` filter, treating `mean_volume` below roughly -50dB as no real speech — and short-circuit with a "no speech detected" response instead of transcribing. Do this in the same lib that owns audio format conversion (see `ensureCompatibleFormat`/`isSilentAudio` in `lib/integrations-openai-ai-server/src/audio/client.ts`) so every caller gets the guard for free.
