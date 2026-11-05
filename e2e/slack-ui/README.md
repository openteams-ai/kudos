# Slack UI canary (spike)

Drives the real Slack web client with Playwright to prove the one path no API can
exercise: **`/kudos` → modal → Send → message in `#kudos`**. Everything else about
the Slack integration is covered without a GUI (see epic #22, "Slack coverage
without a GUI").

**Status: spike.** Standalone npm project, not in the root workspace, no CI job
yet. The goal is to learn whether Slack's DOM is stable enough to keep this as a
scheduled, non-blocking canary. Prior art: Slack's own
[slack-skills-plugin PR #178](https://github.com/slackapi/slack-skills-plugin/pull/178)
does the same thing against a developer sandbox.

## Setup (once)

1. **A throwaway workspace.** Use a [Slack developer sandbox](https://docs.slack.dev/tools/developer-sandboxes/)
   (free with the Developer Program; needs a payment method for identity only).
   Create the Kudos app in it from `apps/slack/manifest.yaml`, install it, create
   `#kudos`, **`/invite @kudos`** into it. Add a second test human (the recipient).
2. **Run the bot** against that workspace (`npm run dev:slack` at the repo root
   with the sandbox tokens in `apps/slack/.env`), or point the canary at a
   deployed bot that is connected to the sandbox.
3. `cp .env.example .env` and fill in `SLACK_UI_TEAM_ID` (the `T…` id),
   `SLACK_UI_CHANNEL_ID` (the `C…` id of `#kudos`), `SLACK_UI_RECIPIENT`
   (display name of the second human), optionally `SLACK_BOT_TOKEN` for the API
   verification step.
4. `npm install && npx playwright install chromium`
5. `npm run login` — a headed Chromium opens; sign in **by hand** (Slack will email
   you a code). The session is saved to `.auth/slack.json` (gitignored).

We never automate the login itself: Slack challenges unrecognised browsers and
defaults to emailed codes, so that is the most fragile part and the least
valuable to automate.

## Run

```bash
npm run smoke   # no credentials: toolchain + slack.com reachable + sign-in page shape
npm test        # the canary, headless, using the saved session
npm run report  # HTML report with trace/video on failure
```

Step screenshots land in `test-results/steps/` on every run — when a selector
breaks, they show exactly which screen drifted.

## In CI (when promoted from spike)

- Schedule from `main` (nightly), **never a required PR check**.
- Secrets: `SLACK_UI_STORAGE_STATE_B64` (base64 of `.auth/slack.json`),
  `SLACK_UI_TEAM_ID`, `SLACK_UI_CHANNEL_ID`, `SLACK_UI_RECIPIENT`, `SLACK_BOT_TOKEN`.
- Job: write the storage state to `.auth/slack.json` → `npm run smoke` →
  `npm test` → on failure, upload `playwright-report/` + `test-results/` and post
  to a channel.
- When the session expires (months), re-run `npm run login` locally and rotate
  the secret.

## What we expect to learn

- Which selectors Slack actually renders for `users_select` / `static_select`
  inside a Block Kit modal (the spec tries label → aria name → role in order and
  logs which won).
- Whether the slash-command autocomplete needs one Enter or two.
- Run time (target < 90 s) and flake rate over a couple of weeks of nightly runs.

If it is flaky beyond patching a selector a few times a year, the alternative
is a message-based giving entry point (`@kudos @jane because …`) that the
API-only nightly job can drive with `chat.postMessage`.
