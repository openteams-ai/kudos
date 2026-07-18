# Shareout Script — Kudos Program

**Event:** Bounty Hunters — Kudos Program · division-wide call (Tue Jul 21 / Wed Jul 22)
**Slot:** 5–10 min shareout + Q&A. This script is timed to **~7 minutes** of talking, leaving buffer for questions and any live-demo slack.
**Judged on:** Effectiveness · Use of AI During Development · Ease of Use · Ability to Maintain · Overall Presentation.
**Goal of the talk:** show a recognition product people would actually use daily, prove it's real (live Slack + live web store), and tell the AI-development story honestly.

> Companion docs: `judging-crosswalk.md` (evidence for each criterion), `qa-prep.md` (tough questions).

---

## Beat sheet (minute-by-minute)

| Time | Beat | What the audience sees |
|---|---|---|
| 0:00–0:45 | **Hook** — the recognition problem | You, one slide or just Slack open |
| 0:45–3:30 | **Live demo** — give → land → store → the "almost there" moment → redeem → celebrate → history | Slack + web app side by side |
| 3:30–4:20 | **Architecture in ~60 seconds** | One architecture slide |
| 4:20–5:50 | **How it was built with AI** | One slide (multi-agent) |
| 5:50–7:00 | **Maintainability + roadmap, close** | Tests-passing terminal + roadmap slide |

Keep the demo the centerpiece. If you're running long, compress architecture and roadmap — never the demo.

---

## 0:00 — Hook (45s)

> "Every team has people who go above and beyond — someone who calmed a furious client, who jumped on a 2 a.m. outage, who quietly kept the sprint on track. And most of the time, nobody says anything, because saying it is *friction*. You have to remember, find the right place, find the words.
>
> So we built the shortest possible path from *noticing* to *recognizing* — right where work already happens, in Slack — and we backed it with real behavioral-science research so it actually changes behavior instead of gamifying it into noise. Let me show you."

Move straight into the demo. Don't linger on slides.

---

## 0:45 — Live demo (2m45s)

Two windows visible: **Slack** (left) and the **web app** (right), both already open (see checklist).

### Beat 1 — Give a kudos in Slack (~40s)
1. In Slack, type `/kudos` and hit enter → a modal opens.
2. **Who?** pick your colleague (the helper on the call).
3. **For what?** pick a value, e.g. **🚨 Crisis Crusher**.
4. **Why? (be specific)** type a real, specific reason — e.g. *"jumped on the 2am outage and had us back in twenty minutes."*
5. Click **Send.**

> "Ten seconds. Notice it *made* me say what they did — a specific reason is required, because research says vague praise doesn't land. And it costs from a **monthly give-allowance** — everyone gets 100 points a month to give away. That scarcity is deliberate: it makes recognition thoughtful, and it means no one can spray 10,000 points at their friend."

6. Point to `#kudos` in Slack: the recognition posts publicly and instantly. Point to the web app's **feed** (refresh if needed): the same recognition appears, and the recipient's redeemable balance went up by 10.

> "Public by default, lands immediately. And boosts — anyone can react to pile on."

### Beat 2 — The rewards store + the "almost there" moment (~50s)
1. On the web app, click **Rewards**. You're signed in with Slack (top-right), so the store greets you by name and shows *your* balance.
2. Scroll the store: **Crowd favorites** row, then the catalog — **26 rewards across 5 categories** (Gift Cards, Company Swag, Experiences, Time Off, Charity), each with an affordability state.
3. Point to the **Save-up spotlight** at the top: it's tracking the aspirational reward you're closest to — **Extra Day Off, 500 points** — with a progress bar reading **"Just 10 more points — you're so close!"** (You pre-set this account near the line; see checklist.)

> "This is the emotional core. It's not a wall of stuff you can't afford — it shows you the *one thing you're closest to* and how close you are. That's the save-up mechanic that keeps people coming back."

### Beat 3 — Earn the last kudos, live (~35s)
1. Cue your helper (or a colleague on the call — even better): they run `/kudos`, pick **you**, and send one.

> "And here's a real recognition landing, live."

2. Back on the store, **refresh**. The balance ticks to **500**. The **Extra Day Off** card flips from a "more points" hint to a live **Redeem** button.

### Beat 4 — Redeem + celebrate + history (~40s)
1. Click **Redeem** on **Extra Day Off**.
2. The **confirm dialog** appears — reward, cost, "Balance after: 0 pts." Click **Confirm & redeem.**
3. **Confetti fires.** The card reads **Requested ✓**.

> "Confirm — and celebrate. That moment matters; recognition should feel good on both ends."

4. Click **My Rewards** (top-right of the store) → the redemption is there in the history, newest first.

> "And it's logged — a full history of what each person has redeemed. Fulfillment itself is out of scope for the hackathon, but the record the fulfillment team would work from is already here."

---

## 3:30 — Architecture in ~60 seconds

Show one architecture slide.

> "One TypeScript monorepo, two small processes sharing one database through a Prisma package.
> - **`apps/slack`** — a Slack Bolt worker in Socket Mode. No public URL, no webhook signatures to babysit — which is exactly why this demo is reliable.
> - **`apps/web`** — a Next.js app: the feed, the rewards store, sign-in with Slack.
> - **`packages/db`** — the Prisma schema and *all* the points logic, in one place, unit-tested.
>
> It's SQLite for the demo so it runs anywhere; it's a one-line datasource swap to Postgres for production. Every point of value — the give-allowance, the redeemable balance, redemption — lives in that shared package, so both Slack and web behave identically and there's exactly one place to change the rules."

---

## 4:20 — How it was built with AI (the "Use of AI" beat, ~90s)

This is a judged criterion and it's genuinely strong. Tell it truthfully.

> "This was built with Claude in a multi-agent workflow, and the interesting part isn't 'AI wrote code' — it's *how the work was structured*.
>
> **First, research, not vibes.** Before a line of product code, parallel research agents ran four deep passes over the actual behavioral-science literature — self-determination theory, the crowding-out effect, recognition studies — and *adversarially verified* the claims. That's why the design has real opinions: no competitive leaderboard, because controlled experiments show leaderboards generate no lasting motivation; lead with the message not the money, because only *controlling* rewards backfire. Every design decision traces to a cited finding.
>
> **Then, parallel specialists with clean context.** Separate implementation agents built the catalog, the design system, and the store *in parallel*, each with strict file boundaries so they never collided.
>
> **Then, adversarial review.** Every change was reviewed by a *fresh* agent that hadn't written it. A security reviewer found and fixed a real authorization bug — the redeem endpoint trusted a user id from the request; now it derives identity from the session, and redemption is a race-safe conditional decrement so concurrent clicks can't overspend. An accessibility reviewer ran a WCAG 2.2 AA pass, caught a blocker, and it was fixed the same day — contrast ratios computed and verified.
>
> The AI didn't just accelerate typing. It let one person run a research team, a build team, and a red team."

Point to the git log if you want receipts — the security and accessibility fixes are right there as commits.

---

## 5:50 — Maintainability + roadmap, and close (~70s)

Optionally show a terminal with `npm test` green.

> "On maintainability: it's one language end to end, a small seven-model schema, and the logic that's worth protecting — the points economy — has **22 unit tests, all green.** There's a decision log recording *why* every choice was made, the research write-ups, and a one-command demo seed. A new engineer can read the whole thing in an afternoon.
>
> Where it goes next: variable give amounts, a Slack App Home so you can check your balance without leaving Slack, team-scoped feeds as the org grows — the schema already carries the team id for that — and the redemption-fulfillment admin side.
>
> The core loop works today: recognize someone in ten seconds, they feel it immediately and publicly, and it adds up to something they actually want. That's the whole product. Thank you — happy to take questions."

---

## Pre-demo checklist

Do this **before** the call. Rehearse the full path once end-to-end.

### Setup (once)
- [ ] `npm install` complete; `npm run db:push` has created the SQLite DB.
- [ ] **`npm run db:demo`** — seeds 14 users and ~4 weeks of activity so the feed and "recognized this month" strip look alive (this is where Ada @320 and Ben Carter @480 come from — they populate the feed).
- [ ] Slack app is running: `npm run dev:slack` (Socket Mode; needs the bot + app tokens in the Slack app's env — see the Slack setup guide). Confirm `/kudos` opens the modal in your workspace.
- [ ] Web app running: `npm run dev:web` → open the app, click **Sign in with Slack**, complete OAuth. This creates *your* real user row. (Live OAuth needs the redirect URL + `openid/email/profile` scopes added and the app reinstalled — do this well ahead of time; it's the one fiddly manual step.)
- [ ] A **second Slack person** is lined up to give you the closing kudos — ideally a colleague on the call (great audience moment), or your own second test account.

### Stage the "almost there" moment
The store shows the **signed-in user's** balance, so the hero account is *you*, not the seeded Ben.
- [ ] After signing in, set your account's `redeemableBalance` to **490** so a single inbound kudos crosses the 500-point **Extra Day Off** line. Easiest: `npx prisma studio` (from `packages/db`), open the **User** table, find your name, set `redeemableBalance = 490`, save.
  - Want the "just 20 more points" copy instead of "just 10"? Set **480** and have *two* people give you a kudos (10 each). One kudos from 490 is the more reliable single-cue path.
- [ ] Reload the Rewards page and confirm the Save-up spotlight shows Extra Day Off with "Just 10 more points."

### Windows staged
- [ ] Slack open to your workspace with `#kudos` visible.
- [ ] Browser: one tab on the **feed** (home), one on **Rewards** — pre-navigated so you're not typing URLs live.
- [ ] Zoom/font size bumped so remote viewers can read the modal and cards.

---

## Fallback plan (if live Slack or the app misbehaves)

Have these **ready before you present** so a hiccup costs zero seconds:

1. **Screen recording (best fallback).** Record the full happy path once, the day before: `/kudos` → post in `#kudos` → feed updates → store → inbound kudos → refresh → redeem → confetti → My Rewards. If anything live fails, play the clip and narrate over it. This is the single most valuable insurance — do it.
2. **Screenshots, in order, on slides:**
   - the `/kudos` modal (Who / For what / Why),
   - the `#kudos` public post,
   - the web feed with the new recognition,
   - the Rewards store with the Save-up spotlight ("Just 10 more points"),
   - the confirm dialog ("Balance after: 0 pts"),
   - confetti / "Requested ✓",
   - the My Rewards history.
3. **If only Slack fails:** the web app still tells the whole reward story — sign in, show the store, redeem, confetti, history — and narrate the Slack give from a screenshot.
4. **If only the web app fails:** do the Slack give live (it's the lowest-risk piece — Socket Mode, no public URL), then switch to store screenshots.
5. **If OAuth fails on the day:** the seed data still makes the feed look alive; present the store from screenshots/recording. Don't debug auth live — cut to the recording.

Golden rule: **never debug in front of the judges.** One failure → cut to the recording and keep the energy up.
