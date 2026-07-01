# Kudos — a recognition-first, genuinely rewarding peer appreciation program

> **Bounty Hunters — Kudos Program** hackathon entry (Engineering Division, June 30 – July 20, 2026).
> Private repository for competition. All planning, research, and design decisions are documented here as we go.

## What we're building

A low-friction way for employees to **recognize colleagues for going above and beyond** — great teammate, handling difficult clients, showing up in a crisis — that people *actually want to use every day*. Recognition happens where work already happens (**Slack**), points accrue toward real rewards (swag / gift cards), and the whole thing is designed as a **behavioral nudge** that reshapes Slack habits toward gratitude and appreciation.

Inspiration: **Nectar / Bonusly** (recognition + rewards), grounded in real academic research on motivation and behavior change (see `docs/research/`).

## Design north star

**Engagement and ease of use above all.** The winning solution isn't the one with the most features — it's the one a real company would adopt because giving recognition becomes a 10-second daily habit.

## Judging criteria we're optimizing for

| Criterion | How we win it |
|---|---|
| Effectiveness | Solves the docx goal end-to-end; design decisions grounded in cited research |
| Use of AI | Built with AI-assisted development (documented); optional in-product AI assist |
| Ease of Use | ~10-second Slack flow; zero training required |
| Maintainability | One-language TypeScript stack, small data model, documented, tested |
| Presentation | Live Slack → dashboard demo + a "why this works" research-backed narrative |

## Repository map

| Path | Contents |
|---|---|
| `docs/brief/` | Original assignment (`.docx`) + plain-text transcription |
| `docs/decisions/` | Chronological decision log — every choice + rationale |
| `docs/research/` | Research reports (behavioral science, recognition programs) + citations |
| `docs/superpowers/specs/` | Living design spec |

## Status

🟡 **Planning & research** — grounding the design in real behavioral-science research before writing code. See `docs/decisions/decision-log.md` for the current state.

## Tech direction (provisional)

TypeScript end-to-end: **Next.js** dashboard (+ Prisma) and a **Slack Bolt** bot in **Socket Mode** (no public URL needed), against SQLite for a bulletproof local demo, with an optional Vercel deploy of the dashboard.

---

## Run locally (demo)

```bash
npm install
npm run db:generate && npm run db:push && npm run db:seed
# Terminal 1 — Slack bot (needs apps/slack/.env from .env.example)
npm run dev:slack
# Terminal 2 — dashboard
npm run dev:web   # http://localhost:3000
```

Run tests: `npm test`

---

_This project is developed with AI assistance (Claude Code). The development process itself is part of the "Use of AI" story and is documented throughout._
