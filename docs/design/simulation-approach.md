# Simulation Approach — Modeling a Company Using the Kudos System

**Status:** 🟡 EXPLORATORY — approach note; pending research pass (`behavioral-research-report-pass4.md`) and a scope decision on how central this is to the hackathon build.

**Question:** Can we model a company of N "employees" (agents) using the kudos system over a simulated workday to see how well it performs, and compare across sizes (50 / 100 / 500 / 1000+)?

**Answer:** Yes — via a **hybrid Simulation Lab**. Two complementary techniques, each doing what it's best at.

---

## Technique 1 — Agent-Based Modeling (ABM) [quantitative, scalable]

Lightweight parametric agents, no LLM calls. Each agent has behavioral parameters, ideally **calibrated from our research findings**:

| Parameter | Source finding |
|---|---|
| Base propensity to give kudos/day | Participation power-law (pass-3) → most agents low, a few high |
| Reciprocity tendency (give back when received) | Reciprocity/favoritism dynamics (D19, pass-2/3) |
| Social network (who they work with) | Dunbar sub-layers (~5/15/50/150) — recognition flows along ties |
| Nudge responsiveness | Nudge review (pass-1): low-effort + reminder lifts action |
| Allowance-framing sensitivity | Crowding-out (pass-1): controlling framing depresses giving |
| Value/message specificity | Praise-quality finding (pass-1) |

**Run:** discrete time steps (a "day" = ticks). Each tick, agents may give kudos (based on params + who they interact with + whether nudged), react/boost, and the allowance burns down.

**Outputs (the comparison charts):**
- **Participation rate** (% who gave / received ≥1) at 50 / 100 / 500 / 1000
- **Recognition inequality** (Gini of kudos received) — does it concentrate at scale?
- **Feed density & noise** (kudos/day per channel) — when does it become a firehose?
- **Allowance burn-down** — how much of the monthly gift gets used
- **Coverage** — % of people who go a month with zero recognition (the failure mode)
- **Ghost-town risk** at small N vs **overload** at large N

**Why ABM:** cheap, fast, deterministic, scales to 1000+, and it directly answers "does org size change outcomes?" This is the workhorse.

## Technique 2 — Generative (LLM) agents [qualitative, demoable]

A small cast (~8–12) of LLM agents, each a persona ("Sarah, Support, just survived a client crisis"; "Dev who quietly unblocked three people"). They live a scripted "day," reason about who to recognize, and give kudos through the **actual system** (Slack/DB). Lineage: Park et al., *Generative Agents: Interactive Simulacra of Human Behavior* (2023).

**Why:** produces a believable, watchable "day unfolds" narrative for the demo — emotional, concrete, memorable. Not for statistics (too few, too expensive at N=50+).

## Recommended: Hybrid Simulation Lab
- **ABM** → the scaling comparison (charts across 50/100/500/1000).
- **~8–12 generative agents** → one qualitative vignette for the demo.
- Both **seed and exercise the real product**, so the sim doubles as an integration test + a source of realistic demo data.

---

## Honest validity caveats (validated by pass-4 — see `behavioral-research-report-pass4.md`)
- **Division of labor is now evidence-based:** **ABM** produces the quantitative scaling charts (it's heterogeneous by construction); **LLM agents** are ONLY for the qualitative vignette. LLM agents are documented to be **overly agreeable** (over-give/over-praise) and **homogeneous** (variance 20–300× lower than humans), so **participation/inequality numbers must NEVER be read off LLM agents** (Wu et al. 2025; Larooij & Törnberg 2025; Park et al. 2023).
- **ABM validity has hard limits:** equifinality means matching data ≠ correct mechanism (Windrum/Fagiolo/Moneta 2007); over-parameterized models can produce "any result" (JASSS 10/2/8). → **Keep it parsimonious; label every parameter's research provenance; run multiple seeds + sensitivity analysis; report how many parameters were tuned.**
- **We have no real employee data pre-deployment** → we **cannot truly validate** (Zhang & Vorobeychik 2017). Honest stance: the ABM is a **literature-grounded *what-if*, not a validated predictor.** Calibration template if data later exists: Janssen/DeCaro/Lee (2022, NetLogo BehaviorSearch).
- **Framing rule:** present all results as **directional hypotheses to A/B test in real deployment** — explicitly disclaim quantitative predictions of adoption rate, ROI, or specific inequality metrics (Wu et al. 2025). **Honesty about limits is the credibility signal**, not a weakness.

## Value to the hackathon
- **Effectiveness:** design validated, not just asserted; scale claims (D21) get quantitative backing.
- **Use of AI:** agent-based + generative-agent simulation is a strong, on-theme AI story beyond "AI wrote my code."
- **Presentation:** live "watch 50 agents run a day" + comparison charts = a standout demo beat.
- **Bonus:** the sim generates realistic seed data for the dashboard.

## Scope decision (resolved — D25)
**Validation artifact.** A focused script that produces the 50/100/500/1000 comparison charts (ABM) + one small (~8–12 agent) generative-agent "day" vignette for the pitch. **Not** a first-class product feature — the core Slack+dashboard+rewards build keeps priority in the 4h budget. Pass-4 research (feasibility/validity) will set the honest caveats and the credible build recipe.
