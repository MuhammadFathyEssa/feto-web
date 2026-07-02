import { test, expect } from "@playwright/test";

// This spec exists because of the CSP nonce regression that shipped a blank page:
// the document returned 200 but no scripts executed, so nothing rendered. A status
// check would have passed. These assertions fail on that exact condition.

test.describe("landing page renders (CSP / hydration regression guard)", () => {
  test("no CSP violations in console", async ({ page }) => {
    const cspErrors: string[] = [];
    page.on("console", (msg) => {
      const t = msg.text();
      if (/content security policy|refused to (load|execute|apply)/i.test(t)) {
        cspErrors.push(t);
      }
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(cspErrors, `CSP violations:\n${cspErrors.join("\n")}`).toHaveLength(0);
  });

  test("landing paints visible content (not a blank page)", async ({ page }) => {
    await page.goto("/");
    // The brand mark is server-rendered inside .feto-landing. If scripts are blocked
    // the styled shell still needs to be present and visible.
    const brand = page.locator(".logo-txt", { hasText: "FeTo" });
    await expect(brand).toBeVisible();
    // Body must have real layout height — a blank page collapses.
    const height = await page.evaluate(() => document.body.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(200);
  });

  test("sign-in control is present and interactive", async ({ page }) => {
    await page.goto("/");
    const signIn = page.getByRole("link", { name: /sign in/i });
    await expect(signIn).toBeVisible();
  });
});
