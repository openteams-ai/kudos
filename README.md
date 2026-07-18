# Kudos — a recognition-first, genuinely rewarding peer appreciation program

[![CI](https://github.com/brandonrc/kudos-bounty/actions/workflows/ci.yml/badge.svg)](https://github.com/brandonrc/kudos-bounty/actions/workflows/ci.yml)
[![Docker](https://github.com/brandonrc/kudos-bounty/actions/workflows/docker.yml/badge.svg)](https://github.com/brandonrc/kudos-bounty/actions/workflows/docker.yml)

> **Bounty Hunters — Kudos Program** hackathon entry (Engineering Division, June 30 – July 20, 2026).

Give a teammate real recognition in Slack in about ten seconds — `/kudos`, pick a person, a value, and a reason — and watch it land in a live web feed. Points accrue toward rewards people actually want, and the whole thing is built as a **behavioral nudge**: recognition happens where work already happens, giving is deliberately scarce so it stays thoughtful, and there's no leaderboard to game. Inspired by Nectar / Bonusly and grounded in behavioral-science research (see [`docs/research/`](docs/research/README.md)).

## Status

🟢 **Built and running on `main`.** Core MVP shipped: `/kudos` giving in Slack, reaction boosts, a live recognition feed, Sign in with Slack, a 26-item rewards store, one-click redeem, and per-user redemption history. 22 tests pass (`npm test`). See [`docs/BACKLOG.md`](docs/BACKLOG.md) for what's shipped vs. planned and [`docs/decisions/decision-log.md`](docs/decisions/decision-log.md) for the rationale behind each choice.

## What it does

**Give recognition in Slack — where work already happens.**

- `/kudos` opens a modal: pick a teammate, a **value** (Great Friend, Client Hero, Crisis Crusher, Craftsmanship, Teamwork), and a required "why". A required reason keeps recognition specific and genuine.
- The kudos posts publicly to `#kudos` and instantly appears in the web feed.
- **React to boost** — a reaction on any kudos adds a point to the recipient (once per person, idempotent), so appreciation is a group act.
- **Scarcity by design:** each giver has a **100-point monthly allowance** (10 pts per kudos, computed on read). You literally can't over-give or dump 10,000 points on a friend — the budget forces thoughtful giving, which the research backs.
- The recipient's **redeemable balance** is separate and never clawed back.

**Turn recognition into rewards — a real store.**

- **Sign in with Slack** links your Slack identity to one account across the bot and the web app.
- Browse a **26-item catalog** across five categories — Gift Cards, Company Swag, Experiences, Time Off, Charity — each with an emoji tile, description, and point cost that forms an affordability ladder (entry swag ~30 pts, aspirational items like an Extra Day Off at 500).
- Filter by category, see a **Crowd Favorites** row, get **"N more pts" affordability hints** and a save-up progress bar, then **confirm → confetti → an accessible, announced success**.
- **My Rewards** keeps a per-user redemption history, newest first.
- Redeeming is **race-safe** (a conditional, transactional decrement means concurrent redeems can never drive a balance negative) and **session-authenticated** (you can only spend your own points).

Built to **WCAG 2.2 AA**: AA-verified contrast, an accessibility-first body font (Atkinson Hyperlegible), keyboard-navigable filters, and `aria-live` success announcements.

## Architecture

TypeScript end to end, one small monorepo, SQLite for a bulletproof local demo.

| Path | What lives here |
|---|---|
| `apps/slack/` | Slack Bolt app in **Socket Mode** (no public URL needed). `/kudos` command + modal, reaction boosts, token-verify script, and an app **manifest** for one-shot setup. |
| `apps/web/` | **Next.js 14** (App Router) dashboard: recognition feed, rewards store, My Rewards history, and the `/api/redeem` endpoint. Auth via **Auth.js (NextAuth v5)** with a Slack OIDC provider. |
| `packages/db/` | The shared core: **Prisma** schema + client, all business logic (`giveKudos`, `addBoost`, `redeemReward`, allowance math, identity linking), the shared rewards `catalog.ts`, seed + demo-data generators, and the test suite (Vitest). |

**Why these choices** (optimizing for the *Ability to Maintain* criterion):

- **One language, one data model.** All logic lives in `packages/db` and is imported by both the bot and the web app, so behavior can't drift between surfaces and there's exactly one place to change a rule. TypeScript throughout means one toolchain and one mental model.
- **Slack Socket Mode** — the bot connects out over a WebSocket, so there's **no public URL, tunnel, or ngrok** to stand up. A judge can run the whole thing from a laptop.
- **SQLite + Prisma** — the database is a single file. `db:push` + `db:seed` gives a working demo in seconds, with zero external services. Prisma keeps the schema readable and the queries type-safe; swapping to Postgres later is a datasource change, not a rewrite.
- **Next.js App Router** — server components read straight from Prisma (no separate API layer for reads), and the one write path (`/api/redeem`) is a thin, auth-guarded route over the shared `redeemReward` function.

## Quickstart

**Prerequisites:** Node.js 20 (see `.nvmrc`) and npm.

```bash
# 1. Install
npm install

# 2. Generate the Prisma client, create the SQLite database, and seed base data
#    (5 values, the 26-item rewards catalog, a demo team + users)
npm run db:generate && npm run db:push && npm run db:seed

# 3. (Optional) Fill the feed with ~4 weeks of believable activity for a lively demo.
#    Safe to re-run; preserves real Slack-linked users.
npm run db:demo

# 4. Run the web dashboard
npm run dev:web      # http://localhost:3000

# 5. (Optional) Run the Slack bot in a second terminal — needs apps/slack/.env, see below
npm run dev:slack
```

Run the tests any time:

```bash
npm test             # 22 Vitest tests in packages/db
```

The dashboard works on its own with seeded/demo data. The Slack bot is what makes giving live — set it up next.

### Run with Docker (prebuilt images)

No local Node toolchain needed — pull the images CI publishes to GHCR and run them:

```bash
cp apps/web/.env.local.example .env.docker    # then fill in values
docker compose -f docker-compose.ghcr.yml run --rm web npm run db:push
docker compose -f docker-compose.ghcr.yml run --rm web npm run db:seed
docker compose -f docker-compose.ghcr.yml up  # http://localhost:3000
```

Or build locally with `docker compose up`. Full details — image tags, PostgreSQL, and troubleshooting — are in **[`docs/docker.md`](docs/docker.md)**.

### Connecting Slack

The bot needs a Slack app (Socket Mode) and two tokens. Full ~5-minute walkthrough — create from the included manifest, grab the tokens, invite the bot, verify — is in **[`apps/slack/README.md`](apps/slack/README.md)**.

```bash
cp apps/slack/.env.example apps/slack/.env
# paste your SLACK_BOT_TOKEN (xoxb-…) and SLACK_APP_TOKEN (xapp-…)
npm -w @kudos/slack run verify   # confirms both tokens + the Socket Mode connection
npm run dev:slack
```

## Environment variables

**`apps/slack/.env`** (from `apps/slack/.env.example`)

| Variable | Purpose |
|---|---|
| `SLACK_BOT_TOKEN` | Bot User OAuth token (`xoxb-…`). From **OAuth & Permissions** after installing the app. |
| `SLACK_APP_TOKEN` | App-level token (`xapp-…`) with `connections:write`, for Socket Mode. From **Basic Information → App-Level Tokens**. |
| `SLACK_KUDOS_CHANNEL` | Channel kudos post to (default `#kudos`). Invite the bot with `/invite @kudos`. |

**`apps/web/.env.local`** (from `apps/web/.env.local.example`) — required for Sign in with Slack:

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Session encryption key. Generate a real one: `openssl rand -base64 32`. |
| `AUTH_SLACK_ID` / `AUTH_SLACK_SECRET` | Slack app **client_id / client_secret** (Basic Information → App Credentials). |
| `AUTH_URL` | Base URL the dashboard serves on (e.g. `http://localhost:3000`). Must match the real port. |

For live OAuth, add a redirect URL and the `openid email profile` user scopes to the Slack app, then reinstall it (see `docs/BACKLOG.md`, v2 item 1).

## Deployment notes

What a deployer must do to run this beyond a local demo:

1. **Set a real `AUTH_SECRET` in production.** Auth.js **fails closed** — without `AUTH_SECRET` set, authentication does not work in production, and every points-spending action (redeem) is gated behind a signed-in session. Generate it with `openssl rand -base64 32` and store it as a secret, never in the repo.
2. **Set `AUTH_URL`** to the deployed origin so OAuth callbacks resolve, and register that callback URL in the Slack app.
3. **Move off SQLite for a real multi-user deployment.** SQLite (a single file) is perfect for the demo and local dev. For production, point the Prisma `datasource` at Postgres and run `prisma db push` / migrations — the schema and all logic are unchanged.
4. **The Slack bot is a long-running process** (Socket Mode WebSocket), not serverless — run it as a worker/service with `npm run dev:slack`'s `start` equivalent. The Next.js web app deploys anywhere that runs Node 20.

## Docs map

| Path | Contents |
|---|---|
| [`docs/setup.md`](docs/setup.md) | **Get this running for your team** — end-to-end setup: local quickstart, Slack connection, Sign in with Slack, database, Docker, troubleshooting. Start here. |
| [`docs/database.md`](docs/database.md) | Database modes in depth — zero-config SQLite, custom SQLite path, and PostgreSQL (migrations, bundled Postgres). |
| [`docs/docker.md`](docs/docker.md) | Running Kudos with Docker Compose (web app + optional bundled Postgres). |
| [`docs/brief/`](docs/brief/) | The original assignment + a plain-text transcription — the source of truth for scope and judging criteria. |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Everything requested, with shipped / in-design / planned status. |
| [`docs/decisions/decision-log.md`](docs/decisions/decision-log.md) | Chronological log of every design choice and its rationale. |
| [`docs/research/`](docs/research/README.md) | Behavioral-science research reports and citations behind the design (monthly cap, no leaderboard, reward-the-recognized). |
| [`docs/design/`](docs/design/) | Scale considerations and the simulation approach. |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | Living design specs (core product, Slack SSO, UI refactor). |
| [`docs/ai-development.md`](docs/ai-development.md) | How AI built this project — an evidence map (specs-before-code, parallel build, and the real bugs adversarial AI review caught) tied to commit SHAs. |

---

_Developed with AI assistance (Claude Code). The development process is itself part of the "Use of AI" story and is documented throughout `docs/`._
