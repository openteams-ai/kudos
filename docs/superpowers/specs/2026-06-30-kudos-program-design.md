# Kudos Program — Design Spec

**Status:** 🟡 DRAFT — pending behavioral-research validation. Sections marked _(pending research)_ may change once `docs/research/behavioral-research-report.md` lands.
**Date:** 2026-06-30
**Author:** Brandon (with AI assistance)
**Related:** `docs/brief/assignment.md`, `docs/decisions/decision-log.md`

## 1. Problem & goal

Employees have no low-friction, visible way to recognize colleagues for going above and beyond. Build a recognition system that people **actually use daily** because it's fast, social, and rewarding — integrated into where work already happens (Slack). Points accrue toward real rewards (swag/gift cards; fulfillment out of scope per brief).

**North star:** engagement and ease of use. Depth on the recognition→reward→engagement loop, not breadth.

## 2. Non-goals (explicitly out of scope)

- Reward fulfillment / payment / gift-card procurement (brief says out of scope).
- Performance reviews, goals, 1:1s, engagement surveys (Lattice territory — not this).
- SSO/enterprise admin, multi-tenant billing, mobile apps.

## 3. Users & core loop

- **Giver:** spends from a monthly give-allowance to recognize a peer in ~10 seconds via Slack.
- **Receiver:** gets public praise + points toward a redeemable balance.
- **Everyone:** sees the feed/leaderboard; reacts to boost others.
- **(Optional) Leadership:** sees participation at a glance.

**Loop:** trigger (in Slack) → give kudos (action) → public recognition + points (variable social reward) → boosts/streak (investment) → back to Slack.

## 4. Architecture (Decision D6, Approach A)

```
Monorepo (TypeScript)
├── apps/web      → Next.js dashboard + API routes (feed, leaderboard, rewards)
├── apps/slack    → Slack Bolt worker (Socket Mode): /kudos modal, reaction boosts
└── packages/db   → Prisma schema + client (shared); SQLite for demo
```

- Two processes, one shared SQLite DB via a shared Prisma package.
- Demo runs locally (bulletproof). Optional: deploy `apps/web` to Vercel (Postgres) as a live bonus.

## 5. Data model (Decision — small on purpose)

- **User** — `id, slackUserId, name, avatarUrl, email, giveBalance, redeemableBalance, isAdmin`
- **Kudos** — `id, fromUserId, toUserId, valueCategory, message, points, createdAt, slackMessageTs`
- **Boost** — `id, kudosId, fromUserId, points, createdAt` _(unique per user+kudos)_
- **Value** — `id, key, label, emoji, description` _(seedable company values)_
- **Reward** — `id, name, cost, imageUrl, category`
- **Redemption** — `id, userId, rewardId, cost, status='requested', createdAt`

Monthly allowance reset: **computed-on-read** (avoids a cron dependency for the demo).

## 6. Points model _(pending research — Decision D7)_

- Monthly **give-allowance** (spend-it-or-lose-it) separate from **redeemable balance** (received).
- Open question the research must answer: exact allowance size, whether/how to cap points per kudos, and how to frame money to avoid the overjustification/crowding-out effect.

## 7. Engagement mechanics _(pending research — Decision D8)_

Provisional: low-friction Slack modal, public-by-default posting, emoji-reaction boosts, company-values categories, monthly leaderboard. Research pass will confirm which mechanics sustain engagement vs. cause gaming/fatigue, and inform notification cadence.

## 8. Feature scope (Decision D9)

**Core (build):**
1. Give kudos in Slack (`/kudos` modal or shortcut).
2. Give-allowance points + redeemable balance.
3. Public recognition: post to `#kudos` + live web feed.
4. Monthly leaderboard.
5. Rewards catalog + "redeem" action (logs a request).

**Stretch (only if time):** leadership analytics tab; in-product AI "help me word it" assist.

## 9. Maintainability

One language; small schema; seed script with demo data; README + this spec; a handful of unit tests on the points logic (the part most worth protecting). Deployable via documented `npm run dev`.

## 10. Demo plan (presentation criterion)

Live: give a kudos in Slack → it appears in `#kudos` and the web feed in real time → boost it with a reaction → show leaderboard → redeem a reward. Close with a research-backed "why this works" slide and a roadmap slide.

## 11. Open questions

Tracked in `docs/decisions/decision-log.md` → "Open questions / pending". Key ones gate on the research report.
