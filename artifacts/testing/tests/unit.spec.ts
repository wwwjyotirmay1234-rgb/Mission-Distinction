import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_URL ?? "http://localhost:8080";

// ── Quiz score computation ─────────────────────────────────────────────────────
// Mirrors the logic in artifacts/api-server/src/routes/quizzes.ts
test.describe("Quiz score computation", () => {
  function computeScore(correct: number, total: number) {
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { score: correct, total, percentage, passed: percentage >= 60 };
  }

  test("perfect score → 100%, passed=true", () => {
    const r = computeScore(10, 10);
    expect(r.percentage).toBe(100);
    expect(r.passed).toBe(true);
  });

  test("zero score → 0%, passed=false", () => {
    const r = computeScore(0, 10);
    expect(r.percentage).toBe(0);
    expect(r.passed).toBe(false);
  });

  test("60% is the exact passing threshold → passed=true", () => {
    const r = computeScore(6, 10);
    expect(r.percentage).toBe(60);
    expect(r.passed).toBe(true);
  });

  test("59% is below threshold → passed=false", () => {
    const r = computeScore(59, 100);
    expect(r.percentage).toBe(59);
    expect(r.passed).toBe(false);
  });

  test("rounds fractional percentage correctly (1/3 → 33%)", () => {
    const r = computeScore(1, 3);
    expect(r.percentage).toBe(33);
    expect(r.passed).toBe(false);
  });

  test("rounds 2/3 → 67% → passed=true", () => {
    const r = computeScore(2, 3);
    expect(r.percentage).toBe(67);
    expect(r.passed).toBe(true);
  });

  test("zero-total quiz → 0% (divide-by-zero guard)", () => {
    const r = computeScore(0, 0);
    expect(r.percentage).toBe(0);
    expect(r.passed).toBe(false);
  });

  test("score and total fields are preserved correctly", () => {
    const r = computeScore(7, 10);
    expect(r.score).toBe(7);
    expect(r.total).toBe(10);
  });
});

// ── Study streak date logic ───────────────────────────────────────────────────
// Mirrors the logic in artifacts/api-server/src/lib/streak.ts
test.describe("Study streak logic", () => {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

  function istDateString(baseMs: number, offsetDays = 0): string {
    const d = new Date(baseMs + IST_OFFSET_MS + offsetDays * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  }

  function computeNewStreak(
    last: string | null,
    today: string,
    yesterday: string,
    currentStreak: number,
  ): number | "no-change" {
    if (last === today) return "no-change";
    if (!last || last < yesterday) return 1;
    return currentStreak + 1;
  }

  test("first-ever activity → streak resets to 1", () => {
    expect(computeNewStreak(null, "2026-06-15", "2026-06-14", 0)).toBe(1);
  });

  test("activity yesterday → streak increments by 1", () => {
    expect(computeNewStreak("2026-06-14", "2026-06-15", "2026-06-14", 5)).toBe(6);
  });

  test("already updated today → no-change (idempotent)", () => {
    expect(computeNewStreak("2026-06-15", "2026-06-15", "2026-06-14", 7)).toBe("no-change");
  });

  test("gap of 2 days breaks streak back to 1", () => {
    expect(computeNewStreak("2026-06-12", "2026-06-15", "2026-06-14", 10)).toBe(1);
  });

  test("streak of 1 → becomes 2 on consecutive day", () => {
    expect(computeNewStreak("2026-06-14", "2026-06-15", "2026-06-14", 1)).toBe(2);
  });

  test("IST date string format is YYYY-MM-DD", () => {
    const baseMs = Date.UTC(2026, 5, 15, 0, 0, 0);
    const result = istDateString(baseMs, 0);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("IST offset: 18:30 UTC = midnight IST = next calendar day in IST", () => {
    const baseMs = Date.UTC(2026, 5, 15, 18, 30, 0); // 18:30 UTC = 00:00 IST on June 16
    expect(istDateString(baseMs, 0)).toBe("2026-06-16");
  });

  test("IST offset: 18:29 UTC still June 15 in IST (23:59 IST)", () => {
    const baseMs = Date.UTC(2026, 5, 15, 18, 29, 59); // 18:29:59 UTC = 23:59:59 IST on June 15
    expect(istDateString(baseMs, 0)).toBe("2026-06-15");
  });
});

// ── parseId utility ───────────────────────────────────────────────────────────
// Mirrors the logic in artifacts/api-server/src/lib/auth.ts
test.describe("parseId utility", () => {
  function parseId(param: string): number | null {
    const id = parseInt(param, 10);
    return isNaN(id) || id <= 0 ? null : id;
  }

  test("valid positive integer '42' → 42", () => expect(parseId("42")).toBe(42));
  test("'1' → 1 (minimum valid id)", () => expect(parseId("1")).toBe(1));
  test("'0' → null (zero is invalid)", () => expect(parseId("0")).toBeNull());
  test("'-1' → null (negative is invalid)", () => expect(parseId("-1")).toBeNull());
  test("'abc' → null (non-numeric)", () => expect(parseId("abc")).toBeNull());
  test("'3.7' → 3 (truncated to integer)", () => expect(parseId("3.7")).toBe(3));
  test("empty string → null", () => expect(parseId("")).toBeNull());
  test("'999999' → 999999 (large valid id)", () => expect(parseId("999999")).toBe(999999));
});

// ── JWT token binding — live API ──────────────────────────────────────────────
test.describe("JWT token structure and refresh rotation", () => {
  test("login response includes valid JWT with uah (user-agent hash) claim", async () => {
    const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "missiondistinction108@gmail.com",
        password: "Mastermind@2004",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user.role).toBe("admin");

    const parts = (body.token as string).split(".");
    expect(parts).toHaveLength(3);

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    expect(payload.userId).toBeGreaterThan(0);
    expect(payload.role).toBe("admin");
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
    expect(payload.uah).toBeDefined();
    expect(typeof payload.uah).toBe("string");
    expect((payload.uah as string).length).toBe(16);
  });

  test("refresh token rotation issues a new token pair", async () => {
    const loginRes = await fetch(`${API_BASE}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "missiondistinction108@gmail.com",
        password: "Mastermind@2004",
      }),
    });
    const { refreshToken, token: oldToken } = await loginRes.json();

    // Wait >1 second so JWT iat (second-precision) differs between old and new tokens
    await new Promise(r => setTimeout(r, 1100));

    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    expect(refreshRes.status).toBe(200);
    const refreshBody = await refreshRes.json();
    expect(refreshBody.token).toBeDefined();
    expect(refreshBody.refreshToken).toBeDefined();
    expect(refreshBody.token).not.toBe(oldToken);
    expect(refreshBody.refreshToken).not.toBe(refreshToken);
  });

  test("used refresh token cannot be replayed (single-use enforcement)", async () => {
    const loginRes = await fetch(`${API_BASE}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "missiondistinction108@gmail.com",
        password: "Mastermind@2004",
      }),
    });
    const { refreshToken } = await loginRes.json();

    await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const secondRefresh = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    expect(secondRefresh.status).toBe(401);
  });
});
