---
name: Practical Hub — single-subject viva selection
description: Practical Hub used to force all 3 subjects back-to-back; now student picks one via dropdown
---

The Practical Hub viva flow was redesigned from "always run Anatomy → Physiology → Biochemistry back-to-back in one session" to "student picks ONE subject via a dropdown, does a full viva on just that subject, then can start another session for a different subject."

**Why:** As the question bank per subject grows ("many things in each subject"), forcing a fixed 3-subject marathon session doesn't scale well for focused practice — a dropdown lets the flow extend to more subjects/electives later without UI rework, and lets students target weak areas directly.

**How to apply:** The frontend (`PracticalHub.tsx`) and backend AI examiner persona/greeting text (`practicalHub.ts`, `buildExaminerPersona`) both encode assumptions about the session shape ("section X of Y", "move to the next subject"). Whenever this flow changes again, grep both files for "section"/"next subject"/subject-array-indexing language — the two must stay in sync or the AI examiner's spoken script will contradict what the UI shows.
