# Decision Log

Chronological record of every significant decision, with rationale. Newest entries appended at the bottom. This is the project's memory.

---

## 2026-06-30 — Session 1: Brainstorming & scoping

### D1. Ambition level: **Play to win**
- **Decision:** Optimize for the $250 prize — maximize effectiveness, polish, and demo wow-factor.
- **Why:** User's explicit goal. Drives every scope/quality tradeoff toward a genuinely adoptable product with a strong live demo.

### D2. Platform: **Slack-first + web dashboard**
- **Decision:** Give kudos via Slack; a web dashboard shows the feed, leaderboard, points, and rewards catalog.
- **Why:** The brief explicitly makes "how it integrates into work life" a core judged element. Slack = where work happens (lowest friction, best adoption). The dashboard makes recognition social/visible and gives judges something visually impressive to see.

### D3. Slack access: **Personal/test workspace with admin rights**
- **Decision:** Build a real Slack app installed in a personal workspace.
- **Why:** User has admin on a personal workspace → we can do a live, real Slack demo rather than a simulation.

### D4. Slack transport: **Socket Mode**
- **Decision:** Use Slack Bolt in Socket Mode (no public request URL / ngrok).
- **Why:** Removes the biggest demo-reliability risk (public endpoints, signature verification, 3-second ack juggling). Simpler for a solo dev.

### D5. Tech stack: **TypeScript / Next.js + Slack Bolt** (chosen on merit, not preference)
- **Decision:** One language end-to-end — Next.js (dashboard + API + Prisma) + Slack Bolt (Socket Mode) + SQLite for the demo.
- **Why:** User explicitly asked for "whatever is best for the application." Rationale: single language = maintainability (judged); React/Tailwind = fastest path to a polished UI (presentation + ease of use); AI tooling handles this stack extremely well (more of the 4h budget goes to product, strengthens the "Use of AI" story); Socket Mode worker is a small Node process alongside Next.

### D6. Architecture: **Approach A — monorepo, two processes, shared DB**
- **Decision:** Next.js dashboard + Slack Bolt worker in one repo sharing a Prisma DB package. Run locally against SQLite for the demo (bulletproof), optional Vercel deploy of the dashboard as an "it's live" bonus.
- **Why:** Clean separation + real Slack + real dashboard + very maintainable, while keeping demo reliability of an all-local setup.
- **Rejected:** (B) Pure serverless Next + Slack HTTP events — fiddly/demo-risky. (C) All-local only — reliable but nothing "live" to show.

### D7. Points model: **Give-away monthly allowance** (Bonusly/Nectar-style)
- **Decision:** Each employee gets a monthly allowance of points to *give away* (resets monthly, can't hoard). Points *received* accumulate into a separate redeemable balance.
- **Why:** Separates "generosity currency" from "reward currency," which is what makes these systems stick and resists gaming. The expiring allowance is the engagement engine (spend-it-or-lose-it nudge). Pending research validation (see D11).

### D8. Engagement mechanics (provisional, pending research)
- Ultra-low-friction Slack giving (~10s modal); public-by-default posting to `#kudos` + live web feed; emoji-reaction "boosts"; company-values-as-categories; monthly leaderboard.

### D9. Scope discipline: **Recognition → reward → engagement loop, done deeply**
- **Decision:** Build the lean docx-faithful core; do NOT build a Lattice-class HR suite (reviews/goals/surveys). Narrate bigger vision as a roadmap only.
- **Why:** The brief asks for recognition + points + integration + (future) redemption — Nectar-inspired, not Lattice. Depth beats breadth in a 4h budget and with judges. Course-corrected after briefly over-scoping toward "Lattice replacement."
- **Lean core (5 pieces):** (1) Give kudos in Slack; (2) give-allowance points + redeemable balance; (3) public recognition (channel + web feed); (4) monthly leaderboard; (5) rewards catalog with a "redeem" action that logs a request (fulfillment out of scope).
- **Demoted to optional stretch:** leadership analytics tab; in-product AI "help me word it" assist.

### D10. Research-first: **Ground the design in real academic research before committing**
- **Decision:** Run a deep-research pass (nudge theory, Self-Determination Theory, employee-recognition studies, gamification, habit-formation frameworks, anti-patterns) before finalizing the design. Then a dedicated academic-sources pass for primary, citable, open-access papers.
- **Why:** User wants the plan grounded in real research (analogy: Ford "eco-leaves" behavioral nudge). Also directly strengthens the Effectiveness pitch and differentiates from pure vibe-code entries.

### D11. Research sourcing: **Legitimate open-access only (no Sci-Hub)**
- **Decision:** Do not use Sci-Hub. Source citable research via Google Scholar (open-access versions), PubMed/PMC, arXiv/PsyArXiv/SSRN, DOAJ, Semantic Scholar, and author-hosted PDFs.
- **Why:** Sci-Hub distributes paywalled papers without authorization. The foundational papers here (Deci/Koestner/Ryan meta-analysis, Ryan & Deci SDT, Fogg Behavior Model, Thaler & Sunstein) are largely available via legitimate open-access channels anyway.

### D12. Documentation & repo: **Private repo under `brandonrc`, document everything**
- **Decision:** Private GitHub repo in the `brandonrc` namespace. Commit all plans, designs, research, and decisions as we go.
- **Why:** User requirement — competition must stay private; wants every step well documented. (Note: brief requires final submission in a *personal* GitHub repo, which this satisfies.)

---

## 2026-06-30 — Session 1 (cont.): Research outcomes

Deep-research pass complete (27 sources, 25 claims adversarially verified, 23 confirmed / 2 refuted). Written up in `docs/research/`. Decisions it drove:

### D13. Lead with the message, not the money (crowding-out mitigation)
- **Decision:** Foreground the peer's written reason + the value; show points small and secondary. Frame everything as "you were recognized," never "you earned $X."
- **Why:** Crowding-out is real but conditional — only *controlling* rewards undermine intrinsic motivation; *informational* (competence-affirming) ones don't (CET; Deci/Koestner/Ryan meta-analysis; Fang & Gerhart field β=.38). Framing determines direction.

### D14. Require a specific, written reason + a value/category
- **Decision:** The give flow nudges (or requires) a written "what specifically did they do?" plus a value tag. Discourage empty "great job."
- **Why:** Verbal praise enhances motivation only when specific, sincere, process-focused (meta-analytic d≈0.33; Henderlong & Lepper).

### D15. Instant feedback loop
- **Decision:** Kudos posts and points land immediately; no delayed/quarterly reveal as the motivator.
- **Why:** Immediacy beats magnitude — immediate rewards raise intrinsic motivation independent of size (Woolley & Fishbach).

### D16. Public-by-default + transparent, fixed value criteria
- **Decision:** Feed + `#kudos` channel public by default; values are a fixed, transparent set.
- **Why:** Public recognition's benefit flows through *perceived organizational justice* (Bradler et al. field experiment ~5.2% lift + observer spillover; 2023 justice-mediation study). Fairness/consistency is the engine.

### D17. ⚠️ REVISED D8 — no winner-take-all leaderboard
- **Decision:** Drop the competitive "top-3 this month" scoreboard as a primary mechanic. Replace with inclusive celebration surfaces (full feed, "everyone recognized this week," rotating spotlights, optional team/value stats). Any ranking is opt-in, low-stakes, celebrates many.
- **Why:** Field evidence shows exclusive/scarce recognition can demotivate the majority (recipients rose only 3.3% vs non-recipients >10%), and "exclusive beats universal" was NOT statistically significant (Bradler et al.). Evidence-based, defensible to judges.

### D18. D7 allowance = HYPOTHESIS with a framing mandate
- **Decision:** Keep the monthly give-allowance, but (a) frame it as "your monthly *gift* to give away" (autonomy-supportive), (b) never punish/shame unused allowance, (c) never require giving, (d) reward the *recognized*, not the *recognizer* (anti-gaming).
- **Why:** Research surfaced NO evidence for the allowance model and warns a spend-it-or-lose-it quota could read as *controlling* (crowding-out). Framing keeps it on the safe side of the evidence. To be tested in pass 2.

### D19. Design against named anti-patterns
- **Decision:** Explicitly mitigate: recognition inflation (require value+reason, soft caps), reciprocity/favoritism gaming (public visibility; don't reward giving volume), notification fatigue (conservative weekly batched nudge, user-controllable), extrinsic backfire (money modest/downstream/bonus-framed).
- **Why:** Skeptical-angle sources + verification caveats. See `docs/research/design-implications.md`.

### D20. Run a second, targeted academic pass on the evidence gaps
- **Decision:** Launch a focused deep-research pass on the open questions the first pass couldn't answer: give-allowance model evidence, gamification mechanics (streaks/leaderboards/badges) sustain-vs-gaming, notification cadence/fatigue, peer-recognition points programs, Western/peer-to-peer replication.
- **Why:** First pass was honest that gamification mechanics are unsubstantiated in its corpus. Play-to-win → close the gap with real citations before finalizing the spec.

---

## Open questions / pending
- [ ] **Pass-2 research running** → firm up allowance/gamification mechanics with citations; then finalize spec.
- [ ] Update design spec §6–§7 (points model + mechanics) per D13–D19; add "research basis" to each mechanic.
- [ ] Product name (repo currently provisional: `kudos-bounty`).
- [ ] After spec finalized + user-approved → writing-plans skill for the implementation plan.
