---
name: Load Test Baseline
description: Performance baseline from the load test script
---

## Baseline (June 2026, localhost, 20 concurrent workers, 10s)
- Throughput: 2032 req/s
- Error rate: 0.00%
- Avg latency: 9.8ms
- p50: 8ms, p95: 20ms, p99: 41ms, max: 148ms

**Test file:** `artifacts/testing/load-test.mjs`
**Endpoints tested:** GET /api/quizzes, /api/announcements, /api/leaderboard

**Thresholds (PASS):** error rate < 1%, p95 < 2000ms, throughput > 10 req/s

**Why:** Localhost results are much better than production; production will add network + Replit proxy latency. p95 of ~200–500ms in production would be reasonable.
