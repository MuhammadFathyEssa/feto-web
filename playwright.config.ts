import { defineConfig, devices } from "@playwright/test";

// E2E config. Target is the deployed preview/prod URL via BASE_URL, defaulting
// to local dev. These tests exist primarily to catch render/hydration regressions
// (e.g. the CSP blank-page failure) that unit tests cannot see.
const baseURL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
