---
name: Voice viva SSE endpoints and e2e testing
description: Practical Hub voice viva endpoints stream large audio+transcript SSE payloads; browser e2e tests can misreport them as stuck/broken
---

The Practical Hub voice viva endpoints (`/api/practical-hub/viva/start-voice`, `/viva/turn-voice`) respond with a Server-Sent Events stream mixing `{"type":"transcript",...}` text chunks and `{"type":"audio",...}` base64 PCM chunks — the audio chunks dominate the payload (often 500KB+ per turn).

**Why:** The automated browser e2e testing tool has flagged this as "stuck at Connecting to the examiner..." / a false backend failure, when the backend was actually responding correctly (HTTP 200, correct transcript content) — the large streaming payload just doesn't render live fast enough in that test harness.

**How to apply:** When an e2e test reports a voice viva session stuck/not responding, don't trust it as a backend bug on its own. Verify independently first: log in via curl to get a JWT (`POST /api/auth/student/login`), then `curl -N -X POST .../viva/start-voice` with that token and inspect the raw SSE output directly (`grep -o '"type":"transcript","data":"[^"]*"'` to reconstruct the spoken text). Only treat it as a real bug if the direct curl call also fails or returns wrong content.
