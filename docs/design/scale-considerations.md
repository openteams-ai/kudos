# Scale Considerations — How Org Size (N) Shapes the Kudos System

**Question:** Does company size (50 / 100 / 500 / 1000+ employees) change how this system should be designed and built?
**Answer:** Yes — on two independent axes: **behavioral/program dynamics** and **technical architecture**. The behavioral effects are the bigger design driver; the technical scaling is modest until Slack rate limits.

> Status: 🟡 Behavioral-at-scale claims (critical mass, Dunbar, participation power law) to be validated by a focused research pass. Technical reasoning is engineering judgment. Sections tagged _(needs research)_ accordingly.

---

## Part 1 — Behavioral dynamics by org size

### The core tension: relatedness vs. reach
Recognition draws its power from **relatedness** (SDT) and **perceived fairness** (Bradler et al.). Both degrade as N grows unless we deliberately scope visibility.

| Org size | Dominant dynamic | Primary risk | Design response |
|---|---|---|---|
| **~50** | Everyone knows everyone; high relatedness | Low volume → **"ghost-town feed"**; reciprocity/favoritism visible to all | Seed with leadership giving first; low barrier; single company-wide feed is fine |
| **~100** | Approaching relationship ceiling | Cliques; some people never recognized | Encourage cross-team giving; surface "not recognized lately" gently |
| **~150 (Dunbar)** _(needs research)_ | Upper bound of real relationships | Beyond this, most colleagues are strangers → recognition feels abstract | **Introduce team/department scoping** as the default lens |
| **~500** | Multiple sub-communities | Single `#kudos` channel = **firehose → notification fatigue + recognition inflation**; individual kudos lose salience | Team channels + a global highlight/digest; per-team feeds; batched digests |
| **1000+** | Federation of teams | Global anything (feed, leaderboard) is noise and demotivating | Team-first surfaces; org-level rollups for leadership only; strong filtering |

### Key size-driven effects

1. **Critical mass / network effect** _(needs research)_ — recognition tools need a threshold of active givers or the feed looks dead and the habit never forms. Small orgs hit this faster per-capita but have fewer total givers; large orgs have volume but per-team density can still be thin. → **Seed adoption; measure per-team participation, not just org totals.**

2. **Dunbar's number (~150)** _(needs research)_ — below it, recognition is genuinely relational; above it, cross-strangers recognition is rare and lower-signal. → **Default the visibility lens to the team/group above ~150 people.**

3. **Feed noise & signal loss at scale** — a single global channel at 500–1000+ produces so many kudos that each one loses salience (dilution) and pings become fatiguing. This *directly* interacts with our anti-pattern list (D19: notification fatigue, recognition inflation). → **Scope channels by team; use digests; keep the global surface a curated highlight, not the raw firehose.**

4. **Leaderboard demotivation compounds with N** — our evidence-based decision to drop a winner-take-all leaderboard (D17) gets *stronger* at scale: in a 1000-person org, a global top-3 means 997 people are visibly "not winning." → **Reinforces D17. Any ranking is team/peer-group scoped and low-stakes.**

5. **Reward-layer economics scale linearly** — redemption cost ≈ headcount × allowance × redemption-rate × point-value. Trivial at 50, a real finance line at 1000+. Fulfillment is out of scope for the hackathon, but this shapes **allowance sizing and the need for configurable/tiered allowances and budget caps.**

6. **Participation is power-law distributed** _(needs research)_ — a minority of people give most recognition. At scale this concentration risks a few loud voices. → **Lower the giving barrier and nudge the quiet majority; broaden the base rather than reward the top givers (also anti-gaming, D18).**

---

## Part 2 — Technical architecture by org size

**Headline:** 50 → 1000+ users is *small* for the tech. The load driver is **events** (kudos, reactions, feed reads), not user count — and even 1000 users × a few kudos/day is only thousands of writes/day. The architecture (Approach A) does **not** need to change. What changes is a handful of scale-hygiene choices, most of which we bake in now for free.

| Concern | 50–150 | 500–1000+ | Decision |
|---|---|---|---|
| **Database** | SQLite fine | Postgres | Shared Prisma package → **datasource swap is one line**. No redesign. |
| **Slack API rate limits** ⚠️ | Negligible | **The real constraint** | **Cache the Slack user directory** in our DB; sync periodically + on-demand; never call Slack per interaction. Paginate `users.list`. |
| **Feed reads** | Trivial | Needs pagination | **Cursor pagination + indexes** on `createdAt`, `toUserId`, `teamId`. |
| **Allowance reset** | Trivial | Must not fan-out over N users | **Computed-on-read** (already chosen, D-spec §5) → scales to any N with zero cron. ✅ |
| **Slack posting volume** | Fine | Could hit limits | Post to **team channels** (spreads load); queue posts only if needed (future, not for 1000). |
| **Multi-team / multi-tenant** | One workspace | Many teams / many companies | **Carry `teamId`/`workspaceId` in the schema from day 1** — cheap insurance so we never repaint. Full multi-tenant isolation is out of scope for the hackathon. |
| **Notifications** | Per-event OK | Fatiguing | **Tunable cadence; default weekly digest** at scale; per-event only for direct recognition. |

### Cheap future-proofing to bake in NOW (build small, don't paint into a corner)
1. `teamId` / `workspaceId` columns on `User`, `Kudos` (even if the demo uses one team).
2. **Cached Slack user store** instead of live per-interaction calls.
3. **Computed-on-read** allowance (confirmed correct at scale).
4. **Configurable allowance size** (so program budget scales with headcount).
5. **Visibility scoping hooks** — a kudos can target a team channel + a global feed; demo uses one, but the seam exists.
6. **No global leaderboard** — reinforced by scale; any ranking is team/peer-scoped.
7. **Tunable nudge cadence** (weekly digest default).

---

## What this means for the hackathon build

Build the **simple, single-workspace version** for the demo (small N), but make the **team/workspace boundaries explicit in the schema** and articulate the scaling story. That "here's exactly how it behaves and scales from 50 to 1000+ people, and why we scoped it this way" narrative is a strong, concrete answer to the judges' **Maintainability** and **Effectiveness** criteria — most vibe-code entries won't have thought about it at all.
