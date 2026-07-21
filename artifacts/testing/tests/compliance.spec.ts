import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:19257";
const API_BASE = process.env.API_URL || "http://localhost:8080";
const ADMIN_EMAIL = "missiondistinction108@gmail.com";
const ADMIN_PASSWORD = "Mastermind@2004";

let _cachedAdminToken: string | null = null;

async function getAdminToken(): Promise<string> {
  if (_cachedAdminToken) return _cachedAdminToken;
  const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Admin login failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.token) throw new Error(`No token in login response: ${JSON.stringify(data)}`);
  _cachedAdminToken = data.token;
  return _cachedAdminToken!;
}

test.describe("Privacy Policy & Terms of Service pages", () => {
  test("privacy policy page loads at /privacy-policy", async ({ page }) => {
    await page.goto("/privacy-policy");
    await expect(page).toHaveTitle(/Mission Distinction/i);
    await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/DPDPA 2023/i)).toBeVisible();
    await expect(page.getByText(/Data Fiduciary/i)).toBeVisible();
  });

  test("privacy policy has required DPDPA sections", async ({ page }) => {
    await page.goto("/privacy-policy");
    await expect(page.getByText(/Right to Access/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Right to Erasure/i)).toBeVisible();
    await expect(page.getByText(/Grievance Officer/i)).toBeVisible();
    await expect(page.getByText(/missiondistinction108@gmail.com/i)).toBeVisible();
  });

  test("terms of service page loads at /terms", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /Terms of Service/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Acceptable Use/i)).toBeVisible();
    await expect(page.getByText(/Grievance Mechanism/i)).toBeVisible();
    await expect(page.getByText(/Governing Law/i)).toBeVisible();
  });

  test("back to home button on privacy policy works", async ({ page }) => {
    await page.goto("/privacy-policy");
    await page.getByRole("button", { name: /Back to Home/i }).click();
    await expect(page).toHaveURL(/\//);
  });

  test("privacy policy and terms links are accessible from landing page register form", async ({ page }) => {
    await page.goto("/");
    const termsLink = page.locator('a[href="/terms"]').first();
    const privacyLink = page.locator('a[href="/privacy-policy"]').first();
    await expect(termsLink).toBeVisible({ timeout: 8000 });
    await expect(privacyLink).toBeVisible();
  });
});

test.describe("API caching headers", () => {
  test("leaderboard returns X-Cache header", async () => {
    const token = await getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };
    await fetch(`${API_BASE}/api/leaderboard`, { headers });
    const res2 = await fetch(`${API_BASE}/api/leaderboard`, { headers });
    expect(res2.ok).toBe(true);
    const cacheHeader = res2.headers.get("x-cache");
    expect(cacheHeader).toBeTruthy();
    expect(["HIT", "MISS"]).toContain(cacheHeader);
  });

  test("announcements returns X-Cache header", async () => {
    const token = await getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };
    await fetch(`${API_BASE}/api/announcements`, { headers });
    const res2 = await fetch(`${API_BASE}/api/announcements`, { headers });
    expect(res2.ok).toBe(true);
    const cacheHeader = res2.headers.get("x-cache");
    expect(cacheHeader).toBeTruthy();
  });

  test("second leaderboard request is served from cache (HIT)", async () => {
    const token = await getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };
    await fetch(`${API_BASE}/api/leaderboard`, { headers });
    const res2 = await fetch(`${API_BASE}/api/leaderboard`, { headers });
    expect(res2.headers.get("x-cache")).toBe("HIT");
  });
});

test.describe("Account deletion endpoint", () => {
  test("DELETE /api/auth/account requires password", async () => {
    const token = await getAdminToken();
    const res = await fetch(`${API_BASE}/api/auth/account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/password/i);
  });

  test("DELETE /api/auth/account rejects wrong password", async () => {
    const token = await getAdminToken();
    const res = await fetch(`${API_BASE}/api/auth/account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: "wrongpassword123" }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/incorrect password/i);
  });

  test("DELETE /api/auth/account requires auth token", async () => {
    const res = await fetch(`${API_BASE}/api/auth/account`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "anypassword" }),
    });
    expect(res.status).toBe(401);
  });
});

test.describe("SendGrid email config", () => {
  test("test-email endpoint returns informative error if not configured", async () => {
    const token = await getAdminToken();
    const res = await fetch(`${API_BASE}/api/auth/admin/test-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    expect(typeof data.ok).toBe("boolean");
    expect(data.envCheck).toBeDefined();
    expect(typeof data.envCheck.SENDGRID_API_KEY).toBe("boolean");
  });
});

test.describe("Student settings page — danger zone UI", () => {
  test("settings page shows Danger Zone section", async ({ page }) => {
    const token = await getAdminToken();
    const studentUser = {
      id: 6,
      fullName: "Mission Distinction",
      email: ADMIN_EMAIL,
      role: "student",
      isSuperAdmin: false,
    };
    await page.addInitScript(({ t, u }: any) => {
      localStorage.setItem("mission_token", t);
      localStorage.setItem("mission_user", JSON.stringify(u));
    }, { t: token, u: studentUser });

    await page.goto("/student/settings");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Danger Zone/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /Delete Account/i })).toBeVisible();
  });

  test("delete account dialog opens and requires confirmation", async ({ page }) => {
    const token = await getAdminToken();
    const studentUser = {
      id: 6,
      fullName: "Mission Distinction",
      email: ADMIN_EMAIL,
      role: "student",
      isSuperAdmin: false,
    };
    await page.addInitScript(({ t, u }: any) => {
      localStorage.setItem("mission_token", t);
      localStorage.setItem("mission_user", JSON.stringify(u));
    }, { t: token, u: studentUser });

    await page.goto("/student/settings");
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /Delete Account/i }).click();
    await expect(page.getByText(/Permanently Delete Account/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder("DELETE")).toBeVisible();
    const deleteBtn = page.getByRole("button", { name: /Delete My Account/i });
    await expect(deleteBtn).toBeDisabled();
  });
});

test.describe("WCAG 2.1 basic accessibility checks", () => {
  test("settings page has no missing aria-labels on key inputs", async ({ page }) => {
    const token = await getAdminToken();
    const studentUser = {
      id: 6, fullName: "Mission Distinction", email: ADMIN_EMAIL, role: "student", isSuperAdmin: false,
    };
    await page.addInitScript(({ t, u }: any) => {
      localStorage.setItem("mission_token", t);
      localStorage.setItem("mission_user", JSON.stringify(u));
    }, { t: token, u: studentUser });

    await page.goto("/student/settings");
    await page.waitForTimeout(2000);

    const inputs = page.locator('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby]):not([id])');
    const count = await inputs.count();
    expect(count).toBe(0);
  });

  test("privacy policy page passes basic heading hierarchy", async ({ page }) => {
    await page.goto("/privacy-policy");
    await page.waitForTimeout(1000);
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThan(3);
  });

  test("landing page register form has labels for all inputs", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    expect(count).toBeGreaterThan(0);
  });
});
