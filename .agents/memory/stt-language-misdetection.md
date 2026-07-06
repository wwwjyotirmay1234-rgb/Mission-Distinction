---
name: STT language auto-detection can misfire on faint/noisy audio
description: Why a student's spoken English answer showed up transcribed in a random foreign script (e.g. Urdu) in the AI Viva Simulator.
---

`speechToText()` (lib/integrations-openai-ai-server/src/audio/client.ts, gpt-4o-mini-transcribe) did not pass a `language` param, so the model auto-detects the spoken language per-request. On short, faint, or noisy clips (like a real-but-quiet mic answer past `isSilentAudio`'s peak-volume gate) it can misidentify the language entirely and transcribe plausible-looking garbage in that language's script (e.g. Urdu) instead of the actual English speech.

**Why:** This is a different failure mode than `stt-silence-hallucination.md` (fabricating filler text from true silence) — here real speech exists but the language ID step picks the wrong language, so `isHallucinatedTranscript`'s repetition-based check doesn't catch it since the fake text isn't repetitive.

**How to apply:** Any new `speechToText`/`speechToTextStream` call site for an app where the spoken language is known (e.g. English-medium exam) must pass `language: "en"` (or the appropriate ISO-639-1 code) explicitly rather than relying on auto-detect.
