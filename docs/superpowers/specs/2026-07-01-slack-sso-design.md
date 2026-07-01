# Slack SSO (Identity) — Design Spec

**Status:** 🟡 For user review → then writing-plans.
**Date:** 2026-07-01
**Slice:** v2 #1 (identity backbone). See `docs/BACKLOG.md`.
**Related:** core spec `2026-06-30-kudos-program-design.md`; decisions D3–D5 (Slack), D26 (teamId).

## 1. Problem & goal
The web app has no real login — it fakes "current user" as the highest-balance person (`apps/web/app/rewards/page.tsx`). Every next feature (cart, per-user history, personalized bot) needs to know *who the user is*. Add **"Sign in with Slack"** so web-you = the same `User` row that gives/receives kudos in Slack, and this transparently rides whatever SSO the company already uses for Slack (Slack brokers it via OIDC).

## 2. Non-goals (explicitly deferred to later slices)
- Full UI/UX refactor (v2 #2), cart/checkout (#3), redemption history UI (#4), variable giving amounts (#5), chat/App Home (#6).
- Non-Slack IdPs (Google/Okta/SAML). If ever needed, add via Auth.js/WorkOS OIDC later — YAGNI now.
- Roles/permissions beyond the existing `User.isAdmin` flag (not used in this slice).

## 3. Approach
**Auth.js (NextAuth v5, `next-auth@beta`) with the built-in Slack OIDC provider**, in `apps/web`. JWT session strategy (no session DB table). Identity linking is centralized in `@kudos/db` so the web login and the Slack bot converge on the same `User`.
- *Rejected:* hand-rolled OAuth (security risk, more code); hosted auth (Clerk/Auth0) (external dep, overkill for a Slack-native app).

## 4. Architecture & flow
```
Browser → "Sign in with Slack" → Auth.js → Slack OIDC (company SSO rides here)
       → callback /api/auth/callback/slack → signIn callback:
            linkSlackUser({slackUserId, name, email, avatarUrl}) → DB User
       → JWT session carries { userId }  (our internal User.id)
Server components / API routes → getCurrentUser() → reads session → prisma.user
```

**Key correctness point — the identifier.** Slack's OIDC returns a generic `sub` plus a Slack-specific **`https://slack.com/user_id`** claim (the `Uxxxx` id). We link on **`https://slack.com/user_id`**, because that's the exact id the bot stores (`resolveUser(slackUserId)` from `body.user.id`). Linking on `sub` instead would create a *second*, unlinked user — so the provider's `profile()` mapping must read the `https://slack.com/user_id` claim.

## 5. Shared identity linking (refactor + new)
New in `@kudos/db`: **`packages/db/src/users.ts`**
- `linkSlackUser(input: { slackUserId: string; name: string; email?: string | null; avatarUrl?: string | null }): Promise<{ id: string }>`
  1. If a `User` with `slackUserId` exists → update `name`/`email`/`avatarUrl` (enrich), return it.
  2. Else if an unlinked `User` (`slackUserId: null`) with the same `name` exists → set its `slackUserId` (+ email/avatar), return it. *(preserves the seeded-user linking the bot already does)*
  3. Else create a new `User` on the demo team.
- Exported via the barrel.

Refactor `apps/slack/src/userSync.ts`: `resolveUser(slackUserId, displayName)` becomes a thin call to `linkSlackUser({ slackUserId, name: displayName })` — removes duplicated find/link/create logic. Behavior unchanged.

## 6. Web auth wiring
- **`apps/web/auth.ts`** — Auth.js config: Slack provider with `clientId/clientSecret` from env; `profile()` maps `https://slack.com/user_id` → provider account id + returns `{ name, email, image }`; `signIn` callback calls `linkSlackUser(...)`; `jwt` callback stores `token.userId`; `session` callback exposes `session.user.id = token.userId`.
- **`apps/web/app/api/auth/[...nextauth]/route.ts`** — exports Auth.js GET/POST handlers.
- **`apps/web/lib/current-user.ts`** — `getCurrentUser(): Promise<User | null>` reads the Auth.js session (`auth()`), returns `prisma.user.findUnique({ where: { id: session.user.id } })` or null.
- **`apps/web/app/layout.tsx`** — header shows avatar + name + **Sign out** when logged in, else a **Sign in with Slack** button (Auth.js server action / `/api/auth/signin`).
- **`apps/web/app/rewards/page.tsx`** — replace the highest-balance hack with `getCurrentUser()`; if null, render a "Sign in to redeem" prompt instead of the catalog actions.
- Feed (`/`) stays public (it's a public recognition wall) but may greet the signed-in user.

## 7. Slack app config changes (user action, one-time)
On app **A0BECKGHUHG**, then **reinstall**:
1. **OAuth & Permissions → Redirect URLs:** add `http://localhost:3000/api/auth/callback/slack` (and `http://localhost:3001/...` if web runs on 3001).
2. **User Token Scopes:** add `openid`, `email`, `profile` (these are *user* scopes, distinct from bot scopes).
3. **Reinstall to Workspace** so the new scopes apply.
> Manifest addition (`oauth_config`): `redirect_urls: [http://localhost:3000/api/auth/callback/slack]` and `scopes.user: [openid, email, profile]`.

**Port note:** the redirect URL must match the port Next actually serves. Recommend freeing port 3000 (Docker is holding it) or registering both 3000 and 3001. We'll pin `dev:web` behavior in the plan.

## 8. Env & secrets
`apps/web/.env.local` (gitignored via `.env.*`); template `apps/web/.env.local.example` (committed):
- `AUTH_SECRET` — generated (`openssl rand -base64 32`)
- `AUTH_SLACK_ID` / `AUTH_SLACK_SECRET` — the Slack `client_id` / `client_secret` (already saved in `apps/slack/.env`)
- `AUTH_URL=http://localhost:3000` (or 3001 to match the running port)

## 9. Data model impact
None new. `User` already has `slackUserId (unique)`, `name`, `email`, `avatarUrl`. We now populate `email`/`avatarUrl` from the OIDC profile. No migration beyond what exists.

## 10. Error handling
- **OIDC error / user denies:** Auth.js shows its error page; header remains "Sign in".
- **Missing `https://slack.com/user_id` claim:** fail the sign-in with a clear error (don't silently link on `sub`).
- **Session but user deleted:** `getCurrentUser()` returns null → treated as logged out.

## 11. Testing
- **Unit (`@kudos/db`):** `linkSlackUser` — the three paths (existing-by-slackId enriches; unlinked-by-name links; else creates) + idempotency (second call returns same id). Vitest, DB-backed, same style as existing suites.
- **Regression:** existing bot `resolveUser` behavior preserved (its logic now delegates to `linkSlackUser`).
- **Manual (live):** the OAuth round-trip — sign in, land back authenticated, header shows your Slack name/avatar, `/rewards` uses your balance. (Like the Slack bot, full OAuth isn't unit-tested.)

## 12. File structure
```
packages/db/src/users.ts            # linkSlackUser (+ barrel export)  [new]
packages/db/src/users.test.ts       # unit tests                       [new]
apps/slack/src/userSync.ts          # resolveUser -> linkSlackUser      [refactor]
apps/web/auth.ts                    # Auth.js config                    [new]
apps/web/app/api/auth/[...nextauth]/route.ts  # handlers                [new]
apps/web/lib/current-user.ts        # getCurrentUser()                  [new]
apps/web/app/layout.tsx             # header sign in/out                [modify]
apps/web/app/rewards/page.tsx       # use getCurrentUser()              [modify]
apps/web/.env.local.example         # env template                     [new]
apps/web/package.json               # + next-auth@beta                  [modify]
```

## 13. Open items / risks
- **Port/redirect mismatch** — the callback URL must match the served port (§7). Resolve in the plan (pin a port or register both).
- **Enterprise Grid app-approval** — on a real enterprise workspace an admin may need to approve the app; the test workspace is fine.
- **`next-auth@beta` (v5)** API is newish — pin a specific version in the plan; follow current Auth.js v5 App-Router docs.
