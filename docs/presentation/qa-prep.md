# Q&A Prep — likely questions, crisp answers

For the shareout and a possible second-round technical deep dive. Answers are short enough to say out loud; each is backed by real code/docs so you can go deeper if pushed. Keep answers honest — where something is out of scope or is tech-debt, say so plainly. That candor reads as competence.

---

## Product & scope

**Q: Isn't point-redemption fulfillment the whole point? Why doesn't it actually ship a gift card?**
Fulfillment is explicitly out of scope in the brief — it's resolved later by the org. What we built is everything up to and including the *record* fulfillment would work from: a redemption is logged with the user, reward, cost, and a `status: "requested"` (`packages/db/src/rewards.ts`, `redeemReward`), visible in My Rewards. The admin/fulfillment side is a clean next step, not a rewrite.

**Q: Why a give-allowance instead of just letting people give freely?**
Two reasons, both deliberate. Scarcity makes recognition *thoughtful* — 100 points a month, roughly ten kudos, so you spend them on things that matter. And it's the anti-abuse mechanism: you can't spray 10,000 points at a friend, because `giveKudos` rejects once your monthly allowance is spent (`packages/db/src/points.ts`, `kudos.ts`). We frame it as "your monthly gift to give away," never "points you'll lose" — the research is clear that a forfeiture framing reads as controlling and backfires (decisions D18/D22).

**Q: No leaderboard? Isn't competition motivating?**
That was a deliberate, evidence-based call. Controlled experiments (Na & Han 2023) show leaderboards generate no lasting intrinsic motivation — complacency at the top, discouragement at the bottom. We replaced it with inclusive celebration: the full feed and a "recognized this month" strip. It's in the decision log with the correction history (D17/C1) so we can defend it.

**Q: What stops recognition inflation — everyone spamming "great job"?**
A required, specific written reason and a value tag on every kudos (`giveKudos` rejects an empty message), plus the fixed monthly budget. Vague praise is discouraged by design; the research is that praise only motivates when it's specific and sincere (D14).

**Q: Can you recognize yourself, or boost your own kudos to farm points?**
No. `giveKudos` throws on self-recognition; the demo seed and boost logic never let someone boost a kudos they received. Points reward the *recognized*, not the recognizer.

---

## Security & correctness

**Q: How is it secured? What stops me redeeming as someone else, or for points I don't have?**
Two things, both from adversarial review. First, identity comes from the session, never the request — the redeem endpoint calls `getCurrentUser()` (Auth.js Slack OIDC session) and ignores any user id in the body (`apps/web/app/api/redeem/route.ts`; the fix is commit `0c25884`, closing an IDOR). Second, the debit is a race-safe conditional decrement: inside a transaction we only subtract when `redeemableBalance >= cost`, so two fast clicks can't drive the balance negative (`packages/db/src/rewards.ts`; commit `d7e783a`). There are unit tests for the insufficient-balance and concurrent paths.

**Q: You said an AI review found a bug — what was it, really?**
The redeem API originally trusted a user id passed in the request body — classic IDOR, you could redeem against another account. A fresh security-reviewer agent caught it; the fix derives identity from the authenticated session instead. It's a real commit (`0c25884`), not a story.

**Q: Any known correctness gaps you're not hiding?**
Yes, and they're logged (decision D31). There's a bounded time-of-check/time-of-use window on the *allowance* check before the transaction — safe under the single Slack worker we run, and the *redeem* path is already fully transactional. There's no `tsc` typecheck gate in CI yet. We track these rather than pretend they don't exist.

---

## Architecture & tech choices

**Q: Why SQLite? That won't scale.**
SQLite is a demo choice, not an architecture choice. It makes the demo run anywhere with zero setup and zero network risk. Because everything goes through Prisma, moving to Postgres is a one-line datasource change — no query rewrites (decisions D6/D21). At the org sizes in question the database is never the bottleneck; Slack API rate limits are, which is why we cache the user directory and compute the allowance on read instead of running a cron.

**Q: Why Slack Socket Mode instead of HTTP events?**
Reliability. Socket Mode needs no public URL, no webhook signature verification, no 3-second-ack juggling — which removes the biggest live-demo failure mode and simplifies operations (decision D4). For production at scale you can move to HTTP events behind a proper endpoint; the handler logic doesn't change.

**Q: Why Next.js + TypeScript end to end?**
One language across Slack worker, web app, and data layer means one mental model and one place for the rules (all point logic lives in `packages/db/src`). That's a maintainability win — a judged criterion — and it's a stack AI tooling handles extremely well, so more of the time budget went into the product (decision D5).

**Q: How does the allowance reset each month without a scheduler?**
It's computed on read — `remainingAllowance()` sums points given in the current period and subtracts from 100 (`packages/db/src/points.ts`). No cron, no reset job, nothing to fail at midnight, and it scales to any number of users.

---

## Scale & production readiness

**Q: What would this need to run in production?**
Concretely: a real `AUTH_SECRET` and the Slack OAuth redirect/scopes configured; Postgres instead of SQLite (one-line swap); the Slack worker deployed as a small always-on process; and the fulfillment/admin surface for redemptions. Everything else — the schema, the point logic, auth — is already production-shaped.

**Q: Does it scale to 1000+ people, or does the feed become noise?**
The schema carries `teamId` from day one precisely for this. The research (pass-3, decisions D21/D26) says participation inequality is largely an *artifact of scope* — small scopes keep ~80%+ of people contributing; a single global feed at scale goes quiet. So the scaling lever is team-scoped feeds, with org rollups for leadership. It's designed in, not yet switched on — honest status: the queries aren't team-scoped in the web UI yet (tracked in D31).

**Q: What does it cost to run?**
Very little. Two small Node processes and a database. At these org sizes the DB is trivial; there are no per-message AI costs at runtime — the AI was used to *build* it, not to serve it. The real operational constraint is Slack API rate limits, which the caching and compute-on-read design already respects.

**Q: What about team-scoping gaps — you mentioned it's not fully done?**
Right. The data model supports it (`teamId` on users and kudos), but the web feed and store queries currently show the whole workspace, not a team lens. For the demo-scale single workspace that's correct behavior; for 500+ it's the first thing to turn on. It's a query-filter change, not a schema migration, because we modeled it up front.

---

## Use of AI (judged) — questions about the process

**Q: How much of this did AI write, and how do you know it's any good?**
Effectively all of it was AI-built, under a structured multi-agent process — but the safeguard is that *different* agents built and reviewed. Fresh-context reviewer agents found real defects (the IDOR, an accessibility blocker, a circular-import crash during the core build), each fixed and committed. And the logic that matters has 22 passing unit tests. The proof isn't "AI wrote it," it's that it's tested and was adversarially reviewed.

**Q: Is the research real or did the AI make it up?**
Real and checked. Each research pass adversarially verified its own claims and recorded confirmations *and* refutations — pass-1 was 23 confirmed / 2 refuted of 25 claims. Sourcing was restricted to legitimate open-access channels, no Sci-Hub (decision D11). The write-ups and citations are in `docs/research/`, and the decision log even records where we corrected the AI's earlier reasoning (C1, C2).

**Q: Could you maintain this if the AI weren't available?**
Yes — that was a design goal. One language, a small schema, tests on the core, and a decision log that explains *why* every choice was made. A human engineer can read the whole thing in an afternoon. The AI made it faster to build; it didn't make it opaque.

---

## If you get stumped

It's fine to say: *"Good question — that's tracked in our decision log / backlog as a known next step, let me follow up."* We deliberately kept `docs/decisions/decision-log.md` and `docs/BACKLOG.md` honest about what's shipped, deferred, and known-imperfect. Pointing to that is a stronger answer than bluffing.
