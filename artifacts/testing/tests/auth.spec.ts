import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:19257";
const ADMIN_EMAIL = "missiondistinction108@gmail.com";
const ADMIN_PASSWORD = "Mastermind@2004";

async function getAdminToken(): Promise<{ token: string; user: object } | null> {
  try {
    const res = await fetch(`${BASE_URL.replace("19257", "8080")}/api/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

test.describe("Admin login flow", () => {
  test("admin login via landing page", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("btn-role-admin").click();
    await page.waitForTimeout(300);

    const emailField = page.locator('input[type="email"], input[placeholder*="mail"], input[name="email"]').first();
    await emailField.click({ clickCount: 3 });
    await emailField.press("Control+a");
    await emailField.fill(ADMIN_EMAIL);

    const passwordField = page.locator('input[type="password"]').first();
    await passwordField.click({ clickCount: 3 });
    await passwordField.fill(ADMIN_PASSWORD);

    await page.getByRole("button", { name: /login|sign in/i }).first().click();
    await page.waitForURL(/admin/, { timeout: 15_000 });
    expect(page.url()).toContain("admin");
  });

  test("admin login via API + localStorage injection (reliable)", async ({ page }) => {
    const auth = await getAdminToken();
    expect(auth).not.toBeNull();

    await page.addInitScript(({ token, user }) => {
      localStorage.setItem("mission_token", token);
      localStorage.setItem("mission_user", JSON.stringify(user));
    }, { token: auth!.token, user: auth!.user });

    await page.goto("/admin/dashboard");
    await page.waitForURL(/admin\/dashboard/, { timeout: 10_000 });
    expect(page.url()).toContain("admin");
  });

  test("invalid credentials show error toast", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("btn-role-admin").click();
    await page.waitForTimeout(300);

    const emailField = page.locator('input[type="email"]').first();
    await emailField.fill("wrong@example.com");
    const passwordField = page.locator('input[type="password"]').first();
    await passwordField.fill("wrongpassword");
    await page.getByRole("button", { name: /login/i }).first().click();

    await expect(page.getByText(/failed|invalid|error/i).first()).toBeVisible({ timeout: 8000 });
  });
});
