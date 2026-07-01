# Product Backlog — historical requests & status

Running list of everything asked for, so nothing gets lost. Newest asks noted; status tracked. This is a living doc.

Legend: ✅ done · 🟡 in design · ⬜ not started · 🔁 enhancement of existing

## Shipped (core MVP — on `main`)
- ✅ Give kudos in Slack (`/kudos` modal: teammate + value + reason)
- ✅ **Monthly give-allowance cap** (100 pts/mo, computed-on-read; can't over-give) ← the "bad-actor / can't give 10,000" protection already exists
- ✅ Separate redeemable balance (received points), never clawed back
- ✅ Public recognition feed + inclusive "recognized this month" (no leaderboard, by research)
- ✅ Reaction boosts
- ✅ Rewards catalog + one-click redeem (logs a `Redemption{status:"requested"}`)
- ✅ Demo-data generator (`npm run db:demo`)
- ✅ Live Slack connection (Socket Mode) + token-verify + app manifest

## v2 — requested, prioritized (identity first, per user)
1. 🟡 **Sign in with Slack (SSO)** — identity backbone; brokers company SSO; links web-you to Slack-you. *(in design)*
2. ⬜ **Full web UI refactor** — proper UX overhaul (user emphasized). Becomes the vehicle for cart/checkout/history UX.
3. ⬜ **Rewards cart + checkout** — add multiple rewards, review, check out (like a real store).
4. ⬜ **Redemption history** — per-user record of rewards used (data already in `Redemption`; needs UI + auth).
5. 🔁 **Variable giving amounts** — Low / Med / High / Custom point amounts per kudos, drawn from the monthly budget (see research note below). Currently fixed at 10/kudos.
6. ⬜ **Chat with the app** — DM the bot &/or a Slack **App Home** tab: "your balance, your recognition, updates, help."

## Research note — monthly cap + variable amounts (answering "does this make sense?")
**Yes — strongly, and the cap is already built.**
- The **monthly cap = the give-allowance model** we grounded in research (`docs/research/`, decisions D7/D18): Bonusly/Nectar-style, backed by SDT/crowding-out + scarcity findings. Scarcity forces *thoughtful* giving — exactly your intuition. It already prevents the "give 10,000 to one person" abuse (giveKudos rejects once the 100/mo budget is spent).
- **Variable Low/Med/High/Custom** is a sound enhancement (it's what Bonusly does). Bigger deal → more points, still bounded by the budget → more expressive *and* more thoughtful. Research caveats we'll honor:
  - Keep tiers **modest** and the **message primary** (crowding-out: money shouldn't dominate the act).
  - Keep a **per-kudos cap + required reason** to resist recognition inflation (D19).
  - Reward the **recognized, not the recognizer** (anti-gaming, D18).
- Proposed (tunable) numbers: allowance **100/mo**; tiers **Low 5 / Med 10 / High 20 / Custom (cap 25)**. That's ~5–20 recognitions/month → genuinely scarce.
- Implementation delta: `giveKudos` currently hard-codes `POINTS_PER_KUDOS=10`; variable amounts means it accepts a validated `points` value (≤ remaining allowance, ≤ per-kudos cap). Small, clean change to a well-tested function.

## Deferred / later
- Pulsed weekly nudge (P1 spec item, needs scheduler + live Slack)
- Simulation Lab (ABM charts + generative-agent vignette) — pitch centerpiece
- Team-scoped feeds at 500+ (schema already carries `teamId`)
- Reward fulfillment (explicitly out of scope per brief)
