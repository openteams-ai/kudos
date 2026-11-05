import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

/**
 * Three projects:
 *   smoke  — no credentials: proves Playwright + Chromium + slack.com are reachable
 *            and the public sign-in page still has the fields we expect.
 *   setup  — one-time, HEADED, manual sign-in; saves .auth/slack.json (gitignored).
 *   slack  — the canary: reuses the saved session, headless, one scenario.
 *
 * The canary is designed to run on a schedule from main and report, never to
 * gate PRs — Slack's DOM changes often and a flaky required check is worse
 * than none.
 */
export default defineConfig({
  testDir: ".",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "smoke", testMatch: /login-page\.smoke\.spec\.ts/ },
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "slack",
      testMatch: /kudos\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: ".auth/slack.json" },
    },
  ],
});
