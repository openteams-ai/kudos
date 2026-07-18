# Setup — get Kudos running for your team

This is the end-to-end guide for standing up **Kudos** against **your own** Slack
workspace and database. If you just want to see the web dashboard with demo data,
the [60-second quickstart](#1-60-second-local-quickstart) gets you there with zero
external services. To wire in Slack giving and Sign in with Slack, keep reading.

**What you'll have when you're done:**

- A live recognition feed and rewards store at `http://localhost:3000`
- `/kudos` working in your Slack workspace (give recognition, react to boost)
- Sign in with Slack on the web app, linking one identity across bot and dashboard
- Optional: a celebration post in Slack every time someone redeems a reward

> **Your first stop after boot:** open **<http://localhost:3000/setup>**. It's a
> live configuration checklist that reads your environment and tells you exactly
> what's wired up and what's still missing (tokens, `AUTH_SECRET`, database mode,
> Slack connection). Keep it open in a tab while you work through this guide — it
> turns green as you go.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 20** | See `.nvmrc`. `nvm use` picks it up. |
| **npm** | Ships with Node. |
| **A Slack workspace you can install apps into** | A personal/test workspace is ideal. Needed only for the Slack + SSO steps, not the local-only dashboard. |
| **`openssl`** | For generating `AUTH_SECRET` (preinstalled on macOS/Linux). |

Nothing else. No database server, no tunnel/ngrok, no Docker (unless you want it —
see [Docker](#5-docker)).

---

## 1. 60-second local quickstart

This gets the dashboard running on **zero-config SQLite** — no `DATABASE_URL`, no
database server. Perfect for a first look, tests, and demos.

```bash
npm install

# Generate the Prisma client, create the SQLite file, seed base data
# (5 values, the 26-item rewards catalog, a small demo team)
npm run db:generate && npm run db:push && npm run db:seed

# Optional: fill the feed with ~4 weeks of believable activity (14 users)
npm run db:demo

npm run dev:web        # http://localhost:3000
```

Open <http://localhost:3000> for the feed and store, then
<http://localhost:3000/setup> for the config checklist. At this point everything
web-side works against a local SQLite file (`packages/db/prisma/dev.db`). The Slack
bot and Sign in with Slack are the next two sections.

Run the test suite any time:

```bash
npm test               # Vitest suite in packages/db
```

> ⚠️ **`npm test` resets the dev SQLite database.** The suite calls `deleteMany`
> on the shared `dev.db` in `beforeEach`, so running it **wipes your seeded/demo
> data**. Re-run `npm run db:seed` (and `npm run db:demo`) afterward to repopulate.
> This only affects the default SQLite dev database — see
> [Demo data vs. clean start](#6-demo-data-vs-clean-start).

---

## 2. Connect your Slack workspace

The bot runs in **Socket Mode** — it connects out over a WebSocket, so there's **no
public URL, tunnel, or ngrok** to stand up.

### Create the app and get tokens

The full ~5-minute walkthrough — create the app from the included manifest, install
it, and grab both tokens — is the canonical **[`apps/slack/README.md`](../apps/slack/README.md)**.
Follow it, then come back here. In short you'll end up with:

- **`SLACK_BOT_TOKEN`** (`xoxb-…`) — from **OAuth & Permissions** after installing.
- **`SLACK_APP_TOKEN`** (`xapp-…`) — from **Basic Information → App-Level Tokens**,
  generated with the `connections:write` scope (this is what Socket Mode needs).

### Configure the bot's environment

```bash
cp apps/slack/.env.example apps/slack/.env
# edit apps/slack/.env:
#   SLACK_BOT_TOKEN=xoxb-...
#   SLACK_APP_TOKEN=xapp-...
#   SLACK_KUDOS_CHANNEL="#kudos"
```

> ⚠️ **Quote the channel value.** `dotenv` treats an unquoted `#` as the start of a
> comment, so `SLACK_KUDOS_CHANNEL=#kudos` parses as an **empty string** and posts
> silently fail with `channel_not_found`. Always write `SLACK_KUDOS_CHANNEL="#kudos"`.
> The example files already show the quotes — keep them.

### Create the channel and invite the bot

Create the channel (default `#kudos`, or whatever you set `SLACK_KUDOS_CHANNEL` to),
then in that channel run:

```
/invite @kudos
```

The bot can only post to channels it's a member of. Skipping this is the #1 cause of
`channel_not_found`.

### Smoke test, then run

```bash
npm -w @kudos/slack run verify   # validates both tokens + opens a Socket Mode connection
npm run dev:slack                # terminal 1 — the bot
npm run dev:web                  # terminal 2 — http://localhost:3000
```

Fix anything `verify` flags before running the bot.

### What `/kudos` does

In Slack, type `/kudos`. A modal opens: pick a **teammate**, a **value** (Great
Friend, Client Hero, Crisis Crusher, Craftsmanship, Teamwork), and a **required
reason**. On submit:

- The kudos posts publicly to your kudos channel and appears instantly in the web feed.
- The recipient gets **10 points**; each giver has a **100-point monthly allowance**
  (so you can't over-give — scarcity keeps recognition thoughtful).
- The giver gets an **ephemeral confirmation** — a private message in the channel:
  _"✅ +10 pts to @recipient — you have N pts left to give this month."_ If the
  ephemeral post can't be delivered, the bot falls back to a DM. Feedback failures
  are logged and swallowed; they never fail the kudos itself.

### Reaction boosts

Add an emoji reaction to any kudos post and the recipient gets **+1 point** — once
per person per kudos, idempotent. Appreciation becomes a group act.

### Redemption celebrations (optional, web-side)

You can have the web app post a celebration to Slack whenever someone redeems a
reward:

> {emoji} @user just redeemed *{reward}* ({cost} pts) — congrats! 🎉

This is **off by default** and lives in the **web** app's env, not the bot's. Add to
`apps/web/.env.local` (reusing the same bot token):

```bash
SLACK_BOT_TOKEN=xoxb-...            # same token as apps/slack/.env
SLACK_KUDOS_CHANNEL="#kudos"        # quote it — same dotenv rule as above
```

If either is missing or blank, redemption posting is silently skipped and local dev
works unchanged. The post is fire-and-forget — a Slack outage never affects the
redeem response.

---

## 3. Web sign-in (Sign in with Slack)

The dashboard uses **Auth.js (NextAuth v5)** with Slack's OIDC provider, so web-you
is the same `User` that gives and receives kudos in Slack. This transparently rides
whatever SSO your company already uses for Slack.

### Configure the web environment

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Session encryption key. Generate a real one: `openssl rand -base64 32`. **Required** — Auth.js fails closed without it (see below). |
| `AUTH_SLACK_ID` | Slack app **client_id** (Basic Information → App Credentials). |
| `AUTH_SLACK_SECRET` | Slack app **client_secret** (same screen). |
| `AUTH_URL` | Base URL the dashboard serves on, e.g. `http://localhost:3000`. **Must match the actual port.** |

```bash
# generate a real secret
openssl rand -base64 32
```

### One-time Slack app changes for live OAuth

These are manual steps in your Slack app config (from the
[SSO design spec](superpowers/specs/2026-07-01-slack-sso-design.md)), done once, then
**reinstall the app**:

1. **OAuth & Permissions → Redirect URLs:** add
   `http://localhost:3000/api/auth/callback/slack`
   (add `http://localhost:3001/api/auth/callback/slack` too if Next ever serves on
   3001 — the redirect URL must match the served port exactly).
2. **OAuth & Permissions → User Token Scopes:** add `openid`, `email`, `profile`.
   These are **user** scopes, distinct from the bot scopes in the manifest.
3. **Reinstall to Workspace** so the new scopes take effect.

Then start the web app, click **Sign in with Slack** in the header, complete the
round-trip, and you should land back authenticated with your Slack name and avatar.
The rewards store now spends **your** balance, and only you can redeem your points.

> **Why `AUTH_SECRET` matters in production:** Auth.js **fails closed** — with no
> `AUTH_SECRET`, authentication does not work in a production build, and every
> points-spending action (redeem) is gated behind a signed-in session. Generate it
> with `openssl rand -base64 32` and store it as a secret, never in the repo.

---

## 4. Database choices

Kudos picks its database from the **`DATABASE_URL`** environment variable. Three
modes, no code changes between them:

| Mode | How to select | When to use |
|---|---|---|
| **Zero-config SQLite** (default) | Leave `DATABASE_URL` **unset** | Tests, demos, first run. A single local file, no server. |
| **Custom SQLite path** | `DATABASE_URL="file:/path/to/your.db"` | Persist the DB somewhere specific, or run multiple isolated copies. |
| **PostgreSQL** | `DATABASE_URL="postgres://user:pass@host:5432/kudos"` | Real multi-user deployments. Uses real migrations (`prisma migrate`); a bundled Postgres is available via `docker compose --profile postgres`. |

Full details — migration commands, the bundled Postgres profile, switching modes,
and the Prisma specifics — are in **[`docs/database.md`](database.md)**.

---

## 5. Docker

Prefer containers? A `docker compose` setup runs the web app (and optionally a
bundled Postgres via `--profile postgres`) without installing Node or a database
locally. See **[`docs/docker.md`](docker.md)** for the full walkthrough, including
which ports are published and how to pass the environment variables above into the
containers.

---

## 6. Demo data vs. clean start

| Command | Result |
|---|---|
| `npm run db:seed` | **Clean start.** 5 values, the 26-item rewards catalog, and 6 base users. No kudos activity. |
| `npm run db:demo` | **Rich demo.** Adds ~4 weeks of believable activity across **14 users** — kudos, boosts, redemptions — for a lively feed. Safe to re-run; preserves real Slack-linked users. |

Run `db:seed` first (it's part of the quickstart), then optionally `db:demo` on top.

> ⚠️ Reminder from [§1](#1-60-second-local-quickstart): **`npm test` wipes the dev
> SQLite database.** After running tests, re-run `npm run db:seed` (and
> `npm run db:demo`) to get your data back.

---

## 7. Troubleshooting

| Symptom | Cause & fix |
|---|---|
| **`channel_not_found`** when posting kudos | Either the channel value isn't quoted (`SLACK_KUDOS_CHANNEL="#kudos"` — unquoted `#` becomes a comment, yielding an empty channel), or the bot isn't in the channel. Quote it, and run `/invite @kudos` in the channel. |
| **Kudos succeeds but the giver gets no ephemeral confirmation** | The ephemeral post needs the giver to be **in the channel**. The bot falls back to a DM, but DM delivery requires `im:write`, which isn't in the manifest by default — so if the giver isn't in the channel, they may get no feedback. The kudos itself still succeeds; this is cosmetic. Add the giver to the channel (or add `im:write` and reinstall if you want reliable DM fallback). |
| **`verify` fails** | A token is wrong or missing a scope. `SLACK_APP_TOKEN` must have `connections:write`; `SLACK_BOT_TOKEN` comes from **OAuth & Permissions** after installing. Re-copy both into `apps/slack/.env`. |
| **Sign in with Slack errors / redirects to an error page** | The redirect URL in the Slack app must **exactly** match the served origin, including port (`http://localhost:3000/api/auth/callback/slack`). Also confirm the `openid email profile` **user** scopes were added and the app was **reinstalled**. |
| **Auth doesn't work in a production build** | `AUTH_SECRET` is unset. Auth.js fails closed. Generate one with `openssl rand -base64 32` and set it. |
| **Build fails offline fetching Google Fonts** | `next build` may try to fetch fonts from Google. If you're building offline, ensure network access during the build, or the font step will fail. Dev (`npm run dev:web`) is unaffected. |
| **Seeded/demo data disappeared** | You ran `npm test`, which resets the dev SQLite DB. Re-run `npm run db:seed` (+ `npm run db:demo`). |
| **Not sure what's configured** | Open **<http://localhost:3000/setup>** — the live checklist shows exactly which tokens, secrets, and connections are wired up. |

---

## Where to go next

- **[`apps/slack/README.md`](../apps/slack/README.md)** — the canonical Slack app creation walkthrough.
- **[`docs/database.md`](database.md)** — full database mode reference (SQLite paths, Postgres, migrations).
- **[`docs/docker.md`](docker.md)** — containerized run.
- **[`docs/BACKLOG.md`](BACKLOG.md)** — what's shipped vs. planned.
- **[`docs/decisions/decision-log.md`](decisions/decision-log.md)** — the rationale behind each design choice.
</content>
</invoke>
