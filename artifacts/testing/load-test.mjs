#!/usr/bin/env node
/**
 * Mission Distinction — API Load Test
 *
 * Usage:
 *   node artifacts/testing/load-test.mjs
 *
 * Environment variables:
 *   API_URL     Base URL of the API (default: http://localhost:8080)
 *   CONCURRENT  Number of concurrent workers (default: 20)
 *   DURATION    Test duration in seconds (default: 10)
 *
 * Exit codes:
 *   0 — passed (error rate < 1%, p95 < 2000ms)
 *   1 — failed
 */

const API_BASE = process.env.API_URL ?? "http://localhost:8080";
const CONCURRENT = parseInt(process.env.CONCURRENT ?? "20");
const DURATION_MS = parseInt(process.env.DURATION ?? "10") * 1000;

// ─── Endpoints under test ──────────────────────────────────────────────────
const PUBLIC_ENDPOINTS = [
  { method: "GET", path: "/api/quizzes" },
  { method: "GET", path: "/api/announcements" },
  { method: "GET", path: "/api/leaderboard" },
];

// ─── Metrics ───────────────────────────────────────────────────────────────
let completed = 0;
let errors = 0;
const latencies = [];
let running = true;
const startTime = performance.now();

// ─── Single request ────────────────────────────────────────────────────────
async function singleRequest() {
  const ep = PUBLIC_ENDPOINTS[Math.floor(Math.random() * PUBLIC_ENDPOINTS.length)];
  const t0 = performance.now();
  try {
    const res = await fetch(`${API_BASE}${ep.path}`, {
      method: ep.method,
      signal: AbortSignal.timeout(5000),
    });
    const ms = performance.now() - t0;
    latencies.push(ms);
    if (res.status >= 500) errors++;
    completed++;
  } catch {
    errors++;
  }
}

// ─── Worker loop ───────────────────────────────────────────────────────────
async function worker() {
  while (running) {
    await singleRequest();
  }
}

// ─── Run ───────────────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════");
console.log("     Mission Distinction — Load Test");
console.log("═══════════════════════════════════════════");
console.log(`Target     : ${API_BASE}`);
console.log(`Concurrency: ${CONCURRENT} workers`);
console.log(`Duration   : ${DURATION_MS / 1000}s`);
console.log("───────────────────────────────────────────\n");

const stopTimer = setTimeout(() => { running = false; }, DURATION_MS);

const workers = Array.from({ length: CONCURRENT }, () => worker());
await Promise.all(workers);
clearTimeout(stopTimer);

// ─── Results ───────────────────────────────────────────────────────────────
const elapsed = (performance.now() - startTime) / 1000;
const total = completed + errors;
const errorRate = total > 0 ? (errors / total) * 100 : 0;
const rps = Math.round(completed / elapsed);

const sorted = [...latencies].sort((a, b) => a - b);
const avg = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
const p50 = sorted[Math.floor(sorted.length * 0.50)] ?? 0;
const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;
const min = sorted[0] ?? 0;
const max = sorted[sorted.length - 1] ?? 0;

console.log("═══════════════════════════════════════════");
console.log("          RESULTS");
console.log("═══════════════════════════════════════════");
console.log(`Requests completed   : ${completed}`);
console.log(`Errors (5xx/network) : ${errors}`);
console.log(`Error rate           : ${errorRate.toFixed(2)}%`);
console.log(`Duration             : ${elapsed.toFixed(1)}s`);
console.log(`Throughput           : ${rps} req/s`);
console.log("───────────────────────────────────────────");
console.log(`Avg latency          : ${avg.toFixed(1)}ms`);
console.log(`Min latency          : ${min.toFixed(1)}ms`);
console.log(`p50 latency          : ${p50.toFixed(1)}ms`);
console.log(`p95 latency          : ${p95.toFixed(1)}ms`);
console.log(`p99 latency          : ${p99.toFixed(1)}ms`);
console.log(`Max latency          : ${max.toFixed(1)}ms`);
console.log("═══════════════════════════════════════════");

// ─── Pass / Fail ───────────────────────────────────────────────────────────
let failed = false;

if (errorRate > 1) {
  console.error(`\n❌ FAIL — error rate ${errorRate.toFixed(2)}% exceeds 1% threshold`);
  failed = true;
}
if (p95 > 2000) {
  console.error(`\n❌ FAIL — p95 latency ${p95.toFixed(0)}ms exceeds 2000ms SLA`);
  failed = true;
}
if (rps < 10) {
  console.error(`\n❌ FAIL — throughput ${rps} req/s is critically low`);
  failed = true;
}

if (!failed) {
  console.log("\n✅ PASS — error rate < 1%, p95 < 2000ms, throughput acceptable");
}

process.exit(failed ? 1 : 0);
