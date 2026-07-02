# Web UI Refactor — Design Spec

**Status:** 🟡 For user review → then writing-plans.
**Date:** 2026-07-02
**Slice:** v2 #2 (UI refactor). See `docs/BACKLOG.md`.
**Related:** core spec `2026-06-30-kudos-program-design.md`.

## 1. Goal
Transform the functional-but-plain dashboard into a **warm & celebratory**, on-brand experience that makes recognition *feel* like a moment — targeting the judged **Ease of Use** and **Presentation** criteria. Purely a presentation-layer refactor of the three existing surfaces; no data-model or API changes.

## 2. Non-goals (out of scope for this slice)
- New screens (profile, history, web give-kudos flow) — later v2 slices.
- Cart/checkout, variable giving amounts, chat/App Home.
- Any change to `@kudos/db`, the Slack app, or API routes' behavior.

## 3. Direction (approved)
- **Personality:** warm & celebratory · **style:** "Playful Pop."
- **Palette — Nebari brand** (source: `nebari-dev/nebari-design`):
  - Purple `#BA18DA` — primary accent (buttons, links, badges)
  - Teal `#20AAA1` — points / success (points chips, positive states)
  - Yellow `#EAB54E` — celebration / gold (boosts, highlights)
  - Black `#0F1015` — primary text
  - **Light warm base:** canvas `#FBF7FB` (soft lilac-white), cards `#FFFFFF`, borders `#F0E1F5`, soft purple-tinted shadows.
  - Signature move: **purple→teal gradient** (`linear-gradient(90deg,#BA18DA,#20AAA1)`) on value badges + hero accents.
- **Type:** **Poppins** (display/headings, 600–800) + **Atkinson Hyperlegible** (body — also an accessibility win). Loaded via `next/font/google`.

## 4. Design tokens
Defined once as CSS variables in `globals.css` **and** mirrored into the Tailwind theme (`tailwind.config.ts`) so utilities + raw CSS agree.

```
--color-primary:#BA18DA; --color-teal:#20AAA1; --color-gold:#EAB54E;
--color-ink:#0F1015; --color-canvas:#FBF7FB; --color-card:#FFFFFF; --color-border:#F0E1F5;
--radius-card:18px; --radius-pill:999px;
--shadow-card:0 10px 26px rgba(186,24,218,.10);
--shadow-card-hover:0 14px 32px rgba(186,24,218,.18);
```
Tailwind `theme.extend.colors`: `primary`, `teal`, `gold`, `ink`, `canvas`, `card`, `borderx`; `borderRadius.card/pill`; `boxShadow.card/cardHover`; `fontFamily.display` (Poppins) / `fontFamily.body` (Atkinson).

## 5. Components (the reusable layer)
New under `apps/web/components/`, each small and single-purpose:
- **`Button.tsx`** — variants `primary` (purple, white text), `subtle` (bordered). Rounded-pill.
- **`Avatar.tsx`** — initials-in-circle (deterministic tint from name); optional `avatarUrl`.
- **`ValueBadge.tsx`** — props `{ emoji, label }`; purple→teal gradient pill, white text.
- **`PointsChip.tsx`** — props `{ points }`; teal chip, e.g. `+10 pts`.
- **`BoostPill.tsx`** — props `{ count }`; gold `🎉 N boosts`.
- **`KudosCard.tsx`** — composes Avatar + "X recognized Y" + ValueBadge + message + BoostPill + PointsChip + relative time; hover-lift; entrance animation.
- **`Confetti.tsx`** — client component; a small burst on trigger. Implemented with **`canvas-confetti`** (~10KB, no React deps) fired imperatively; degrade gracefully if unavailable.
- **`Nav.tsx`** — top bar (wordmark, Feed/Rewards, sign-in/avatar), extracted from `layout.tsx`.

## 6. Surface layouts
### 6.1 App shell (`app/layout.tsx` + `Nav.tsx`)
Light canvas; sticky top nav: **"Kudos"** wordmark (Poppins 800, purple), `Feed` / `Rewards` links, right-side **Sign in with Slack** or avatar + Sign out (existing auth wiring preserved — server actions unchanged). Thin purple→teal gradient hairline under the nav.

### 6.2 Feed (`app/page.tsx`)
- **Hero strip:** friendly greeting (personalized if signed in: "Welcome back, {first name}"), a prominent **Give kudos** CTA, and this-month stats (kudos count, participation). *Give-kudos on web is out of scope this slice → the CTA is a styled button that points to Slack (copy: "Give kudos in Slack — type `/kudos`"), linking to the `#kudos` channel where possible.*
- **"Recognized this month":** celebratory row of **Avatar** chips (distinct receivers this period) — inclusive, no ranking (honors D17).
- **Feed:** list of **KudosCard**s (30 most recent). Cards animate in on load; a **Confetti** burst plays when the most-recent card is brand-new (client-side, once).
- Empty state: warm "Be the first to recognize someone 🎉".

### 6.3 Rewards (`app/rewards/page.tsx`)
- **Signed-out:** a styled "Sign in to redeem" prompt card (keeps the existing `getCurrentUser()` gate).
- **Signed-in:** a warm **"Redeeming as {name}"** banner with a teal **PointsChip** balance; a responsive **RewardCard** grid (name, category, cost chip, affordability state, **Redeem** via the existing `RedeemButton`/`/api/redeem`). A **Confetti** burst on a successful redeem.

## 7. Motion & accessibility
- Motion is **CSS-first** (keyframe card entrance, hover lift, badge shimmer optional) + the small confetti helper. No `framer-motion` or other heavy animation deps. Respect `prefers-reduced-motion` (disable entrance/confetti).
- Body text uses **Atkinson Hyperlegible** on `#0F1015` for high legibility; target **WCAG AA** contrast for text. White text sits only on the gradient/purple/teal fills (large/bold badge text). Focus-visible rings on interactive elements. Buttons/links keyboard-reachable (server-action forms preserved).

## 8. Tech approach & file structure
```
apps/web/
├── app/
│   ├── layout.tsx            # shell → uses Nav; loads fonts via next/font
│   ├── globals.css           # design tokens (CSS vars) + base styles
│   ├── page.tsx              # feed: Hero + RecognizedStrip + KudosCard list
│   └── rewards/page.tsx      # banner + RewardCard grid (RedeemButton unchanged behavior)
├── components/               # [new] Button, Avatar, ValueBadge, PointsChip,
│                             #       BoostPill, KudosCard, Confetti, Nav
├── tailwind.config.ts        # theme.extend: colors/radii/shadows/fonts
└── package.json              # + canvas-confetti (only new runtime dep)
```
- Data fetching stays in the server components exactly as today (`prisma`, `currentPeriod`, `getCurrentUser`) — we restyle the markup, not the queries.
- Fonts via `next/font/google` (Poppins, Atkinson_Hyperlegible) wired in `layout.tsx`; exposed as CSS vars for Tailwind `fontFamily`.

## 9. Testing
- Presentational refactor → no new unit tests required; the existing `@kudos/db` suite (18 tests) must still pass unchanged.
- Verification per surface: `next dev` boots; `curl` each route returns 200 and contains expected content (feed shows kudos + "Recognized this month"; rewards shows the banner or sign-in prompt). Confetti/motion are visually confirmed live.
- `prefers-reduced-motion` path renders without animation.

## 10. Open items / risks
- **Fonts offline:** `next/font` self-hosts at build; if the build environment can't fetch Google Fonts, fall back to system stacks (Poppins→`system-ui`, Atkinson→`sans-serif`) — note in the plan.
- **`canvas-confetti` install** uses the npmjs registry fallback (local proxy is unreachable — see prior tasks).
- **Contrast check** on purple `#BA18DA` for any non-badge use — keep it for fills/large text, not small body copy.
- Give-kudos-on-web remains a later slice; this slice's CTA only routes to Slack.
