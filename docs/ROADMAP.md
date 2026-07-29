# Kudos — merged product roadmap

Consolidating four OpenTeams "Bounty Hunters" hackathon entries into one product.

- **Base repo:** `openteams-ai/kudos` (née `brandonrc/kudos-bounty`, competition winner — transferred to the org 2026-07-29)
- **Merging in:** `spectre-ns/ot-hackathon`, `karamba228/OTKudos`, `samanklesaria/kudos-bot`
- **Status:** planning. Nothing below is built yet except what the base repo already ships.

This doc is the plan of record and lives at `docs/ROADMAP.md` in the base repo.
Read-only clones of the three other entries remain in the local `kudos-merge/`
reference directory. Phases and decision gates are tracked as GitHub issues.

---

## 1. Provenance — what each entry contributes

### `kudos-bounty` (base)
TypeScript monorepo: `apps/slack` (Bolt, Socket Mode), `apps/web` (Next 14 App
Router), `packages/db` (Prisma; SQLite with a generated Postgres variant).
Ships `/kudos` modal giving, reaction boosts, Slack OIDC sign-in, a 26-item
catalog, race-safe redeem, admin stats/queue/catalog, a self-locking first-run
`/setup` wizard, Docker + GHCR + CI, a Pages showcase, 34 Vitest tests, and a
four-pass behavioral-research trail with a decision log.

**Kept as the spine:** the stack, the identity model, the delivery pipeline, the
research provenance, and two deliberate product calls — no public leaderboard,
and a scarce monthly give-allowance.

### `ot-hackathon` (Python 3.14 / FastAPI / TinyDB / vanilla-JS SPA, 208 tests)
> ⚠️ The code is on the **`main`** branch. The default branch `master` is a
> one-line stub README. Anyone reviewing this repo needs to be told.

**Taking:**
- **Admin-editable workflow engine** — `app/workflow.py` is 131 lines of pure
  functions over a dict (states with color/`is_initial`/`is_terminal`,
  transitions with `requires_admin`/`requires_reason`), plus a per-order
  transition audit log and an interactive SVG diagram editor.
- **Settings-as-data** — a runtime settings store with defaults *and backfill of
  newly-added keys*, secrets excluded from the public bootstrap payload.
- **Three balances** — giving allowance / earned / *spendable*, where spendable
  nets out points escrowed in pending and approved orders.
- **Cart + grouped checkout + stock reservation** — multi-item orders as one
  workflow unit; oversell rejected with 409; rejecting an order restores stock.
- **Notifications** — bell with unread count, full stream page, deep links.
- **Three-tier roles** — User / Admin / SuperAdmin with a management UI.
- Optional later: GitHub sync (PRs/issues, configurable weights, an
  accumulate-off mode that tracks without awarding) and a CRM webhook
  (`X-CRM-Key`, six event types, idempotent on `reference_id`, demo simulator).

Independently reached the same conclusion as the base repo: admin-only stats, no
public leaderboard, explicitly to avoid gaming.

### `OTKudos` "Roots" (Next 16 / React 19 / Tailwind v4 / Prisma 6 / Auth.js v5)
Closest stack to the base, so these port near-literally.

**Taking:**
- **Settings UI** — tabbed Profile/Appearance/Account with shallow URL sync, a
  theme picker, and avatar by URL *or* local upload.
- **`nameCustomized` / `avatarCustomized` flags** — so a Slack directory sync
  never clobbers a user's own edits. The base repo has no equivalent and will
  need one the moment directory sync runs.
- **`components/ui/*` primitives** — tabs, card, field, label, badge, button,
  spinner, dropdown-menu.
- **Publish-now / approve-later moderation** — kudos visible immediately, points
  `PENDING` until an admin approves, adjusts, or rejects; reviewer + reviewedAt +
  rejectionReason audit fields.
- **`pointsAwarded` snapshot at submit** — later category edits never rewrite
  history.
- **Admin-managed categories** — name, icon, defaultPoints, isArchived.
- **`externalSubmissionId @unique`** — makes Slack modal-submit retries idempotent.
- **Derived balances** — aggregated over approved kudos, never stored.

Not taking: its leaderboard (conflicts with the base repo's deliberate call).

### `kudos-bot` (Python / Bolt / Postgres with logic in PL/pgSQL / Dash / llama.cpp)
878 lines, 48 tests. The economics entry.

**Taking:**
- **Money layer** — a `budgets` table keyed by month carrying `point_budget` and
  `conversion_rate` ($/pt), set by accounting, plus a monthly cron that reports
  redemptions to an accounting channel.
- **Overflow semantics** — when the budget is exhausted, kudos still record and
  `redeemed_at` still sets, but `overflow = true` and no payout is generated;
  `remaining_budget()` excludes overflow rows. Honest about *when* the budget ran
  out instead of silently failing.
- **LLM content gate** — classifies whether a message praises a specific,
  concrete action, and **fails open** ("assuming good faith"). Correct failure mode.
- **Per-pair caps** — daily and monthly caps per giver/recipient pair. Nobody
  else has any, and `ot-hackathon` lists this as an unresolved open question.
- **Edit/delete handling** — `message_changed` re-evaluates; `message_deleted`
  hard-deletes, *un-redeems* linked kudos, and re-runs redemption. Unique to this entry.
- **Measurement** — a Dash dashboard estimating the causal effect of
  conversion-rate changes on activity via interrupted time series / IRR with
  confidence intervals, backed by a marimo notebook validating the Poisson
  assumptions. Plus embed → KMeans → LLM-labelled topic clusters.

**Gated behind a decision (§4):** give-to-earn reciprocity — your Nth give
redeems your Nth received kudos, 1:1 oldest-first.

---

## 2. The crossover — most of the base repo's backlog is already built

Cross-referencing `docs/BACKLOG.md` against the other three:

| Base-repo backlog item | Status elsewhere |
|---|---|
| #3 Rewards cart + checkout | **Built** in `ot-hackathon` — grouped orders, line items, stock reservation, 409 on oversell |
| #5 Variable giving amounts | **Built** in `ot-hackathon`; base repo's own research note already specced 5/10/20/cap-25 |
| #2 Full web UI refactor | `OTKudos` has the primitives + settings shell; `ot-hackathon` has a design language + auto dark mode |
| #6 Chat with the app | `kudos-bot` has DMs + channel-join onboarding; `OTKudos` has `/balance` |
| Deferred: pulsed weekly nudge | **Built** in `kudos-bot` — `cron/weekly_reminder.py` DMs people who haven't given |
| Deferred: Simulation Lab ("pitch centerpiece") | **Built, more seriously,** in `kudos-bot` — `simulate.py` + Dash + ITS/IRR + diagnostics notebook |
| Deferred: reward fulfillment ("out of scope per brief") | `ot-hackathon` built a workflow engine for it; `kudos-bot` built accounting payout reporting |
| #4 Redemption history | Already shipped in the base repo — `BACKLOG.md` is stale on this line |

**Implication:** six of roughly nine open items are ports rather than builds. The
merge *is* v2. Sequence the work as a port program, not a feature program.

---

## 3. Repo strategy — morph in place, with one deliberate refactor

### Decision: keep the base repo, don't start fresh

What makes it the right base is mostly the unglamorous part: green CI, GHCR image
publishing, the dual SQLite/Postgres schema generation, a working first-run setup
gate, 34 passing tests, and the research + decision-log trail that maps directly
onto the judging criteria. That provenance is *why it won*, and a fresh repo
throws it away while buying nothing. It's also already the right stack for
absorbing `OTKudos` near-literally.

Two adjustments that are cheap now and annoying later:

- **Rename.** `kudos-bounty` is named for the hackathon ("Bounty Hunters"). If
  this is a product, the name is a spent artifact. Rename the repo and the
  `@kudos/*` package scope now, while there are no external consumers.
- **Move it to an org, don't re-create it.** The brief required a personal repo;
  that constraint has expired. `gh repo transfer` preserves history, issues, and
  stars — a fresh org repo preserves none of it.

### But: don't just pile nine phases onto `packages/db`

`packages/db` is ~305 lines of source across seven files, with all business logic
in the one package. That is exactly right for the MVP, and the README's claim —
"all logic lives in `packages/db`, so behavior can't drift between surfaces" —
is currently true. It stops being true when the rules number sixty instead of six.

The concrete pressure is visible in today's code:

- `giveKudos` hardcodes `POINTS_PER_KUDOS = 10`, takes a `valueKey` string with
  no category table, has no status field, no content gate, and no per-pair cap.
  P0 and P2 both rewrite it.
- `redeemReward` debits a stored `redeemableBalance` and creates a `Redemption` in
  one transaction. P4 and P5 need escrow-reserve + workflow-init +
  stock-decrement + budget-check + overflow-mark. That is not an edit to this
  function; it is a different function.

So: **one seam refactor as part of P0**, before feature work lands on top.

### Target shape

```
packages/
  db/      Prisma client, schema, migrations, seed. NO business logic.
  core/    All domain rules, as folders — not separate packages:
             recognition/  giving, boosts, categories, moderation, caps
             rewards/      catalog, cart, orders, stock, escrow
             economy/      allowance, balances, budgets, conversion, overflow
             workflow/     state machine (ported from ot-hackathon)
             settings/     registry, defaults, backfill
apps/
  web/     Next.js
  slack/   Bolt
```

Two packages, folders inside. Resist splitting `core` into eight packages until
it actually hurts — the single import graph is what keeps the no-drift property.

**One discipline to enforce:** `apps/*` never import `@prisma/client` directly,
only `@kudos/core`. Add a lint rule, because this is the invariant that decays
silently.

### Sequencing correction

An earlier sketch of this plan had P0 as a single mega-migration covering
recognition, rewards, and economy schema. That is wrong — it would be a
multi-week phase that ships nothing user-visible and churns as later decisions
land. **Each phase owns its own migration.** P0 covers the recognition side only.

### Repo mechanics

**History is clean** — verified: `.env` was never committed and is properly
gitignored, no `.db` files are tracked, and the only secret-shaped strings in
history are placeholders (`replace-me`, `dev-only-not-a-real-secret-000…`) inside
a planning doc. Nothing forces a history rewrite or a fresh repo.

1. ~~Rename + `gh repo transfer` to the org first, before any code work.~~
   **Done 2026-07-29** — repo transferred to `openteams-ai/kudos`. The
   `@kudos/*` package-scope rename is still open.
2. **Add `OTKudos` as a git remote and cherry-pick its ports.** Same stack (once
   P0a lands), so commits apply — and `karamba228` stays the commit author, making
   attribution structural rather than a line in CREDITS. The two Python entries
   are cross-language idea-ports and cannot work this way; they get CREDITS plus
   doc references to the original implementation.
3. **Branch the seam refactor.** P0 touches every import; not a main-line commit.
4. `kudos-merge/` stays a read-only reference library of the three clones.

---

## 4. Decision gates

Settle these before the phases they gate. Each leaves marks on the schema.

### Gate A — Reciprocity (gates P6, shapes P0 lightly)
`kudos-bot`'s give-to-earn is the most interesting idea in the whole set, and it
fights the base repo's recognition-first thesis: a recipient who is shy about
giving earns nothing, which penalises exactly the quiet contributors recognition
programs exist to surface.

**Recommendation:** ship it as a setting — `off | soft nudge | hard gate` —
defaulting to `soft nudge` (show "give N more to unlock your pending payouts",
don't withhold). Preserves the idea, keeps the thesis, and makes it an org
policy choice rather than a product bet.

### Gate B — Money vs. swag (shapes P4/P5)
The base repo redeems to a swag catalog. `kudos-bot` converts points to dollars.
`ot-hackathon` does swag with an approval workflow.

**Recommendation:** one `Reward.kind` discriminator (`catalog | cash`), both
flowing through the same workflow engine with different terminal states
(`shipped` vs. `paid`). Cash needs the budget/conversion layer; catalog needs
stock. The workflow engine carries both, which is what makes it worth porting.

Do not build real fulfilment (§6) — hand off to a human at the terminal state,
as all four entries do.

### Gate C — Derived vs. stored balances (shapes P0, sharpest of the three)
The base repo **stores** `User.redeemableBalance` and increments it in the same
transaction as the kudos insert. `OTKudos` **derives** balances from approved
kudos and stores nothing. `ot-hackathon` derives three.

Deriving is more correct: with an approval queue, escrow, boosts, and overflow
all in play, a stored balance has four independent ways to desync, and no audit
trail when it does.

**The catch, and it's a real one:** the stored balance is currently *also* the
race-safety mechanism. `redeemReward`'s conditional decrement
(`updateMany where balance >= cost`) is what makes concurrent redeems unable to
go negative. Remove the stored column and that guard disappears — redemption
needs a different one (an escrow row plus a serialized check).

**Recommendation:** derive `earned`, compute `spendable = earned − escrowed`, and
replace the conditional-decrement guard with an escrow-insert guard in the same
transaction. Add a materialised cache only if read performance demands it, and
never let the cache be the source of truth. This is the single most important
design conversation in P0 — get it wrong and every later phase inherits drift.

### Also unresolved: Postgres now or later?
`kudos-bot`'s anti-abuse leans on `pg_advisory_xact_lock`. The base repo's
conditional-decrement pattern gets race safety without advisory locks, so this is
really a question about whether per-pair caps (P0) need true serialization.
Lower stakes than A–C; the dual-schema generation already exists. Decide at P0,
default to keeping SQLite for demo and Postgres for real.

---

## 5. Phases

Sizes are relative (S/M/L), not calendar estimates.

### P0a · Stack alignment — **M**, do before P0
The base repo is meaningfully behind the repo we're porting most heavily from:

| | base (`kudos-bounty`) | `OTKudos` |
|---|---|---|
| Next | ^14.2.5 | 16.2.10 |
| React | ^18.3.1 | 19.2.4 |
| Tailwind | ^3.4.0 | ^4 |

Tailwind 3→4 moved to CSS-first config (`@theme` in CSS, no `tailwind.config.ts`),
so every `components/ui/*` file we port arrives in v4 idioms. Upgrade the base
repo to Next 16 / React 19 / Tailwind 4 rather than hand-adapting each port — a
bounded one-time task with 34 tests as the safety net, versus an adaptation tax on
every port. Heed `OTKudos`'s own `AGENTS.md` warning that Next 16 has breaking
changes that won't match model training data; read `node_modules/next/dist/docs/`.

*Done when:* 34 tests green, `npm run build` clean, and an OTKudos `ui/*`
cherry-pick applies without styling rework.

### P0 · Seam refactor + recognition schema — **L**, blocks everything
Split `packages/db` into `db` + `core` per §3. Then the recognition-side
migration: categories as data (replacing seeded `Value` rows, migrating the
existing five); `status` + `pointsProposed`/`pointsAwarded` + reviewer audit
fields; `externalSubmissionId @unique`; indexes for per-pair caps; resolve Gate C.
Rewrite `giveKudos` to take a validated point amount (backlog #5, using the
already-specced 5/10/20/cap-25 tiers).

*Done when:* the 34 existing tests pass green against the new seams, `apps/*`
import only `@kudos/core`, and variable point amounts work end to end.

### P1 · Settings-as-data — **S**, unblocks all later config
`ot-hackathon`'s settings store (defaults + backfill of newly-added keys, secrets
excluded from the public bootstrap) behind `OTKudos`'s tabbed settings UI and
`ui/*` primitives. Also lands the `nameCustomized`/`avatarCustomized` sync-safety
flags. Cheap, and every later phase wants to be configurable.

### P2 · Moderation pipeline — **M**
The three-way compose that beats all four entries individually: LLM gate at
submit (fail open) → publish immediately → points pending → admin approves,
adjusts, or rejects. Plus per-pair daily/monthly caps and `kudos-bot`'s
edit/delete re-evaluation.

### P3 · Workflow engine — **S–M**
Port `app/workflow.py` (131 lines of pure functions — moves nearly verbatim) plus
the per-order transition audit log. The SVG diagram editor is a separate,
optional, demo-winning increment; treat it as P3b.

### P4 · Cart + checkout + escrow + stock — **M**
Backlog #3 and the escrow half of Gate C, satisfied by porting `ot-hackathon`'s
grouped-order model: multi-item orders as one workflow unit, stock reservation,
409 on oversell, stock restored on reject. Owns its own migration
(`Order`, `OrderLineItem`, `OrderTransition`; existing `Redemption` rows migrate
to single-line orders).

### P5 · Money layer — **M**, gated by Gate B
`Budget` by month with point budget and conversion rate, overflow semantics, and
the monthly accounting report. Cash rewards reach a `paid` terminal state.

### P6 · Reciprocity — **M**, gated by Gate A
`off | soft nudge | hard gate` as a setting.

### P7 · Engagement surface — **M**
Notifications bell + stream + deep links (from `ot-hackathon`), Slack App Home
tab (backlog #6), weekly nudge DMs (from `kudos-bot`, and the base repo's
deferred "pulsed weekly nudge").

### P8 · Measurement — **L**, deliberately last
The ITS/IRR dashboard and topic clustering. Last on purpose: it needs months of
real data to say anything, and it is the one feature that is worthless on seed
data. Until then it would be a demo prop rather than an instrument.

### P9 · Integrations — **L**, optional
GitHub sync and the CRM webhook. Genuinely optional, scope-dependent, and the
least core to "recognition." Carries `ot-hackathon`'s unresolved scoping
questions (§7).

---

## 6. Greenfield — what no entry built

Worth naming, because the merge does not cover it:

- **Real fulfilment.** Every entry stops at a state label. No gift-card issuance,
  no payroll hand-off. `kudos-bot` gets closest by reporting to an accounting
  channel, and still hands to a human.
- **Multi-tenant / workspace isolation.** The base schema carries `workspaceId`
  and `teamId`; nothing enforces them.
- **Auth hardening.** `ot-hackathon` explicitly scoped it out. The base repo's
  first-run gate is the only real work in this area across all four.
- **Manager / HR views.** Org rollup, and specifically *who has never been
  recognized* — the inclusion problem the base repo's research raises and no
  entry's UI answers.

---

## 7. Inherited open policy questions

Unresolved across the entries, and now ours:

- Final core-values list and copy — the four entries use three different sets.
- Does the monthly allowance vary by role or tenure?
- Anti-gaming posture beyond per-pair caps: per-recipient caps, manager approval,
  or trust-based?
- How are admins designated in real deployment? (The base repo's self-locking
  first-run `/setup` gate is the best answer any entry has — probably just adopt it.)
- GitHub sync scoping: all public activity vs. specific orgs/repos, manual vs.
  scheduled. Should PR reviews be a weighted contribution type?
- CRM API key distribution and rotation.
- Hosting target.

---

## 8. Credits

Three of the four subsystem clusters below come from other people's work:
`spectre-ns` (workflow engine, settings, escrow, cart, notifications, roles),
`karamba228` (settings UI, moderation model, UI primitives, sync-safety flags),
`samanklesaria` (money layer, overflow, LLM gate, per-pair caps, measurement).

Worth adding a CREDITS section to the README and, more practically, inviting each
of them to review the port of their own subsystem — they know the edge cases that
aren't in the code.
