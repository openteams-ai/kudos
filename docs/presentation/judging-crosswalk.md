# Judging Crosswalk — evidence for each criterion

Maps each of the five judged criteria to **specific, verifiable evidence** in the repo — file paths, commits, and docs a judge or a second-round technical deep dive can open and check. Everything here is real; nothing is aspirational unless labeled **Roadmap**.

Legend: paths are relative to the repo root. Commit SHAs are on `main`.

---

## 1. Effectiveness of the Submission
*How well it solves the problem and delivers value.*

| Claim | Evidence |
|---|---|
| Solves the brief's core: recognize peers for going above and beyond, in the flow of work (Slack). | `apps/slack/src/kudosCommand.ts` — `/kudos` modal (who / value / specific reason) posts to `#kudos` and credits the recipient. |
| A complete recognition → reward → engagement loop, not a toy. | Give (`apps/slack`), receive + redeemable balance (`packages/db/src/kudos.ts`), browse/redeem (`apps/web/app/rewards/`), history (`apps/web/app/rewards/history/`). |
| Design is grounded in real research, not vibes — differentiator vs. pure vibe-code entries. | `docs/research/` (4 verified passes: `behavioral-research-report.md`, `…-pass2/3/4.md`, `design-implications.md`); every choice traced to a finding in `docs/superpowers/specs/2026-06-30-kudos-program-design.md` §2. |
| Deliberate anti-gaming / anti-inflation design. | Give-allowance cap 100/mo (`packages/db/src/points.ts`, `MONTHLY_ALLOWANCE`); required specific reason + value, self-recognition blocked (`packages/db/src/kudos.ts`, `giveKudos`); reward the *recognized*, not the recognizer; no competitive leaderboard (decision D17/C1, `docs/decisions/decision-log.md`). |
| Evidence-based choices judges can challenge and we can defend. | Decision log D13–D29 with rationale and citations; e.g. "no leaderboard" rests on Na & Han (2023). |
| Scales from a team to the whole org. | `teamId` in the schema from day one; scale strategy in `docs/design/scale-considerations.md` and decisions D21/D26–D28. |

---

## 2. Use of AI During Development
*How effectively AI accelerated development, improved quality, solved problems.*

| Claim | Evidence |
|---|---|
| Research-first: parallel AI research agents ran 4 adversarially-verified passes before product code. | `docs/research/README.md` and the four `behavioral-research-report*.md`; pass-1 summary: 27 sources, 25 claims verified, 23 confirmed / 2 refuted (`docs/decisions/decision-log.md`, Session 1 research outcomes). |
| Intellectual honesty encoded, not hidden — AI reasoning was checked, not rubber-stamped. | Decision log records **corrections** to its own earlier reasoning: C1 (fixed the leaderboard rationale), C2 (Dunbar is a soft zone, not a ceiling). |
| Parallel specialist implementation agents with clean context + strict file boundaries. | Build narrative in `git log`: catalog (`10ad821`), design system (`8a2823f`), store (`a61a859`), history (`1e08012`) landed as separate, scoped commits; core built subagent-driven (decision D31). |
| Adversarial review by fresh agents caught **real** bugs — quality, not just speed. | Security: `0c25884 fix(redeem): derive user from session, close IDOR` and `d7e783a fix(db): race-safe redemption with conditional decrement`. Accessibility: `ce79110 fix(web): a11y — announce redeem success, contrast, filter-button semantics`. |
| Prior review catches during the core build. | Decision D31 lists fixes found in review: circular-import TDZ crash → register-function pattern; double-`ack()` guard; `addBoost` P2002 idempotency (`packages/db/src/kudos.ts`). |
| The whole process is auditable. | `docs/decisions/decision-log.md` (chronological, D1–D31), `docs/superpowers/plans/` and `docs/superpowers/specs/` (plans and specs the agents worked from). |
| Full evidence map for this criterion, tied to commit SHAs. | `docs/ai-development.md` — the AI-development story: specs-before-code chronology, parallel scoped build, and the "caught by AI review" table (IDOR `0c25884`, redeem race `d7e783a`, WCAG `ce79110`, Docker secret leak `e04f9f3`, Slack injection `d10a947`, dotenv `a0079be`). |

---

## 3. Ease of Use
*How intuitive, engaging, and user-friendly it is.*

| Claim | Evidence |
|---|---|
| Giving takes ~10 seconds in a tool people already have open. | `apps/slack/src/kudosCommand.ts` — 3-field modal (`users_select`, value, reason). No new app to learn. |
| The store guides rather than dumps: crowd favorites, category filters, affordability states. | `apps/web/app/rewards/rewards-store.tsx` — `FeaturedCard`, category filter group, `RewardCard` affordable/`MorePtsHint` states. |
| A save-up mechanic that creates a goal, not a wall. | `SaveUpSpotlight` in `rewards-store.tsx` — progress bar to the nearest unaffordable reward; "Just N more points" when close. |
| Redeeming is safe and celebratory: confirm dialog → confetti → clear "Requested" state → history. | `ConfirmDialog`, `Confetti`, `RequestedTag` in `rewards-store.tsx`; `apps/web/app/rewards/history/page.tsx`. |
| Accessible, not just pretty (WCAG 2.2 AA pass). | `ce79110` — `role="status" aria-live="polite"` redeem announcement, `aria-pressed` filter buttons, focus restoration after redeem (`RequestedTag`), computed contrast; progressbar has `aria-valuenow/min/max`. |
| Warm, coherent visual system (not template-default). | Nebari design system: `8a2823f feat(web): Nebari design system`, `68c1039` layout shell; `docs/superpowers/specs/2026-06-30-kudos-program-design.md` and the UI refactor spec (`0f6272e`). |
| Signed-in experience is personal. | `apps/web/app/rewards/page.tsx` greets by name and shows the user's own balance via `getCurrentUser()`. |

---

## 4. Ability to Maintain
*How easy to understand, deploy, support, and enhance.*

| Claim | Evidence |
|---|---|
| The logic worth protecting is unit-tested and green. | `packages/db/src/*.test.ts` — **22 tests pass** (`rewards` 6, `kudos` 7, `users` 4, `points` 3, `period` 2). Run: `npm test`. |
| One language end to end; small, legible surface. | TypeScript monorepo; 7-model Prisma schema (`packages/db/prisma/`); spec §5–§6. |
| Single source of truth for the rules. | All point logic in `packages/db/src/` (`points.ts`, `kudos.ts`, `rewards.ts`), shared by both Slack and web — one place to change behavior. |
| One-command demo + reproducible data. | `npm run db:demo` → `packages/db/prisma/demo-seed.ts` (idempotent; preserves real Slack-linked users). |
| Deployment path to production is documented and cheap. | SQLite → Postgres is a one-line datasource swap (spec §5, decision D6/D21); `apps/web` is a standard Next.js deploy. |
| Decisions are recorded so future maintainers know *why*. | `docs/decisions/decision-log.md` (D1–D31 with rationale), `docs/BACKLOG.md` (what's shipped / requested / deferred), `docs/superpowers/specs/` and `/plans/`. |
| Known tech-debt is tracked honestly, not hidden. | Decision D31 "Accepted tech-debt": pre-transaction TOCTOU (bounded, single-worker safe), no tsc gate yet, web queries not yet team-scoped. |

---

## 5. Overall Presentation
*How clearly and professionally the demo explains the solution.*

| Claim | Evidence |
|---|---|
| A timed, rehearsed demo with a clear narrative arc and exact clicks. | `docs/presentation/shareout-script.md` — 7-minute beat sheet, demo path, pre-demo checklist. |
| Reliability engineered into the demo. | Socket Mode (no public URL / webhook signatures) — decision D4; local SQLite for a bulletproof run — D6. |
| A real fallback plan so a hiccup costs nothing. | `shareout-script.md` "Fallback plan" — recording + ordered screenshots + partial-failure branches. |
| Anticipated tough questions with honest answers. | `docs/presentation/qa-prep.md`. |

---

## Fast map for a technical deep-dive round

If judges want to open one file per theme:
- **Points economy:** `packages/db/src/kudos.ts` (give) + `packages/db/src/points.ts` (allowance) + `packages/db/src/rewards.ts` (redeem).
- **Security fixes:** `apps/web/app/api/redeem/route.ts` (session-derived identity) + `packages/db/src/rewards.ts` (conditional-decrement transaction).
- **UX/a11y:** `apps/web/app/rewards/rewards-store.tsx`.
- **Slack integration:** `apps/slack/src/kudosCommand.ts`.
- **Why it's designed this way:** `docs/decisions/decision-log.md` + `docs/research/`.
- **Proof it works:** `npm test` (22 passing).
