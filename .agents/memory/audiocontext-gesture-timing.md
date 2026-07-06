---
name: AudioContext must be created inside the synchronous user-gesture stack
description: Delaying AudioContext creation with an awaited setTimeout (or other async gap) after a click causes silent, error-free audio playback failure on Safari/iOS and strict-autoplay Chrome.
---

Creating (or resuming) a Web Audio `AudioContext` only counts as "tied to a user gesture" if it happens synchronously within the same call stack as the triggering click/tap event. If any `await` (e.g. a scripted delay like an "entrance beat" `setTimeout`) runs *before* `new AudioContext(...)`, the browser no longer considers it gesture-triggered — Safari/iOS (and increasingly Chrome) will create the context in a permanently `suspended` state. Playback code that pushes audio into it does not throw or warn; it just produces no sound.

**Why:** Found while investigating a vague "the AI voice is broken" report in Mission Distinction's Practical Hub voice viva. The backend SSE endpoint was verified healthy via direct curl (full audio stream in ~3.6s), and the AudioContext/AudioWorklet playback code was architecturally correct — but `playback.init()` (which does `new AudioContext(...)`) was only called from inside the SSE-streaming function, which itself ran after an `await new Promise(setTimeout, ~1.8s)` "entrance beat" following the click. That gap silently broke the gesture chain.

**How to apply:** Any feature that creates/resumes an `AudioContext` in response to a button click must call the init/unlock function synchronously at the very top of the click handler, before any `await`. If the surrounding flow needs a scripted delay (loading screens, "connecting" animations, etc.), kick off `audioContext` creation immediately and let the delay run in parallel — never sequence the delay before the context creation.
