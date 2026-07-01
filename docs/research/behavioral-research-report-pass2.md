# Behavioral Research Report — Pass 2: Gamification Mechanics

**Date:** 2026-06-30
**Method:** Targeted deep-research pass on the mechanics pass-1 couldn't substantiate (allowance model, leaderboards, streaks, badges, notification cadence, peer-to-peer replication). 6 angles → sources fetched → claims adversarially verified (3-vote).
**Relationship to pass-1:** Confirms pass-1's core thesis AND **corrects one pass-1 interpretation** (see ⚠️ Finding 4). Full citations in `academic-sources.md`.

## Headline

> **"Recognition, not rewards."** The safe, evidence-backed mechanic is *specific social acknowledgment*. The risky mechanics are *competitive leaderboards* and *tangible/contingent payouts*. Framing (supportive vs controlling) decides whether any mechanic crowds motivation **in** or **out**.

---

## Finding 1 — Tangible rewards undermine; verbal/social recognition enhances (high, 3-0)
Deci, Koestner & Ryan (1999), 128-experiment meta-analysis: contingent tangible rewards undermined free-choice intrinsic motivation (d = −0.40 / −0.36 / −0.28 for engagement/completion/performance-contingent); **positive feedback enhanced it (d = 0.33 free-choice, 0.31 interest).** Undermining hits *interesting* tasks (d = −0.68), not boring ones.
→ **Points = social acknowledgment, not a payout. Lead with words.** (Reinforces D13.)

## Finding 2 — Framing is the decisive variable (high, 3-0)
Frey & Jegen (2001), Motivation Crowding Theory survey: interventions perceived as **controlling crowd OUT** motivation (impaired self-determination + self-esteem); perceived as **supportive crowd IN.**
→ **The allowance must read as "a gift to give" (supportive), never a "quota you must spend" (controlling).** (Reinforces D18.)

## Finding 3 — Peer/social recognition crowds motivation IN (medium, 2-1)
Gamified fitness-app study (2024, n=514): social recognition → intrinsic motivation β = 0.237 (p<0.001). **Caveats:** correlational SEM, Chinese fitness context, a companion claim refuted 0-3. → Supports peer-to-peer over manager-only, but hold loosely.

## ⚠️ Finding 4 — CORRECTION to pass-1: exclusivity = *conformity*, not *demotivation* (high, 3-0)
Re-reading Bradler et al. (2016, N=363): the thank-you card raised performance for ALL-recipients (~5.2%) and for best-3-of-8 (~7.3%); under exclusivity the gain was driven by **non-recipients (>10%) via social comparison/conformity**, while recipients rose 3.3%. This is **conformity, not demotivation** — and it was **manager→worker, not peer-to-peer**.
→ **Correction:** Pass-1 (and decision D17) said "exclusivity demotivates the majority." That overstated this study. **The anti-leaderboard conclusion still stands — but on the strength of Finding 5, not this study.**

## Finding 5 — Leaderboards are the riskiest mechanic (high, 3-0)
Na & Han (2023), controlled experiment (N=111): competitive leaderboards generated **no intrinsic motivation** in either group — high-rankers went **complacent** (chose easy tasks, withdrew); low-rankers worked harder but out of **competence frustration**, not satisfaction (negative competence↔effort correlation); no enjoyment difference.
→ **Direct evidence against competitive public leaderboards.** If any ranking is used: **cooperative/team-framed, opt-in, or personal-progress** — never a public competitive ladder. (Now the primary basis for D17.)

## Finding 6 — Loss aversion: never take points away (high, 3-0)
"Online reputational loss aversion" (StackOverflow, Decision Support Systems 2022, ~1.2M points): a reputational **loss depresses output ~1.5–3× more** than an equivalent gain increases it.
→ **Never claw back received recognition; never frame unused allowance as a forfeiture.** Present each period's allowance as a **fresh gift**, not points you "lose." (Refines D18.)

## Finding 7 — Badges can help — but only for those who notice them (high, 3-0)
Hamari (2017), 2-year field experiment on a real P2P service (N≈1,410 vs 1,579): the badge group posted/transacted/commented significantly more — **but the effect concentrated in users who actually monitored their badges.**
→ **A light milestone/badge layer is defensible IF opt-in / low-prominence**, not forced. (New — reconsiders whether *any* gamification beyond the core loop is worth it; see D22 note.)

## Finding 8 — Notifications: strong proximal prompt, weak on retention (high, 3-0)
Drink Less MRT (JMIR 2023, N=350): a notification raised app-open-within-the-hour **3.52×** — but **no** difference in time-to-disengagement (median 11/11/7 days, p=0.42). Workplace well-being MRT (JMIR 2018, N=1,255): tailored push raised next-24h engagement only 3.9%.
→ **Prompts drive the moment, not the habit.** Use timely nudges to trigger giving; don't expect volume to build retention.

## Finding 9 — Pulsed beats continuous nudging (medium, 3-0)
"How Nudges Create Habits" (SSRN working paper, real-time eco-feedback RCT): effects appear immediately, don't fatigue during treatment, decay slowly after; **intermittent (pulsed) feedback can outperform continuous.** Working paper + non-workplace domain → medium.
→ **Pulse the reminders** (e.g., a weekly prompt, occasional highlights) rather than constant pings. (Reinforces D19/D21 weekly-digest default.)

---

## Still unsubstantiated (be honest)
- **The spend-it-or-lose-it monthly allowance model** — **no** study directly tests it. Our design is a theory-grounded *hypothesis*; Finding 2 (framing) + Finding 6 (loss aversion) tell us **how** to frame it safely, not **that** it works.
- **Recognition streaks** — no direct evidence; streak-burnout concerns remain practitioner-level. Recommend **not** shipping punitive streaks.

## Net effect on the design
1. Correct D17's rationale; keep the decision (leaderboards out) — now backed by Na & Han (2023).
2. Refine D18: frame allowance as a *fresh gift*, never a forfeiture; never claw back received points (loss aversion).
3. Notifications: weekly *pulsed* prompt as trigger; don't rely on volume (Findings 8–9).
4. Optional: a *light, opt-in* milestone/badge layer is now defensible (Finding 7) — but stays a stretch, not core.
5. Streaks: avoid punitive streaks (no evidence, real downside).
