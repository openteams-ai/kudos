# How AI Built This Project

This project was developed with AI (Claude Code) as the primary implementer, working under a human who set direction, approved designs, and verified results. This page is an evidence map, not a testimonial: every claim below points to a commit SHA, a file, or a document you can open and check. The git history is the receipt.

The short version: AI did not just autocomplete code here. It ran the research, wrote the specs before the code, built features as scoped parallel workstreams, and — most importantly — reviewed its own output with fresh, clean-context agents that caught real security, concurrency, and accessibility bugs before they reached `main`. The bugs it caught are the interesting part, so they get a table with SHAs.

## The workflow

Every feature followed the same loop. Nothing was written straight to `main` from a prompt.

```
  RESEARCH  ──▶  SPEC  ──▶  PLAN  ──▶  PARALLEL BUILD  ──▶  ADVERSARIAL REVIEW  ──▶  FIX  ──▶  VERIFY
 (cited,        (design    (TDD      (scoped agents,       (fresh clean-context     (commit    (tests +
  verified)     doc,       task      strict file           reviewer agents)         w/ SHA)    live run)
                committed  list)     boundaries)                │                              │
                first)                                          └── finds bug ────────────────▶┘
```

### 1. Design-first: specs were committed before the code they describe

This is checkable in the commit dates. The design document for a feature lands as a `docs(spec)` commit, and the implementation commits come afterward — sometimes minutes later, sometimes weeks.

| Feature | Spec committed | Implementation began |
|---|---|---|
| Core kudos product | `2026-06-30` — research-backed design spec (`docs/superpowers/specs/2026-06-30-kudos-program-design.md`), then a 14-task TDD plan (`e73c318`) | `2026-06-30`, after the spec and plan (`9eae8ba`, `552a716`, …) |
| Slack SSO (identity) | `2026-07-01` — `73ae946 docs(spec)`, plus a 5-task plan `1849612 docs(plan)` | `2026-07-01`, after both (`baf8d60`, `9d57082`, …) |
| Warm/celebratory UI refactor | `2026-07-02` — `0f6272e docs(spec)` (Nebari palette) | `2026-07-17` — store build (`a61a859`, `8a2823f`, …), 15 days later against a written spec |

The design itself was grounded in **four adversarially-verified behavioral-research passes** run before product code existed (`docs/research/`): pass 1 alone drew on 27 sources and verified 25 claims, confirming 23 and refuting 2. Each design decision traces to a finding in the decision log (`docs/decisions/decision-log.md`, D13–D29). Crucially, the AI corrected its own reasoning twice rather than rubber-stamping it — logged as **C1** (the "no leaderboard" rationale was overstated; kept the decision on stronger evidence) and **C2** (Dunbar's ~150 is a soft zone, not a hard ceiling). Those corrections are preserved in the log, not silently rewritten.

### 2. Parallel build with strict file boundaries

Implementation ran as scoped workstreams — catalog, design system, store, history, database modes, Docker, docs — each landing as a separate, narrowly-scoped commit rather than one monolithic dump. You can see the boundaries hold in the log: the rewards catalog (`10ad821`), the Nebari design system (`8a2823f`), the store experience (`a61a859`), and redemption history (`1e08012`) each touch a disjoint set of files. The core product was built subagent-driven — a fresh implementer plus a spec/quality reviewer per task — as recorded in decision **D31**.

### 3. Adversarial review caught real bugs

Every tranche of work was reviewed by a separate agent starting from a clean context — no memory of *why* the code was written the way it was, only whether it was correct. This is where AI earned its keep. Each of these is a genuine defect that shipped a fix commit:

| # | What was caught | Severity | Fix commit |
|---|---|---|---|
| 1 | **IDOR in the redeem API** — the endpoint trusted a `userId` from the request body, so any signed-in user could redeem against anyone's balance. Fix reads identity from the server session; body carries only `rewardId`. | Security (auth) | `0c25884` |
| 2 | **TOCTOU race → negative balances** — a check-then-write gap let concurrent redeems both pass the balance check and overspend. Fix uses a conditional `updateMany` (decrement only where `balance >= cost`) inside the transaction and aborts on 0 rows affected. Shipped with a concurrency test firing five simultaneous redeems and asserting exactly one succeeds and the balance floors at 0. | Correctness (concurrency) | `d7e783a` |
| 3 | **WCAG 2.2 AA failures** — teal text on the light canvas fell below 4.5:1, redeem success was announced only visually, and category filters used half-implemented ARIA tabs. Fix adds a computed-AA `teal-ink` (`#0F7A72`) token, an `aria-live` status region, `aria-pressed` filter buttons, and focus restoration after redeem. | Accessibility | `ce79110` |
| 4 | **Slack token leak into Docker image layers** — `.dockerignore` patterns are *not* recursive like `.gitignore`, so a bare `.env` matched only the repo root and subdirectory secrets (`apps/slack/.env`) would have been `COPY`'d into the image. Fix adds `**/.env` variants and keeps only the secret-free examples. | Security (secrets) | `e04f9f3` |
| 5 | **Slack mrkdwn injection** — user-supplied names/reasons were interpolated into Slack message text unescaped, so input like `<!channel>` could ping the whole room. Fix escapes `&`, `<`, `>` on user strings while leaving mention markup intact. | Security (injection) | `d10a947` |
| 6 | **dotenv silently truncating a channel value** — `SLACK_KUDOS_CHANNEL=#kudos` parses as an empty string because dotenv treats an unquoted `#` as a comment. Root-caused and fixed by quoting the value in the templates, with an inline warning. | Config correctness | `a0079be` |

Two more catches came during the core build and are logged in **D31**: a circular-import temporal-dead-zone crash in the Slack app (fixed with a register-function pattern), a double-`ack()` guard, and `addBoost` P2002 idempotency with a real branch test.

## Tooling

- **Claude Code** as the development environment — reading the codebase, writing specs and code, running tests, and driving git.
- **Agent teams**: parallel specialist agents (research, seeding, design, store, database, Docker, docs) coordinated by an orchestrator via messages, with clean-context reviewer agents gating each tranche. The disjoint, scoped commit structure in the git log is the visible fingerprint of this division of labor.
- **Test-driven where it counts**: the point economy (allowance, giving, redeeming) is covered by unit tests — **22 passing** (`npm test`, `packages/db/src/*.test.ts`).

## Honest limitations

AI-generated code was not trusted on sight. It was gated by:
- **Automated tests** (22 passing) — the redeem race fix, for instance, was pinned by a concurrency test, not just asserted safe.
- **Independent review re-runs** by fresh agents, which is how bugs 1–6 above were found.
- **Live verification against real systems** — real Docker image builds, a real PostgreSQL migrate, and testing in a live Slack workspace (Socket Mode).

Some things still required a human in the loop. The live Slack SSO OAuth flow needs real tokens and a redirect URL configured on the Slack app, so it was verified by hand rather than in an automated test. Known tech-debt is tracked honestly rather than hidden (decision **D31**, "Accepted tech-debt"): a bounded pre-transaction TOCTOU on the allowance check (single-worker safe), no `tsc` typecheck gate yet, and web queries not yet team-scoped.

## What this means for maintainability

The artifact of this workflow is not just working code — it is a paper trail. A future maintainer inherits the spec that motivated each feature (`docs/superpowers/specs/`), the plan that structured it, the decision log that explains *why* each choice was made (including the ones the AI reconsidered), and a review history where each fix commit names the exact bug it closes. Because the review agents worked from clean context, the fixes they produced had to be justifiable to someone with no prior knowledge — which is precisely the position the next maintainer is in. The bugs a skeptical judge might worry an AI would introduce (an IDOR, a race, a contrast failure, a leaked secret) are in this repo as *closed, tested, commit-referenced* fixes. That is the case for trusting the code: not that AI wrote it, but that AI was made to check it, and the checks are on the record.
