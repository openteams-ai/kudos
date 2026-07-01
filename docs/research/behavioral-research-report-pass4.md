# Behavioral Research Report — Pass 4: Simulation Validity & Method

**Date:** 2026-06-30
**Method:** Targeted deep-research pass on the validity of simulating a workplace kudos system (ABM + generative LLM agents). Adversarially verified (3-vote). **All findings high-confidence, 3-0.**
**Full citations:** `academic-sources.md`. **Applies to:** `docs/design/simulation-approach.md` (D25 validation artifact).

## Headline

> **Simulation is a legitimate *hypothesis-generation* tool, not proof. Use ABM for the scaling comparison (kept parsimonious, multi-seed, sensitivity-checked, parameters grounded in our own research). Use LLM generative agents *only* for a qualitative vignette — never for participation/inequality numbers, because LLM agents are too homogeneous. Frame every result as "a hypothesis to test in real deployment," never a prediction of adoption/ROI/inequality.**

---

## Finding 1 — ABM is the right method (high, 3-0)
Conte & Paolucci (2014, Frontiers): "ABM remains the only known approach apt to model and reproduce sets of heterogeneous agents interacting and communicating." → Justifies modeling employees as agents with heterogeneous give/receive propensities and network positions.

## Finding 2 — Validation is *the* hard problem; equifinality means matching data ≠ correct mechanism (high, 3-0)
Windrum, Fagiolo & Moneta (2007, JASSS 10/2/8) + Fagiolo et al. (2007, Computational Economics, 1000+ cites): "replication does not necessarily imply explanation — multiple different models may produce identical aggregate statistics." → **Even if our sim produces a realistic adoption curve, that is weak evidence the mechanism is right. Do NOT claim the sim identified the true drivers.**

## Finding 3 — Over-parameterized ABMs can produce "any result" (high, 3-0)
JASSS 10/2/8: with too many degrees of freedom "the model may be so numerous that it can generate any result… explanative potential little better than a random walk." → **Keep the model parsimonious; report how many free parameters we tuned and where each came from.**

## Finding 4 — Aggregate calibration overfits; calibrate *individual* behavior, validate out-of-sample (high, 3-0)
Zhang & Vorobeychik (2017, review of 43 diffusion ABMs): rigorous out-of-sample validation is uncommon; aggregate calibration overfits; individual-behavior calibration + held-out validation is more credible. → **We have no real employee data pre-deployment, so we CANNOT truly validate. Honest stance: our ABM is a literature-grounded *what-if*, not a validated predictor.**

## Finding 5 — A concrete calibration template exists (high, 3-0)
Janssen, DeCaro & Lee (2022, JASSS 25/4/3): calibrated a social-dilemma ABM to human lab data via NetLogo's genetic-algorithm optimizer (BehaviorSearch), with explicit fitness indices. → **Citable template** for how recognition/reciprocity could be parameterized (e.g., fraction of conditional cooperators) *if* we later get real data.

## Finding 6 — Generative agents produce believable behavior (high, 3-0)
Park et al. (2023, "Generative Agents", UIST): full memory+planning+reflection architecture beat a human-crowdworker baseline on believability; plausible social dynamics emerged from one seeded intention. → **Proof-of-concept that LLM agents can generate qualitatively plausible peer-recognition dynamics for a demo vignette.** (Caveat: emergence was partial.)

## Finding 7 — Interview-grounded agents replicate ~85% of human test-retest reliability (high, 3-0)
Park et al. (2024, "Generative Agent Simulations of 1,000 People", n=1,052): agents from ~2-hr life-history interviews replicated survey responses "85% as accurately as participants replicate their own answers two weeks later." → **Strongest positive evidence — but ONLY when grounded in rich real individual data**, which we won't have for the hackathon.

## ⚠️ Finding 8 — LLM agents are overly agreeable, formal, stereotyped (high, 3-0)
Park et al. (2023): tuning made agents "overly cooperative" ("rarely said no"), dialogue "overly formal." Larooij & Törnberg (2025, AI Review): impersonating individuals "misrepresents groups… exaggerated stereotypes"; responses "longer, more polite, articulate." → **Critical for a kudos sim: LLM agents will over-give and over-praise, inflating apparent participation. Do not read behavior rates off them.**

## ⚠️ Finding 9 — LLM agents are homogeneous ("average persona"), variance 20–300× too low (high, 3-0)
Wu et al. (2025, systematic review of 21 studies): LLMs "produce homogeneous outputs, acting as an average persona"; "<half assess behavioral variance, most that do report lower variance than humans" (20–300× smaller). → **This directly kills any LLM-agent claim about emergent *inequality* or *participation distribution* — inequality REQUIRES heterogeneity the agents don't have. Use ABM (heterogeneous by construction) for those metrics, not LLM agents.**

## Finding 10 — Validation is the central challenge; face validity ≠ evidence (high, 3-0)
Larooij & Törnberg (2025), titled "Validation is the central challenge for generative social simulation": LLMs may *worsen* validation (black-box, cultural bias, stochastic). Minimal yardstick: (i) purpose alignment, (ii) external grounding in human data / pre-registered benchmarks, (iii) robustness across multiple runs + sensitivity. 15/35 studies relied solely on subjective assessment. → **Run multiple seeds + sensitivity analysis; don't claim validity from "it looks plausible."**

## Finding 11 — Honest framing = hypothesis-generation, not proof (high, 3-0)
Wu et al. (2025): "constrain claims to collective-level qualitative patterns when variance is insufficient." → **Present results as directional hypotheses** ("network hubs may accumulate disproportionate recognition"; "a reciprocity-visible design may broaden participation") **to test via real A/B deployment. Explicitly disclaim quantitative predictions of adoption rate, ROI, or specific inequality metrics.**

---

## How this refines the Simulation Lab (D25)

| Component | Verdict | Rule |
|---|---|---|
| **ABM** (50/100/500/1000 comparison) | ✅ Use for the quantitative charts | Parsimonious; parameters grounded in pass-1/2/3 findings *with provenance labeled*; multi-seed + sensitivity analysis; framed as literature-grounded *what-if*, not validated prediction |
| **LLM generative agents** | ✅ Use ONLY for the qualitative vignette | ~8–12 agents for a demoable "day unfolds"; **never** derive participation/inequality numbers from them (Findings 8–9) |
| **Claims** | ⚠️ Constrained | Directional hypotheses to test in deployment; **no** quantitative adoption/ROI/inequality predictions |

## The demo narrative this enables (credibility, not overreach)
"We built an agent-based model, grounded its parameters in the behavioral research, and ran it across company sizes to *generate hypotheses* about how the mechanics interact at scale — then a small generative-agent vignette to make it tangible. We're explicit that this is hypothesis-generation, not proof; here's what we'd A/B test in a real rollout." **Honesty about limits is itself the credibility signal** the validation literature demands.
