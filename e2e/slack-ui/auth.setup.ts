import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";

/**
 * One-time, manual sign-in. We deliberately do NOT automate the login itself:
 * Slack defaults to emailed sign-in codes and challenges unrecognised browsers,
 * so an automated login is the most fragile part of the whole thing. Instead:
 *
 *   npm run login        -> headed Chromium opens the workspace; you sign in by
 *                           hand; the session is saved to .auth/slack.json.
 *
 * Store that file (base64) as the CI secret SLACK_UI_STORAGE_STATE_B64 and
 * re-run `npm run login` when Slack eventually expires the session.
 */
const AUTH_FILE = ".auth/slack.json";

setup("sign in to Slack once (headed, manual)", async ({ page }) => {
  if (fs.existsSync(AUTH_FILE) && !process.env.SLACK_UI_RELOGIN) {
    setup.skip(true, `${AUTH_FILE} exists — set SLACK_UI_RELOGIN=1 to redo the login`);
    return;
  }
  if (process.env.CI) {
    throw new Error(
      `${AUTH_FILE} is missing in CI. Run \`npm run login\` locally and store the file as the ` +
        `SLACK_UI_STORAGE_STATE_B64 secret (base64 of .auth/slack.json).`,
    );
  }

  const teamId = required("SLACK_UI_TEAM_ID");
  await page.goto(`https://app.slack.com/client/${teamId}`);

  console.log("\n>>> Sign in to Slack in the browser window. The test continues once the client loads.\n");
  await page.waitForURL(/app\.slack\.com\/client\//, { timeout: 10 * 60_000 });
  await expect(composer(page)).toBeVisible({ timeout: 60_000 });

  fs.mkdirSync(".auth", { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  console.log(`>>> Session saved to ${AUTH_FILE}`);
});

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (see .env.example)`);
  return v;
}

function composer(page: import("@playwright/test").Page) {
  // Slack's message composer is a contenteditable with role=textbox and an
  // aria-label like "Message #channel". The data-qa attribute is the fallback.
  return page.getByRole("textbox", { name: /message/i }).first().or(page.locator('[data-qa="message_input"]').first());
}
