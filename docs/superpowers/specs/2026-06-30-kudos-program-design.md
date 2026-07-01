# Kudos Program — Design Spec (Final)

**Status:** 🟢 FINAL (pending user review) — grounded in 4 verified research passes (`docs/research/`) and decisions D1–D29 (`docs/decisions/decision-log.md`).
**Date:** 2026-06-30
**Author:** Brandon (with AI assistance)
**Related:** `docs/brief/assignment.md`, `docs/research/design-implications.md`, `docs/design/scale-considerations.md`, `docs/design/simulation-approach.md`

---

## 1. Problem & goal
Employees lack a low-friction, visible way to recognize colleagues for going above and beyond. Build a recognition system people **use daily** because it's fast, social, and genuinely rewarding — integrated where work happens (**Slack**), with points accruing toward real rewards (swag/gift cards; fulfillment out of scope per brief).

**North star:** engagement & ease of use. Depth on the recognition→reward→engagement loop, not breadth.

## 2. Design philosophy — "Recognition, not rewards" (the evidence-based spine)
Every design choice traces to a verified finding. The five principles:

1. **Lead with the message, not the money.** Foreground the peer's specific words + value; points are small and secondary. *(Crowding-out is real but conditional — only *controlling* rewards undermine; informational ones don't. D13; pass-1/2.)*
2. **Specific, sincere, public.** Require a written reason + a value tag; post publicly. *(Praise enhances motivation only when specific (d≈0.33); public recognition works via perceived fairness. D14/D16; pass-1/2.)*
3. **Immediate.** Kudos + points land instantly. *(Immediacy beats magnitude. D15; pass-1.)*
4. **Supportive, never controlling.** Allowance is "a gift to give," never a quota or a forfeiture; never claw back received points. *(Framing decides crowd-in vs crowd-out; loss aversion ~2×. D18/D22; pass-2.)*
5. **Inclusive, not competitive.** No winner-take-all leaderboard; celebrate many. *(Leaderboards generate no intrinsic motivation — complacency at top, frustration at bottom. D17/C1; pass-2.)*

## 3. Non-goals (explicitly out of scope)
- Reward fulfillment / payment / gift-card procurement (brief: out of scope).
- Performance reviews, goals, 1:1s, surveys (Lattice territory — not this; D9).
- SSO/enterprise admin, multi-tenant billing, mobile apps.
- Competitive leaderboards; punitive streaks (evidence-based exclusions).

## 4. Users & core loop
- **Giver** spends from a monthly give-allowance to recognize a peer in ~10s via Slack.
- **Receiver** gets public, specific praise + points toward a redeemable balance.
- **Everyone** sees the (team-scoped) feed; reacts to boost others.
- **Leadership** (light) sees participation health.

**Habit loop (Fogg B=MAP / Hook):** *pulsed weekly prompt* (trigger, at high-ability moment in Slack) → give kudos (action) → instant public recognition + points (reward) → boosts/received recognition (investment) → back to Slack. *(Notifications drive the moment not retention → pulse them. D23; pass-2.)*

## 5. Architecture (D6, Approach A)
```
Monorepo (TypeScript)
├── apps/web     → Next.js dashboard + API routes (feed, profile, rewards, light analytics)
├── apps/slack   → Slack Bolt worker (Socket Mode): /kudos modal, reaction boosts, weekly nudge
├── packages/db  → Prisma schema + client (shared); SQLite for demo
└── packages/sim → Simulation Lab (ABM + generative-agent vignette) — validation artifact
```
Two processes, one shared SQLite DB via a shared Prisma package. Demo runs locally (bulletproof); optional Vercel deploy of `apps/web` as a live bonus. SQLite→Postgres is a one-line datasource swap (D21).

## 6. Data model (small on purpose; scale-ready)
- **User** — `id, slackUserId, teamId, name, avatarUrl, email, giveBalance, redeemableBalance, isAdmin`
- **Team** — `id, workspaceId, name, slackChannelId` *(carries scale-ready scoping from day 1 — D21/D26)*
- **Kudos** — `id, fromUserId, toUserId, teamId, valueKey, message, points, createdAt, slackMessageTs`
- **Boost** — `id, kudosId, fromUserId, points, createdAt` *(unique per user+kudos)*
- **Value** — `id, key, label, emoji, description` *(seedable company values)*
- **Reward** — `id, name, cost, imageUrl, category`
- **Redemption** — `id, userId, rewardId, cost, status='requested', createdAt`

Allowance reset: **computed-on-read** (no cron; scales to any N — D21). Slack user directory **cached** in `User` (respect rate limits — D21).

## 7. Points model (D7/D18/D22 — hypothesis, framed safely)
- **Monthly give-allowance** (e.g., 100 pts) you can only give to others. Presented as **"your monthly gift to give away"** — a fresh gift each period, **never** "points you'll lose." *(No direct evidence for the allowance model — honest; framing keeps it supportive, not controlling. Loss aversion → never a forfeiture.)*
- **Received points** accumulate into a separate **redeemable balance** (→ rewards). **Never clawed back.**
- Reward the **recognized**, not the **recognizer** (anti-gaming — D19).
- Soft cap per kudos + required value/reason to resist **recognition inflation** (D19).

## 8. Engagement mechanics (each with research basis / and what we avoid)
| Mechanic | In/Out | Basis |
|---|---|---|
| ~10s Slack `/kudos` modal (teammate + value + written reason) | ✅ Core | Low-friction, specific praise (D14; pass-1/2) |
| Public post to team `#kudos` channel + web feed | ✅ Core | Public recognition via fairness (D16; pass-1) |
| Emoji-reaction **boosts** | ✅ Core | Turns one recognition into a group moment (relatedness) |
| Company **values** as categories | ✅ Core | Transparent, fair criteria (D16) |
| **Pulsed weekly** nudge to give | ✅ Core | Prompts drive action; pulse to avoid fatigue (D23; pass-2) |
| Inclusive celebration (feed, "recognized this week", rotating spotlights) | ✅ Core | Replaces leaderboard (D17) |
| Competitive top-3 **leaderboard** | ❌ Out | No intrinsic motivation; demotivating (C1/D17; pass-2) |
| **Streaks** (punitive) | ❌ Out | No evidence; burnout risk (D24) |
| Light, **opt-in** milestone badges | 🟡 Stretch | Help only those who notice (D24; Hamari 2017) |
| In-product AI "help me word it" assist | 🟡 Stretch | Lowers friction; on-theme "Use of AI" |

## 9. Scale strategy (D21/D26/D27/D28; `scale-considerations.md`)
- **Team-scoped recognition is the primary scaling lever** — participation inequality is largely an *artifact of scope* (~82% contributors in small groups vs ~2% in huge ones). Small scopes keep participation broad. *(Pass-3, Finding 1.)*
- Tiers: ~50 → single feed OK; ~500+ → default team-scoped feeds + curated global highlight; 1000+ → team-first, org rollups for leadership only.
- **~150–300 is a soft Dunbar zone**, not a hard line (C2; pass-3).
- Rollout: **seed diverse early givers**; support core recognizers (D27). Success = participation **breadth** + retention + volume per tier, not headcount (D28).
- Tech: DB trivial at these sizes; **Slack rate limits are the real constraint** → cached user directory, pagination, computed-on-read allowance.

## 10. Simulation Lab — validation artifact (D25/D29; `simulation-approach.md`)
- **ABM** (parsimonious; parameters grounded in pass-1/2/3 with provenance; multi-seed + sensitivity) → the 50/100/500/1000 comparison charts.
- **~8–12 generative LLM agents** → a qualitative "day unfolds" demo vignette **only**; **never** participation/inequality numbers (LLM agents too homogeneous — pass-4).
- All results framed as **directional hypotheses to A/B test**; a literature-grounded *what-if*, not a validated predictor. Honesty = credibility.

## 11. Maintainability (judged)
One language; small schema; seed script with demo data; README + this spec + the decision log; unit tests on the points logic (the part worth protecting). Documented `npm run dev`. SQLite→Postgres swap documented.

## 12. Demo plan (judged: presentation)
Live: give a kudos in Slack → appears in team `#kudos` + web feed instantly → boost with a reaction → show inclusive celebration + redeem a reward. Then: the **"why this works"** research slide (cited), the **scale** story (team-scoping + the ~82%→~2% number), and the **Simulation Lab** (charts + vignette, honestly caveated). Close with a roadmap slide.

## 13. Feature scope (build in priority order — product first)
**Priority 1 — Core product (must ship):** Slack `/kudos` giving; give-allowance + redeemable balance; public team feed + `#kudos`; boosts; values; pulsed weekly nudge; inclusive celebration surfaces; rewards catalog + "redeem" (logs request).
**Priority 2 — Simulation Lab (bounded validation artifact):** ABM comparison charts + one generative-agent vignette. Built *after* the core product is demoable, and time-boxed so it never threatens Priority 1 (D25).
**Priority 3 — Stretch (only if time):** opt-in badges; AI "help me word it"; leadership analytics tab; Vercel deploy.

## 14. Open items / risks
- **Allowance model unproven** — mitigated by framing (D18/D22); flagged honestly.
- **Time budget (~4h)** — Simulation Lab is bounded (D25); stretch items truly optional.
- **Slack app setup** — Socket Mode + personal workspace de-risks (D3/D4).
- **Product name** — TBD (repo placeholder `kudos-bounty`).
