# Design Implications — From Evidence to Product Decisions

The bridge between `behavioral-research-report.md` and what we actually build. Each row: a research finding → a concrete, defensible design decision. This table *is* the "why this works" narrative for the demo.

| # | Research finding | Product decision |
|---|---|---|
| 1 | Crowding-out is real but conditional; only **controlling** rewards undermine, **informational** ones don't (CET; Fang & Gerhart β=.38) | **Lead with the message, not the money.** The kudos card foregrounds the peer's words + the value; points are shown small/secondary. Framing everywhere is "you were recognized," never "you earned $X for doing your job." |
| 2 | **Verbal praise enhances** intrinsic motivation; must be **specific, sincere, process-focused** | Require (or strongly nudge) a **written reason** and a **value/category**. Discourage empty "great job" — the modal prompts "what specifically did they do?" Optional AI assist helps people be specific, not generic. |
| 3 | **Immediacy beats magnitude** | Kudos posts to the channel/feed and points land **instantly**. No delayed/quarterly reveal as the motivator. Fast, glanceable confirmation. |
| 4 | Public recognition works via **perceived fairness/justice**; observer spillover | **Public-by-default** feed + `#kudos` channel. **Transparent, fixed value criteria** (the categories) so recognition looks fair and consistent, not arbitrary. |
| 5 | ⚠️ **Exclusive/scarce (top-3) recognition can demotivate the majority**; "exclusive beats universal" not significant | **Revised from D8.** No winner-take-all leaderboard. Use **inclusive** surfaces: full activity feed, "everyone recognized this week," rotating spotlights, optional team/value stats. If any ranking appears, it celebrates many and is **opt-in / low-stakes**, never a 3-winner scoreboard. |
| 6 | **Combine nudges**; target low-effort/low-salience; borrow **leadership legitimacy** | Combine three nudges: (a) a gentle periodic **prompt** ("anyone go above and beyond this week?"), (b) visible **peer activity** as social proof, (c) a **one-tap** give action. Seed adoption by having leaders give first. |
| 7 | SDT: satisfy **autonomy + competence + relatedness**, don't collapse to a transaction | Autonomy: giving is always **voluntary**, never mandated. Competence: recognition names a **specific strength**. Relatedness: recognition is **personal and visible** among peers. |
| — | Immediacy + low friction (B=MAP: prompt at the moment ability is high) | The whole giving flow lives **inside Slack** (~10s), where people already are, at the moment they think of it. |

## Decisions this changes vs. our earlier plan

- **D8 leaderboard → REVISED.** Drop the competitive "top-3 this month" scoreboard as a primary mechanic (Finding 5). Replace with inclusive celebration surfaces. This is a deliberate, evidence-based choice we can defend to judges.
- **D7 give-allowance → HYPOTHESIS, with a framing mandate.** Keep the monthly allowance (it solves the "no budget to give" and "spend-it" salience problems), **but the research gives no evidence for it and warns a spend-it-or-lose-it quota could read as *controlling*.** Mitigation: frame the allowance as **"your monthly gift to give away"** (autonomy-supportive, generous), **never** punish or shame unused allowance, and **never** require giving. Pass-2 research will test this.

## Anti-patterns to actively design against (from the skeptical angle + caveats)

1. **Recognition inflation** ("everyone gets 10 points for 'nice job'") → require a value + a real reason; consider soft caps per kudos.
2. **Reciprocity/favoritism gaming** ("you scratch my back") → make giving public and visible; surface patterns; don't tie *personal* rewards to *giving* volume (reward the recognized, not the recognizer).
3. **Notification fatigue** → conservative, batched nudge cadence (e.g., one weekly prompt), user-controllable; never spam.
4. **Extrinsic backfire** → keep money modest, downstream, and framed as a bonus; the redeemable balance is a nice-to-have, not the headline.
5. **Exclusivity demotivation** → inclusive surfaces (Finding 5).

## What we can honestly claim to judges

- ✅ "Our core loop (specific, immediate, public peer praise) is directly supported by SDT, a PNAS neuroimaging study, a 128-study meta-analysis, and a 363-person field experiment."
- ✅ "We deliberately avoided a top-3 leaderboard because the field evidence shows exclusivity can demotivate the majority."
- ✅ "We keep money quiet and downstream because crowding-out research shows controlling rewards undermine genuine motivation."
- ⚠️ "The allowance/gamification layer is a reasoned hypothesis; here's how we framed it to stay on the safe side of the evidence, and here's what we'd A/B test next." (Honesty = credibility.)
