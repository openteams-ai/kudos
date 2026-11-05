import { test, expect, type Page, type Locator } from "@playwright/test";
import { WebClient } from "@slack/web-api";

/**
 * The canary: /kudos -> modal -> fill -> Send -> message lands in the channel.
 *
 * Selector strategy (this is the part that will need patching when Slack
 * changes its DOM): role/label first, data-qa second, and every step takes a
 * screenshot into test-results/steps/ so a failure tells you *where* the UI
 * drifted. Modal field labels come from apps/slack/src/kudosCommand.ts:
 *   "Who?" (users_select) · "For what?" (static_select) · "Why? (be specific)" (plain_text_input)
 *   title "Give Kudos" · submit "Send" · callback_id kudos_submit
 */
const TEAM_ID = required("SLACK_UI_TEAM_ID");
const CHANNEL_ID = required("SLACK_UI_CHANNEL_ID");
const RECIPIENT = required("SLACK_UI_RECIPIENT"); // display name of the second test human
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN; // optional: verifies via conversations.history

test("/kudos → modal → Send → message in channel", async ({ page }) => {
  const marker = `canary-${Date.now()}`;
  const reason = `Automated canary ${marker}: thanks for keeping the lights on <!channel>`; // the <!channel> must arrive escaped

  await test.step("open the channel", async () => {
    await page.goto(`https://app.slack.com/client/${TEAM_ID}/${CHANNEL_ID}`);
    await expect(composer(page)).toBeVisible({ timeout: 60_000 });
    await shot(page, "01-channel");
  });

  await test.step("type /kudos", async () => {
    const box = composer(page);
    await box.click();
    await page.keyboard.type("/kudos", { delay: 40 });
    await shot(page, "02-typed-command");
    await page.keyboard.press("Enter");
    // The command autocomplete may swallow the first Enter to select the
    // command; if no modal appears, send once more.
    const dialog = page.getByRole("dialog");
    try {
      await expect(dialog).toBeVisible({ timeout: 5_000 });
    } catch {
      await page.keyboard.press("Enter");
      await expect(dialog).toBeVisible({ timeout: 15_000 });
    }
    await expect(dialog.getByText("Give Kudos")).toBeVisible();
    await shot(page, "03-modal-open");
  });

  const dialog = page.getByRole("dialog");

  await test.step("pick recipient (Who?)", async () => {
    const picker = firstVisible(
      dialog.getByLabel("Who?"),
      dialog.getByRole("button", { name: /select a user/i }),
      dialog.getByRole("combobox").first(),
    );
    await picker.click();
    await page.keyboard.type(RECIPIENT, { delay: 40 });
    await page.getByRole("option", { name: new RegExp(escapeRe(RECIPIENT), "i") }).first().click();
    await shot(page, "04-recipient");
  });

  await test.step("pick a value (For what?)", async () => {
    const picker = firstVisible(
      dialog.getByLabel("For what?"),
      dialog.getByRole("button", { name: /select an option/i }),
      dialog.getByRole("combobox").nth(1),
    );
    await picker.click();
    await page.getByRole("option").first().click();
    await shot(page, "05-value");
  });

  await test.step("write the reason (Why?)", async () => {
    const box = firstVisible(
      dialog.getByLabel(/why\?/i),
      dialog.getByRole("textbox").last(),
    );
    await box.click();
    await page.keyboard.type(reason, { delay: 10 });
    await shot(page, "06-reason");
  });

  await test.step("send", async () => {
    await dialog.getByRole("button", { name: "Send" }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await shot(page, "07-sent");
  });

  await test.step("message appears in the channel (UI)", async () => {
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 30_000 });
    // The escaped <!channel> must render as literal text, not a broadcast.
    await expect(page.getByText(marker).first()).toContainText("<!channel>");
    await shot(page, "08-in-channel");
  });

  await test.step("message exists via API (conversations.history)", async () => {
    test.skip(!BOT_TOKEN, "SLACK_BOT_TOKEN not set — skipping API verification");
    const slack = new WebClient(BOT_TOKEN);
    const found = await poll(async () => {
      const res = await slack.conversations.history({ channel: CHANNEL_ID, limit: 20 });
      return res.messages?.find((m) => m.text?.includes(marker));
    });
    expect(found, "bot message with the marker").toBeTruthy();
    expect(found!.text).toContain("&lt;!channel&gt;");
    expect(found!.text).toMatch(/recognized <@U[A-Z0-9]+>/);
  });
});

// ---- helpers ---------------------------------------------------------------

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (see .env.example)`);
  return v;
}

function composer(page: Page): Locator {
  return page.getByRole("textbox", { name: /message/i }).first().or(page.locator('[data-qa="message_input"]').first());
}

/** Chain candidates with `.or()` so whichever Slack renders this month wins. */
function firstVisible(...candidates: Locator[]): Locator {
  return candidates.reduce((acc, c) => acc.or(c)).first();
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/steps/${name}.png`, fullPage: false });
}

async function poll<T>(fn: () => Promise<T | undefined>, tries = 10, ms = 2_000): Promise<T | undefined> {
  for (let i = 0; i < tries; i++) {
    const v = await fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, ms));
  }
  return undefined;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
