---
name: AI Viva Simulator is hard-gated to one email + can't be e2e tested past the mic step
description: Why viva feature tiles look "Locked" for normal test accounts, and why automated browser tests can't reach the mark-sheet screen via real mic interaction.
---

The "AI Viva Simulator" tile in Practical Hub is gated by `VIVA_UNLOCKED_EMAIL` (`www.jyotirmay1234@gmail.com`) directly in `PracticalHub.tsx` — `vivaLocked = user?.email !== VIVA_UNLOCKED_EMAIL`. Any other student account (including freshly registered QA accounts) sees a "Temporarily unavailable" locked tile regardless of role/year/session gating.

Separately, the backend deliberately screens spoken answers for silence before transcribing (STT hallucinates plausible text from silent audio otherwise — see `stt-silence-hallucination.md`). This means an automated Playwright test tapping the mic with no real microphone input never produces a scoreable turn, so `/viva/end` returns no summary and the UI shows "Not enough of a conversation to score" — this is correct behavior, not a bug.

**Why:** Both facts combine to make full e2e testing (mic → real answer → mark-sheet render) impractical for a browser automation agent. The mark-sheet/summary UI has to be verified by calling `POST /api/practical-hub/viva/end` directly with a fabricated `history` array (2+ turns) and checking the JSON shape matches the frontend's expected fields, rather than by driving the mic through the browser.

**How to apply:** When testing or extending the Viva Simulator, (1) use the `VIVA_UNLOCKED_EMAIL` account to unlock the tile, (2) verify summary/mark-sheet rendering via a direct authenticated `curl`/fetch to `/viva/end` with synthetic history instead of trying to complete a real voice turn in an automated test, and (3) if you must log in as that account for testing, treat its password as live — restore/rotate it back to a fresh unknown value afterward rather than leaving a known test password on a real account.
