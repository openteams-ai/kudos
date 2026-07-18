# Slack Sync Polish — Allowance Feedback & Redemption Celebrations

Two small Slack touches that close the loop between the bot and the web app.

## 1. Ephemeral allowance feedback after `/kudos`

After a kudos succeeds (post-`ack()`), the bot sends the giver a private
confirmation in the kudos channel via `chat.postEphemeral`:

> ✅ +10 pts to @recipient — you have {N} pts left to give this month.

`N` comes from `remainingAllowance(giverId)` in `@kudos/db`. If the ephemeral
post fails (e.g. the giver isn't in the channel), the bot falls back to a DM.
Any failure is logged and swallowed — the kudos itself already succeeded, so
feedback problems must never surface as errors.

## 2. Redemption celebration in Slack

When a reward is redeemed on the web (`POST /api/redeem`), the web app posts a
celebration to the kudos channel:

> {emoji} @user just redeemed *{reward}* ({cost} pts) — congrats! 🎉

Implemented in `apps/web/lib/slack-celebrate.ts` as `celebrateRedemption()`.

- **Env-guarded no-op:** if `SLACK_BOT_TOKEN` or `SLACK_KUDOS_CHANNEL` is
  missing/blank, the function silently returns. Local dev without a Slack app
  keeps working unchanged. Both vars are documented (optional) in
  `apps/web/.env.local.example`.
- **Fire-and-forget:** the call never throws and is never awaited in the
  request path; errors are caught and logged inside. A Slack outage cannot
  change the redeem API's response or error semantics.
- **No new dependencies:** posts via plain `fetch` to
  `https://slack.com/api/chat.postMessage` — the registry proxy is unreliable,
  and one HTTP POST doesn't justify pulling the Slack SDK into the web app.
