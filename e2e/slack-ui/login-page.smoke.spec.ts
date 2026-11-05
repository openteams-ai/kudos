import { test, expect } from "@playwright/test";

/**
 * No credentials needed. Proves the toolchain works (Playwright + Chromium +
 * network to slack.com) and that Slack's public sign-in page still looks like
 * we expect. If this fails, the canary's problems are environmental, not DOM.
 */
test("slack.com sign-in page is reachable and has a workspace/email field", async ({ page }) => {
  const res = await page.goto("https://slack.com/signin", { waitUntil: "domcontentloaded" });
  expect(res?.ok(), `HTTP ${res?.status()}`).toBeTruthy();
  await expect(page).toHaveTitle(/sign in|slack/i);

  // Slack alternates between "enter your workspace URL" and "enter your email"
  // first screens; accept either.
  const field = page
    .getByRole("textbox", { name: /email/i })
    .or(page.getByRole("textbox", { name: /workspace/i }))
    .or(page.locator('input[type="email"], input[name="domain"]'))
    .first();
  await expect(field).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: "test-results/steps/00-signin-page.png" });
});
