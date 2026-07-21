import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_URL || "http://localhost:8080";
const APP_BASE = process.env.BASE_URL || "http://localhost:19257";
const ADMIN_EMAIL = "missiondistinction108@gmail.com";
const ADMIN_PASSWORD = "Mastermind@2004";

async function getAdminToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const data = await res.json();
  return data.token;
}

async function injectAdmin(page: any, token: string) {
  const user = { id: 6, fullName: "Mission Distinction", email: ADMIN_EMAIL, role: "admin", isSuperAdmin: true };
  await page.addInitScript(({ t, u }: any) => {
    localStorage.setItem("mission_token", t);
    localStorage.setItem("mission_user", JSON.stringify(u));
  }, { t: token, u: user });
}

test.describe("Admin dashboard", () => {
  let adminToken: string;

  test.beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  test("admin dashboard loads with stats", async ({ page }) => {
    await injectAdmin(page, adminToken);
    await page.goto("/admin/dashboard");
    await page.waitForURL(/admin\/dashboard/, { timeout: 10_000 });
    await expect(page.locator("text=/students|total|announcements/i").first()).toBeVisible({ timeout: 8000 });
  });

  test("admin announcements page loads", async ({ page }) => {
    await injectAdmin(page, adminToken);
    await page.goto("/admin/announcements");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/announcement/i).first()).toBeVisible();
  });

  test("push notifications VAPID endpoint returns valid key", async () => {
    const res = await fetch(`${API_BASE}/api/push/vapid-key`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.publicKey).toBeTruthy();
    expect(typeof data.publicKey).toBe("string");
    expect(data.publicKey.startsWith("B")).toBe(true);
  });

  test("socket.io endpoint responds with 200", async () => {
    const res = await fetch(`${API_BASE}/api/socket.io/?EIO=4&transport=polling`);
    expect(res.status).toBe(200);
  });
});

test.describe("Student pages", () => {
  let adminToken: string;

  test.beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  test("student community page loads with Group Chats panel", async ({ page }) => {
    const studentUser = { id: 6, fullName: "Mission Distinction", email: ADMIN_EMAIL, role: "student", isSuperAdmin: false };
    await page.addInitScript(({ t, u }: any) => {
      localStorage.setItem("mission_token", t);
      localStorage.setItem("mission_user", JSON.stringify(u));
    }, { t: adminToken, u: studentUser });

    await page.goto("/student/community");
    await page.waitForTimeout(3000);
    await expect(page.getByText(/group chat|community hub/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("student settings page shows push notifications toggle", async ({ page }) => {
    const studentUser = { id: 6, fullName: "Mission Distinction", email: ADMIN_EMAIL, role: "student", isSuperAdmin: false };
    await page.addInitScript(({ t, u }: any) => {
      localStorage.setItem("mission_token", t);
      localStorage.setItem("mission_user", JSON.stringify(u));
    }, { t: adminToken, u: studentUser });

    await page.goto("/student/settings");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/push notification/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /enable|disable/i })).toBeVisible();
  });

  test("quiz page loads and shows subject list or quiz content", async ({ page }) => {
    const studentUser = { id: 6, fullName: "Mission Distinction", email: ADMIN_EMAIL, role: "student", isSuperAdmin: false };
    await page.addInitScript(({ t, u }: any) => {
      localStorage.setItem("mission_token", t);
      localStorage.setItem("mission_user", JSON.stringify(u));
    }, { t: adminToken, u: studentUser });

    await page.goto("/student/quiz");
    await page.waitForTimeout(3000);
    await expect(page.getByText(/quiz|subject|anatomy|physiology|biochemistry/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("quiz API returns questions for a subject", async () => {
    const token = adminToken;
    const res = await fetch(`${API_BASE}/api/quizzes?subject=Anatomy`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("student PDFs page loads with subject filter", async ({ page }) => {
    const studentUser = { id: 6, fullName: "Mission Distinction", email: ADMIN_EMAIL, role: "student", isSuperAdmin: false };
    await page.addInitScript(({ t, u }: any) => {
      localStorage.setItem("mission_token", t);
      localStorage.setItem("mission_user", JSON.stringify(u));
    }, { t: adminToken, u: studentUser });

    await page.goto("/student/pdfs");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/pdf|document|anatomy|library/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("student notes page loads", async ({ page }) => {
    const studentUser = { id: 6, fullName: "Mission Distinction", email: ADMIN_EMAIL, role: "student", isSuperAdmin: false };
    await page.addInitScript(({ t, u }: any) => {
      localStorage.setItem("mission_token", t);
      localStorage.setItem("mission_user", JSON.stringify(u));
    }, { t: adminToken, u: studentUser });

    await page.goto("/student/notes");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/note|study/i).first()).toBeVisible({ timeout: 8000 });
  });
});
