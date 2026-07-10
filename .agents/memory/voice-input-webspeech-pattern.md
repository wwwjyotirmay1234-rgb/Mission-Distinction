---
name: Browser Web Speech API voice input pattern
description: Reusable client-side mic dictation pattern (no backend) for chat-style text inputs
---

For "let the user speak instead of type" on a chat/text input, reuse the browser's native `SpeechRecognition` / `webkitSpeechRecognition` API — no server round-trip, no ffmpeg/Whisper needed. Already used in `MeddyAssistant.tsx` (one-shot) and `Doubts.tsx` AI chat tab (continuous + interim results).

**Why:** This app's other STT (Practical Hub voice viva) is server-side Whisper-based because it needs full audio grading/analysis. For simple "dictate then edit/send" text-input use cases, that's overkill — the Web Speech API gives free, real-time, in-browser transcription with zero backend cost.

**How to apply:**
- Feature-detect: `const hasVoice = !!(window.SpeechRecognition || window.webkitSpeechRecognition)`. Hide the mic button entirely if unsupported (Firefox/older Safari) rather than showing a broken button.
- Set `rec.lang = "en-IN"` to match this app's Indian-English user base.
- For short one-shot dictation (`interimResults=false`), take `results[0][0].transcript` directly.
- For longer dictation (continuous doubts/questions), use `interimResults=true` + `continuous=true`, track a `baseTextRef` (already-finalized text) separately from live interim text, and append rather than overwrite — otherwise each `onresult` event clobbers prior speech.
- Always wire `onerror`/`onend` to reset the `listening` state, or a stuck "listening…" UI persists after silence/network errors.
- No new memory needed for this — it's a well-contained client-only pattern, safe to copy verbatim into future chat inputs.
