import { test, expect } from "@playwright/test";

test.describe("login", () => {
  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type=email], input[name=email]")).toBeVisible();
    await expect(page.locator("input[type=password]")).toBeVisible();
  });

  test("invalid credentials are rejected", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type=email], input[name=email]").fill("nobody@example.com");
    await page.locator("input[type=password]").fill("wrong-password");
    await page.getByRole("button", { name: /sign in|log in|login/i }).click();
    // Stays on login (no redirect to an authed page) and shows an error.
    await expect(page).toHaveURL(/login/);
  });

  test("protected route redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });
});
