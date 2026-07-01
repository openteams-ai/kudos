# Behavioral Research Report — Pass 3: Organization Size & Scale

**Date:** 2026-06-30
**Method:** Targeted deep-research pass on how org size / group scale affects peer-recognition and social-system dynamics (50 → 1000+). 7 angles → sources → adversarial verification (3-vote). Sources are largely online-community / open-source analogues (IRC, Reddit, GitHub, StackExchange, wikis, Twitter) — see honesty note.
**Full citations:** `academic-sources.md`.

## Headline

> **Design the kudos tool as a *federation of team/department-scoped recognition spaces*, not one company-wide feed. Seed a *diverse* set of early givers. Treat ~150 as a soft zone, not a hard line. Expect contribution concentration to sharpen ~10× as the visible group grows — and counter it by keeping recognition scoped small.**

---

## ⭐ Finding 1 — Participation inequality is largely an ARTIFACT OF SCOPE (high, 3-0) — the key lever
The same population looks completely different depending on group scope. Gasparini/Cabot et al. (OpenSym 2020, GitHub): random projects = **22.8% contributors / 69.8% watchers (~3:1)**; the 500 largest projects = **2.1% contributors / 87.4% watchers (~43:1)**. Contributor share falls ~10× and the observer:contributor ratio rises an order of magnitude as the group grows/gains prominence. "90-9-1 does not hold for the platform as a whole… results are reversed depending on the project."
→ **DIRECT DESIGN LEVER:** scoping recognition to **small sub-groups (50–150)** yields *far broader* participation than one big company-wide feed. This is the strongest, most concrete argument for team-scoped kudos, and it *quantifies* why a global feed goes quiet at scale. (Strongly validates D21.)

## Finding 2 — Critical mass = early contributor DIVERSITY, not headcount (high, 3-0)
Solomon & Wash (CSCW 2010, 282 IRC channel births): lifespan is predicted by message volume and — most decisively — **heterogeneity of early participants** (visible within ~2 hours). Channels with several subgroups survived better than those dominated by a small contributor clique. "Critical mass is established by developing a diverse set of community members… not purely by accumulating content."
→ **Seed adoption with a diverse cross-section of early givers across teams — not a few power-users.** (Refines D21 rollout.)

## Finding 3 — A concentrated core determines survival; fragility is structural from day one (medium, 3-0)
Abufouda (2018, StackExchange): high-degree "expert" nodes mainly drove activity/inactivity; decayed sites were **less resilient from inception**. (Single-author, correlational.)
→ **Identify & support core recognizers early; monitor redundancy of active givers as a leading indicator of a dying feed.**

## Finding 4 — Success is multi-dimensional; size is not the metric (high, 3-0)
Cunha/Zhang et al. (WWW 2019, ~46k Reddit communities): growth, retention, survival, and activity are weakly correlated and driven by different attributes.
→ **Track per-dimension health per tier (participation *breadth*, retention, sustained volume) — not headcount or total kudos.**

## Finding 5 — Dunbar's ~150 is a SOFT zone, not a hard ceiling (high, 3-0) — corrects our earlier framing
Confirmed as a **descriptive** pattern with nested layers (~5/15/50/150/500/1500, ~3× each; per-contact investment saturates ~150–200 ties — Goncalves 2011, 1.7M Twitter users). **But the hard neocortex-ceiling claim was refuted (0-3):** Lindenfors et al. (2021, Biology Letters) get estimates of 16–109 with 95% CIs of 4–520 — "specifying any one number is futile." Online networks may sustain **~200–300** active ties (Zhao et al.).
→ **Correction to `scale-considerations.md`:** don't treat 150 as a rigid threshold. Use a **soft ~150–300 zone** as "where relationship-based reciprocal recognition thins." Above it, default to team scoping — but as a gradient, not a switch.

## Finding 6 — Inequality is a TRUNCATED power law; lurkers ≈ 75%, not 90% (high, 3-0)
Wikia/Fandom study (PeerJ CS 2022, 6,676 wikis): a truncated power law fits better in 99.3% of cases; pure power law over-predicts how many/active the top contributors are; lurker share ≈ ¾, not 90%.
→ **Expect a concentrated core of givers, but don't over-assume the very top; design to broaden the base** (low-friction giving + pulsed nudges, D14/D23).

---

## Design guidance by tier (synthesized)

| Tier | What the evidence says | Product response |
|---|---|---|
| **~50** | One group is within the soft Dunbar zone; participation can stay broad; ghost-town risk if early givers aren't diverse | Single company feed OK; **seed diverse early givers**; leadership models giving |
| **~100** | Still near the zone; concentration starting | Encourage cross-team giving; watch for a clique dominating |
| **~500** | Well past the zone; scope-artifact kicks in → participation concentrates ~10× in a global feed | **Default to team/department-scoped feeds** + a curated global highlight; per-team health metrics |
| **1000+** | Federation of sub-communities; global anything is noise; contributor share lowest | **Team-first recognition**, org-level rollups for leadership only; strong filtering; monitor per-team core-giver redundancy |

## Honesty note (limits)
- Sources are **online-community / open-source analogues** (IRC, Reddit, GitHub, wikis, Twitter, StackExchange), **not workplace recognition tools.** The federation/scope-artifact and Dunbar findings transfer by analogy, not direct workplace measurement.
- **Open questions (unanswered by this corpus):** does feed/notification volume scale super-linearly with N and at what point does overload cut salience; does larger audience amplify or dilute recognition value; direct team-scoped-vs-company-wide comparison *in workplace tools*; how favoritism/gaming changes with N and transparency.
- Refuted (do not cite): "150 is a firm neocortex-derived cognitive ceiling" (0-3); "groups spontaneously fragment above ~20" (0-3).

## Net effect on the design
1. **Strongly validates D21** and upgrades it: team-scoped recognition isn't just tidy — it's the lever that *keeps participation broad* as N grows (Finding 1).
2. **Corrects the Dunbar framing:** soft ~150–300 zone / gradient, not a hard 150 switch (Finding 5).
3. **Adds a rollout principle:** seed *diverse* early givers; support core recognizers; watch per-team giver redundancy (Findings 2–3).
4. **Adds success metrics:** track participation breadth + retention + volume per tier, not headcount/total kudos (Finding 4).
