import { test, expect } from "@playwright/test";

// Chat and workflow pages are behind auth. Without seeded credentials these specs
// assert the gate holds and the routes are wired. When E2E_EMAIL / E2E_PASSWORD are
// provided (CI secrets against a preview with a seeded user), the authed paths run.

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("input[type=email], input[name=email]").fill(email!);
  await page.locator("input[type=password]").fill(password!);
  await page.getByRole("button", { name: /sign in|log in|login/i }).click();
  await page.waitForLoadState("networkidle");
}

test.describe("chat", () => {
  test("chat route is auth-gated when logged out", async ({ page }) => {
    await page.goto("/correspondence");
    await expect(page).toHaveURL(/login/);
  });

  test("authed chat page renders", async ({ page }) => {
    test.skip(!email || !password, "E2E_EMAIL / E2E_PASSWORD not set");
    await login(page);
    await page.goto("/correspondence");
    await expect(page).not.toHaveURL(/login/);
    const height = await page.evaluate(() => document.body.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(200);
  });
});

test.describe("workflow", () => {
  test("admin workflow route is gated for anonymous users", async ({ page }) => {
    await page.goto("/planner");
    await expect(page).toHaveURL(/login/);
  });

  test("authed workflow page renders", async ({ page }) => {
    test.skip(!email || !password, "E2E_EMAIL / E2E_PASSWORD not set");
    await login(page);
    await page.goto("/planner");
    const url = page.url();
    // Either the page renders (admin) or redirects home (non-admin) — never blank.
    const height = await page.evaluate(() => document.body.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(100);
    expect(url).not.toContain("/login");
  });
});
