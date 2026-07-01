# Kudos Core Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working peer-recognition product where employees give kudos in Slack and see them on a live web dashboard, with a give-allowance points model and a rewards catalog.

**Architecture:** TypeScript monorepo (npm workspaces). `packages/db` owns the Prisma schema + all tested domain logic (points, kudos, redemption). `apps/slack` is a Slack Bolt worker in Socket Mode. `apps/web` is a Next.js (App Router) dashboard reading the same SQLite DB via the shared `packages/db` client. Domain logic is TDD'd with Vitest; Slack/web are thin wiring over it.

**Tech Stack:** TypeScript 5, npm workspaces, Prisma + SQLite, Slack Bolt (Socket Mode), Next.js 14 (App Router) + React 18 + Tailwind, Vitest, tsx.

## Global Constraints

- **Language:** TypeScript everywhere; `"type": "module"` (ESM) in all packages.
- **Node:** ≥ 20.
- **DB access:** ONLY through `@kudos/db` (shared Prisma client) — never instantiate PrismaClient elsewhere.
- **Points model (D7/D18/D22):** monthly give-allowance is spent to give; received points go to a separate redeemable balance; **received points are never clawed back**; allowance is framed as a fresh monthly gift, never a forfeiture.
- **Allowance reset:** computed-on-read (no cron) — the remaining give-allowance is derived from kudos given in the current calendar month, never stored as a decrementing counter.
- **No competitive leaderboard** (D17): celebration surfaces are inclusive.
- **Every kudos requires a `valueKey` + a non-empty `message`** (D14, anti-inflation).
- **Scale-ready schema (D21/D26):** `Team` exists and `Kudos.teamId` is populated from day 1.
- **Secrets:** Slack tokens come from `apps/slack/.env` (gitignored); never commit tokens.
- **Commit** after every task's tests pass.

---

## File Structure

```
kudos-bounty/
├── package.json                      # workspaces root + scripts
├── tsconfig.base.json                # shared TS config
├── packages/db/
│   ├── package.json                  # name: @kudos/db
│   ├── prisma/schema.prisma          # 7 models
│   ├── prisma/seed.ts                # demo data (team, users, values, rewards)
│   ├── vitest.config.ts
│   └── src/
│       ├── client.ts                 # single PrismaClient export
│       ├── period.ts                 # currentPeriod() month boundaries
│       ├── points.ts                 # allowance math (TDD)
│       ├── kudos.ts                  # giveKudos / addBoost (TDD)
│       ├── rewards.ts                # redeemReward (TDD)
│       └── index.ts                  # public barrel export
├── apps/slack/
│   ├── package.json                  # name: @kudos/slack
│   ├── .env.example
│   └── src/
│       ├── app.ts                    # Bolt Socket Mode bootstrap
│       ├── userSync.ts               # resolve/cache Slack user -> DB User
│       ├── kudosCommand.ts           # /kudos modal open + submit
│       └── boost.ts                  # reaction_added -> boost
└── apps/web/
    ├── package.json                  # name: @kudos/web
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── postcss.config.mjs
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx                  # live feed + celebration
    │   ├── rewards/page.tsx          # catalog + redeem
    │   └── api/
    │       ├── feed/route.ts         # GET recent kudos
    │       └── redeem/route.ts       # POST redeem
    └── lib/format.ts                 # small view helpers
```

Follow-up plan (separate): `packages/sim` (Simulation Lab) — NOT in this plan.

---

## Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.nvmrc`

**Interfaces:**
- Produces: npm workspaces `packages/*`, `apps/*`; root scripts `db:*`, `dev:slack`, `dev:web`, `test`.

- [ ] **Step 1: Create `.nvmrc`**

```
20
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "kudos-bounty",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "db:generate": "npm -w @kudos/db run generate",
    "db:push": "npm -w @kudos/db run push",
    "db:seed": "npm -w @kudos/db run seed",
    "dev:slack": "npm -w @kudos/slack run dev",
    "dev:web": "npm -w @kudos/web run dev",
    "test": "npm -w @kudos/db run test"
  }
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add .nvmrc package.json tsconfig.base.json
git commit -m "chore: monorepo workspace scaffold"
```

---

## Task 2: Database package — schema + client

**Files:**
- Create: `packages/db/package.json`, `packages/db/prisma/schema.prisma`, `packages/db/src/client.ts`, `packages/db/src/index.ts`

**Interfaces:**
- Produces: `@kudos/db` exporting `prisma` (PrismaClient) and all model types; SQLite at `packages/db/prisma/dev.db`.

- [ ] **Step 1: Create `packages/db/package.json`**

```json
{
  "name": "@kudos/db",
  "version": "0.0.0",
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "generate": "prisma generate",
    "push": "prisma db push",
    "seed": "tsx prisma/seed.ts",
    "test": "vitest run"
  },
  "dependencies": { "@prisma/client": "^5.20.0" },
  "devDependencies": {
    "prisma": "^5.20.0",
    "tsx": "^4.19.0",
    "vitest": "^2.1.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create `packages/db/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Team {
  id            String  @id @default(cuid())
  workspaceId   String  @default("demo-workspace")
  name          String
  slackChannelId String?
  users         User[]
  kudos         Kudos[]
}

model User {
  id               String   @id @default(cuid())
  slackUserId      String?  @unique
  teamId           String
  team             Team     @relation(fields: [teamId], references: [id])
  name             String
  avatarUrl        String?
  email            String?
  redeemableBalance Int     @default(0)
  isAdmin          Boolean  @default(false)
  createdAt        DateTime @default(now())
  kudosGiven       Kudos[]  @relation("given")
  kudosReceived    Kudos[]  @relation("received")
  boosts           Boost[]
  redemptions      Redemption[]
}

model Value {
  id          String  @id @default(cuid())
  key         String  @unique
  label       String
  emoji       String
  description String
}

model Kudos {
  id            String   @id @default(cuid())
  fromUserId    String
  fromUser      User     @relation("given", fields: [fromUserId], references: [id])
  toUserId      String
  toUser        User     @relation("received", fields: [toUserId], references: [id])
  teamId        String
  team          Team     @relation(fields: [teamId], references: [id])
  valueKey      String
  message       String
  points        Int
  createdAt     DateTime @default(now())
  slackMessageTs String?
  boosts        Boost[]
}

model Boost {
  id         String   @id @default(cuid())
  kudosId    String
  kudos      Kudos    @relation(fields: [kudosId], references: [id])
  fromUserId String
  fromUser   User     @relation(fields: [fromUserId], references: [id])
  points     Int      @default(1)
  createdAt  DateTime @default(now())
  @@unique([kudosId, fromUserId])
}

model Reward {
  id        String  @id @default(cuid())
  name      String
  cost      Int
  imageUrl  String?
  category  String
  redemptions Redemption[]
}

model Redemption {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  rewardId  String
  reward    Reward   @relation(fields: [rewardId], references: [id])
  cost      Int
  status    String   @default("requested")
  createdAt DateTime @default(now())
}
```

- [ ] **Step 3: Create `packages/db/src/client.ts`**

```ts
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

- [ ] **Step 4: Create `packages/db/src/index.ts`**

```ts
export { prisma } from "./client.js";
export * from "./period.js";
export * from "./points.js";
export * from "./kudos.js";
export * from "./rewards.js";
```

Note: `period.ts`, `points.ts`, `kudos.ts`, `rewards.ts` are created in later tasks. If generating the client before them exists, temporarily comment their exports; re-enable as each is added.

- [ ] **Step 5: Install, generate, push**

Run:
```bash
npm install
npm run db:generate
npm run db:push
```
Expected: Prisma generates client and creates `packages/db/prisma/dev.db` with 7 tables.

- [ ] **Step 6: Commit**

```bash
git add packages/db package-lock.json
git commit -m "feat(db): prisma schema (7 models) + shared client"
```

---

## Task 3: Period helper (month boundaries) — TDD

**Files:**
- Create: `packages/db/src/period.ts`, `packages/db/vitest.config.ts`
- Test: `packages/db/src/period.test.ts`

**Interfaces:**
- Produces: `currentPeriod(now?: Date): { start: Date; end: Date }` — first ms of the month to first ms of next month (UTC).

- [ ] **Step 1: Create `packages/db/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```

- [ ] **Step 2: Write the failing test — `packages/db/src/period.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { currentPeriod } from "./period.js";

describe("currentPeriod", () => {
  it("returns month start and next-month start in UTC", () => {
    const { start, end } = currentPeriod(new Date("2026-06-15T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("rolls over December to next January", () => {
    const { start, end } = currentPeriod(new Date("2026-12-31T23:59:59Z"));
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm -w @kudos/db run test`
Expected: FAIL — cannot find `./period.js`.

- [ ] **Step 4: Implement `packages/db/src/period.ts`**

```ts
export function currentPeriod(now: Date = new Date()): { start: Date; end: Date } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 1));
  return { start, end };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm -w @kudos/db run test`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/period.ts packages/db/src/period.test.ts packages/db/vitest.config.ts
git commit -m "feat(db): currentPeriod month-boundary helper"
```

---

## Task 4: Points logic — computed-on-read allowance — TDD

**Files:**
- Create: `packages/db/src/points.ts`
- Test: `packages/db/src/points.test.ts`

**Interfaces:**
- Consumes: `prisma`, `currentPeriod`.
- Produces:
  - `MONTHLY_ALLOWANCE = 100` (const)
  - `pointsGivenThisPeriod(userId: string, now?: Date): Promise<number>` — sum of `Kudos.points` given by user in current period.
  - `remainingAllowance(userId: string, now?: Date): Promise<number>` — `MONTHLY_ALLOWANCE - pointsGivenThisPeriod`, floored at 0.

- [ ] **Step 1: Write the failing test — `packages/db/src/points.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "./client.js";
import { MONTHLY_ALLOWANCE, pointsGivenThisPeriod, remainingAllowance } from "./points.js";

async function reset() {
  await prisma.boost.deleteMany();
  await prisma.kudos.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
}

async function seedUserPair() {
  const team = await prisma.team.create({ data: { name: "Eng" } });
  const giver = await prisma.user.create({ data: { name: "Giver", teamId: team.id } });
  const receiver = await prisma.user.create({ data: { name: "Receiver", teamId: team.id } });
  return { team, giver, receiver };
}

describe("allowance (computed-on-read)", () => {
  beforeEach(reset);

  it("starts with the full monthly allowance", async () => {
    const { giver } = await seedUserPair();
    expect(await remainingAllowance(giver.id)).toBe(MONTHLY_ALLOWANCE);
    expect(await pointsGivenThisPeriod(giver.id)).toBe(0);
  });

  it("counts only kudos given in the current period", async () => {
    const { team, giver, receiver } = await seedUserPair();
    await prisma.kudos.create({ data: {
      fromUserId: giver.id, toUserId: receiver.id, teamId: team.id,
      valueKey: "friend", message: "thanks", points: 10,
      createdAt: new Date("2026-06-10T00:00:00Z"),
    }});
    await prisma.kudos.create({ data: {
      fromUserId: giver.id, toUserId: receiver.id, teamId: team.id,
      valueKey: "friend", message: "last month", points: 30,
      createdAt: new Date("2026-05-10T00:00:00Z"),
    }});
    const now = new Date("2026-06-15T00:00:00Z");
    expect(await pointsGivenThisPeriod(giver.id, now)).toBe(10);
    expect(await remainingAllowance(giver.id, now)).toBe(MONTHLY_ALLOWANCE - 10);
  });

  it("never returns a negative allowance", async () => {
    const { team, giver, receiver } = await seedUserPair();
    await prisma.kudos.create({ data: {
      fromUserId: giver.id, toUserId: receiver.id, teamId: team.id,
      valueKey: "friend", message: "big", points: 999,
      createdAt: new Date("2026-06-10T00:00:00Z"),
    }});
    expect(await remainingAllowance(giver.id, new Date("2026-06-15T00:00:00Z"))).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w @kudos/db run test`
Expected: FAIL — cannot find `./points.js`.

- [ ] **Step 3: Implement `packages/db/src/points.ts`**

```ts
import { prisma } from "./client.js";
import { currentPeriod } from "./period.js";

export const MONTHLY_ALLOWANCE = 100;

export async function pointsGivenThisPeriod(userId: string, now: Date = new Date()): Promise<number> {
  const { start, end } = currentPeriod(now);
  const agg = await prisma.kudos.aggregate({
    _sum: { points: true },
    where: { fromUserId: userId, createdAt: { gte: start, lt: end } },
  });
  return agg._sum.points ?? 0;
}

export async function remainingAllowance(userId: string, now: Date = new Date()): Promise<number> {
  const spent = await pointsGivenThisPeriod(userId, now);
  return Math.max(0, MONTHLY_ALLOWANCE - spent);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w @kudos/db run test`
Expected: PASS (period + points suites).

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/points.ts packages/db/src/points.test.ts
git commit -m "feat(db): computed-on-read monthly allowance"
```

---

## Task 5: Give kudos + boost — TDD

**Files:**
- Create: `packages/db/src/kudos.ts`
- Test: `packages/db/src/kudos.test.ts`

**Interfaces:**
- Consumes: `prisma`, `remainingAllowance`.
- Produces:
  - `POINTS_PER_KUDOS = 10`, `BOOST_POINTS = 1`
  - `giveKudos(input: { fromUserId: string; toUserId: string; valueKey: string; message: string; now?: Date; slackMessageTs?: string }): Promise<{ id: string }>` — validates (non-self, non-empty message, valueKey required, enough allowance), creates Kudos with `points=POINTS_PER_KUDOS`, and increments receiver `redeemableBalance` by the same. Throws `Error` with a stable message on validation failure.
  - `addBoost(input: { kudosId: string; fromUserId: string }): Promise<{ added: boolean }>` — idempotent (unique kudosId+fromUserId); on first boost adds `BOOST_POINTS` to the kudos receiver's `redeemableBalance`; returns `{ added:false }` if duplicate.

- [ ] **Step 1: Write the failing test — `packages/db/src/kudos.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "./client.js";
import { giveKudos, addBoost, POINTS_PER_KUDOS, BOOST_POINTS } from "./kudos.js";

async function reset() {
  await prisma.boost.deleteMany();
  await prisma.kudos.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
}
async function trio() {
  const team = await prisma.team.create({ data: { name: "Eng" } });
  const a = await prisma.user.create({ data: { name: "Ada", teamId: team.id } });
  const b = await prisma.user.create({ data: { name: "Ben", teamId: team.id } });
  const c = await prisma.user.create({ data: { name: "Cy", teamId: team.id } });
  return { team, a, b, c };
}

describe("giveKudos", () => {
  beforeEach(reset);

  it("creates a kudos and credits the receiver's redeemable balance", async () => {
    const { a, b } = await trio();
    await giveKudos({ fromUserId: a.id, toUserId: b.id, valueKey: "friend", message: "clutch help" });
    const kudos = await prisma.kudos.findFirst();
    expect(kudos?.points).toBe(POINTS_PER_KUDOS);
    const receiver = await prisma.user.findUnique({ where: { id: b.id } });
    expect(receiver?.redeemableBalance).toBe(POINTS_PER_KUDOS);
  });

  it("rejects self-recognition", async () => {
    const { a } = await trio();
    await expect(giveKudos({ fromUserId: a.id, toUserId: a.id, valueKey: "friend", message: "me" }))
      .rejects.toThrow("cannot recognize yourself");
  });

  it("rejects empty message", async () => {
    const { a, b } = await trio();
    await expect(giveKudos({ fromUserId: a.id, toUserId: b.id, valueKey: "friend", message: "   " }))
      .rejects.toThrow("message is required");
  });

  it("rejects when allowance is exhausted", async () => {
    const { a, b, c } = await trio();
    // spend the full 100 allowance: 10 kudos of 10 pts
    for (let i = 0; i < 10; i++) {
      await giveKudos({ fromUserId: a.id, toUserId: (i % 2 ? b.id : c.id), valueKey: "friend", message: `n${i}` });
    }
    await expect(giveKudos({ fromUserId: a.id, toUserId: b.id, valueKey: "friend", message: "one too many" }))
      .rejects.toThrow("not enough allowance");
  });
});

describe("addBoost", () => {
  beforeEach(reset);

  it("adds boost points once and is idempotent per user", async () => {
    const { a, b, c } = await trio();
    await giveKudos({ fromUserId: a.id, toUserId: b.id, valueKey: "friend", message: "nice" });
    const kudos = await prisma.kudos.findFirstOrThrow();

    const first = await addBoost({ kudosId: kudos.id, fromUserId: c.id });
    expect(first.added).toBe(true);
    const second = await addBoost({ kudosId: kudos.id, fromUserId: c.id });
    expect(second.added).toBe(false);

    const receiver = await prisma.user.findUnique({ where: { id: b.id } });
    expect(receiver?.redeemableBalance).toBe(POINTS_PER_KUDOS + BOOST_POINTS);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w @kudos/db run test`
Expected: FAIL — cannot find `./kudos.js`.

- [ ] **Step 3: Implement `packages/db/src/kudos.ts`**

```ts
import { prisma } from "./client.js";
import { remainingAllowance } from "./points.js";

export const POINTS_PER_KUDOS = 10;
export const BOOST_POINTS = 1;

export async function giveKudos(input: {
  fromUserId: string; toUserId: string; valueKey: string; message: string;
  now?: Date; slackMessageTs?: string;
}): Promise<{ id: string }> {
  const { fromUserId, toUserId, valueKey, message, now, slackMessageTs } = input;
  if (fromUserId === toUserId) throw new Error("cannot recognize yourself");
  if (!valueKey) throw new Error("value is required");
  if (!message || message.trim().length === 0) throw new Error("message is required");

  const remaining = await remainingAllowance(fromUserId, now);
  if (remaining < POINTS_PER_KUDOS) throw new Error("not enough allowance");

  const sender = await prisma.user.findUniqueOrThrow({ where: { id: fromUserId } });

  const kudos = await prisma.$transaction(async (tx) => {
    const k = await tx.kudos.create({
      data: {
        fromUserId, toUserId, teamId: sender.teamId,
        valueKey, message: message.trim(), points: POINTS_PER_KUDOS,
        slackMessageTs,
        ...(now ? { createdAt: now } : {}),
      },
    });
    await tx.user.update({
      where: { id: toUserId },
      data: { redeemableBalance: { increment: POINTS_PER_KUDOS } },
    });
    return k;
  });
  return { id: kudos.id };
}

export async function addBoost(input: { kudosId: string; fromUserId: string }): Promise<{ added: boolean }> {
  const { kudosId, fromUserId } = input;
  const existing = await prisma.boost.findUnique({
    where: { kudosId_fromUserId: { kudosId, fromUserId } },
  });
  if (existing) return { added: false };

  const kudos = await prisma.kudos.findUniqueOrThrow({ where: { id: kudosId } });
  await prisma.$transaction(async (tx) => {
    await tx.boost.create({ data: { kudosId, fromUserId, points: BOOST_POINTS } });
    await tx.user.update({
      where: { id: kudos.toUserId },
      data: { redeemableBalance: { increment: BOOST_POINTS } },
    });
  });
  return { added: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w @kudos/db run test`
Expected: PASS (period + points + kudos suites).

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/kudos.ts packages/db/src/kudos.test.ts
git commit -m "feat(db): giveKudos + addBoost with allowance + idempotent boosts"
```

---

## Task 6: Redeem reward — TDD

**Files:**
- Create: `packages/db/src/rewards.ts`
- Test: `packages/db/src/rewards.test.ts`

**Interfaces:**
- Consumes: `prisma`.
- Produces: `redeemReward(input: { userId: string; rewardId: string }): Promise<{ redemptionId: string }>` — checks `redeemableBalance >= reward.cost`, decrements balance, creates a `Redemption(status="requested")`. Throws `"insufficient balance"` otherwise. **Never touches allowance** (only the redeemable balance).

- [ ] **Step 1: Write the failing test — `packages/db/src/rewards.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "./client.js";
import { redeemReward } from "./rewards.js";

async function reset() {
  await prisma.redemption.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
}

describe("redeemReward", () => {
  beforeEach(reset);

  it("deducts cost from redeemable balance and logs a request", async () => {
    const team = await prisma.team.create({ data: { name: "Eng" } });
    const user = await prisma.user.create({ data: { name: "Ada", teamId: team.id, redeemableBalance: 50 } });
    const reward = await prisma.reward.create({ data: { name: "Sticker", cost: 20, category: "swag" } });

    const { redemptionId } = await redeemReward({ userId: user.id, rewardId: reward.id });

    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.redeemableBalance).toBe(30);
    const redemption = await prisma.redemption.findUnique({ where: { id: redemptionId } });
    expect(redemption?.status).toBe("requested");
    expect(redemption?.cost).toBe(20);
  });

  it("rejects when balance is insufficient", async () => {
    const team = await prisma.team.create({ data: { name: "Eng" } });
    const user = await prisma.user.create({ data: { name: "Ada", teamId: team.id, redeemableBalance: 5 } });
    const reward = await prisma.reward.create({ data: { name: "Hoodie", cost: 200, category: "swag" } });
    await expect(redeemReward({ userId: user.id, rewardId: reward.id })).rejects.toThrow("insufficient balance");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm -w @kudos/db run test`
Expected: FAIL — cannot find `./rewards.js`.

- [ ] **Step 3: Implement `packages/db/src/rewards.ts`**

```ts
import { prisma } from "./client.js";

export async function redeemReward(input: { userId: string; rewardId: string }): Promise<{ redemptionId: string }> {
  const { userId, rewardId } = input;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const reward = await prisma.reward.findUniqueOrThrow({ where: { id: rewardId } });
  if (user.redeemableBalance < reward.cost) throw new Error("insufficient balance");

  const redemption = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { redeemableBalance: { decrement: reward.cost } },
    });
    return tx.redemption.create({
      data: { userId, rewardId, cost: reward.cost, status: "requested" },
    });
  });
  return { redemptionId: redemption.id };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm -w @kudos/db run test`
Expected: PASS (all 4 suites).

- [ ] **Step 5: Enable full barrel + commit**

Ensure `packages/db/src/index.ts` exports all four modules (uncomment any temporarily-disabled lines).

```bash
git add packages/db/src/rewards.ts packages/db/src/rewards.test.ts packages/db/src/index.ts
git commit -m "feat(db): redeemReward against redeemable balance"
```

---

## Task 7: Seed data (values, rewards, demo team/users)

**Files:**
- Create: `packages/db/prisma/seed.ts`

**Interfaces:**
- Consumes: `prisma`.
- Produces: 1 demo `Team`, 5 `Value`s (`friend`, `client_hero`, `crisis`, `craft`, `teamwork`), ~6 demo `User`s, ~6 `Reward`s. Idempotent (clears then inserts).

- [ ] **Step 1: Create `packages/db/prisma/seed.ts`**

```ts
import { prisma } from "../src/client.js";

const VALUES = [
  { key: "friend", label: "Great Friend", emoji: "🤝", description: "Went out of their way to support a teammate." },
  { key: "client_hero", label: "Client Hero", emoji: "🛟", description: "Expertly handled a difficult client." },
  { key: "crisis", label: "Crisis Crusher", emoji: "🚨", description: "Provided critical help during a crisis." },
  { key: "craft", label: "Craftsmanship", emoji: "🛠️", description: "Raised the bar on quality." },
  { key: "teamwork", label: "Teamwork", emoji: "🧩", description: "Made the whole team better." },
];

const REWARDS = [
  { name: "Sticker Pack", cost: 20, category: "swag" },
  { name: "Coffee Gift Card ($5)", cost: 50, category: "giftcard" },
  { name: "Company T-Shirt", cost: 120, category: "swag" },
  { name: "Hoodie", cost: 250, category: "swag" },
  { name: "Lunch Gift Card ($25)", cost: 300, category: "giftcard" },
  { name: "Extra Day Off", cost: 1000, category: "experience" },
];

const USERS = ["Ada Lovelace", "Ben Carter", "Cy Nguyen", "Dana Ruiz", "Evan Park", "Farah Aziz"];

async function main() {
  await prisma.redemption.deleteMany();
  await prisma.boost.deleteMany();
  await prisma.kudos.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.value.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  const team = await prisma.team.create({ data: { name: "Engineering", slackChannelId: null } });
  for (const v of VALUES) await prisma.value.create({ data: v });
  for (const r of REWARDS) await prisma.reward.create({ data: r });
  for (const name of USERS) await prisma.user.create({ data: { name, teamId: team.id } });

  console.log(`Seeded team ${team.name}, ${VALUES.length} values, ${REWARDS.length} rewards, ${USERS.length} users.`);
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the seed**

Run: `npm run db:seed`
Expected: prints the seeded summary; no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/db/prisma/seed.ts
git commit -m "feat(db): seed values, rewards, and demo team/users"
```

---

## Task 8: Slack app — Socket Mode bootstrap + user sync

**Files:**
- Create: `apps/slack/package.json`, `apps/slack/.env.example`, `apps/slack/src/app.ts`, `apps/slack/src/userSync.ts`

**Interfaces:**
- Consumes: `@kudos/db` (`prisma`).
- Produces:
  - `app` (Bolt `App` with `socketMode: true`).
  - `resolveUser(slackUserId: string, displayName: string): Promise<{ id: string }>` — finds a DB `User` by `slackUserId`; if absent, links by matching an unlinked seeded user or creates one on the demo team; caches the mapping in the `User` row.

- [ ] **Step 1: Create `apps/slack/package.json`**

```json
{
  "name": "@kudos/slack",
  "version": "0.0.0",
  "type": "module",
  "scripts": { "dev": "tsx watch src/app.ts", "start": "tsx src/app.ts" },
  "dependencies": {
    "@kudos/db": "*",
    "@slack/bolt": "^3.22.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": { "tsx": "^4.19.0", "typescript": "^5.6.0" }
}
```

- [ ] **Step 2: Create `apps/slack/.env.example`**

```
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_KUDOS_CHANNEL=#kudos
```

- [ ] **Step 3: Create `apps/slack/src/userSync.ts`**

```ts
import { prisma } from "@kudos/db";

export async function resolveUser(slackUserId: string, displayName: string): Promise<{ id: string }> {
  const linked = await prisma.user.findUnique({ where: { slackUserId } });
  if (linked) return { id: linked.id };

  // Link to an existing unlinked seeded user if names match, else create one.
  const unlinkedByName = await prisma.user.findFirst({
    where: { slackUserId: null, name: displayName },
  });
  if (unlinkedByName) {
    const updated = await prisma.user.update({
      where: { id: unlinkedByName.id }, data: { slackUserId },
    });
    return { id: updated.id };
  }

  const team = await prisma.team.findFirstOrThrow();
  const created = await prisma.user.create({
    data: { slackUserId, name: displayName, teamId: team.id },
  });
  return { id: created.id };
}
```

- [ ] **Step 4: Create `apps/slack/src/app.ts`**

```ts
import "dotenv/config";
import pkg from "@slack/bolt";
const { App } = pkg;

export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Handlers are registered by importing the modules below (side-effect registration).
import "./kudosCommand.js";
import "./boost.js";

const port = 3001;
await app.start(port);
console.log("⚡️ Kudos Slack app running (Socket Mode)");
```

Note: `kudosCommand.ts` and `boost.ts` register handlers on `app`; they're created in Tasks 9–10. To keep `app.ts` runnable before them, comment the two imports until those tasks land, then re-enable.

- [ ] **Step 5: Install**

Run: `npm install`
Expected: Bolt + dotenv installed; workspace links `@kudos/db`.

- [ ] **Step 6: Commit**

```bash
git add apps/slack package-lock.json
git commit -m "feat(slack): Socket Mode bootstrap + user sync/cache"
```

---

## Task 9: Slack `/kudos` command + modal submit

**Files:**
- Create: `apps/slack/src/kudosCommand.ts`

**Interfaces:**
- Consumes: `app`, `resolveUser`, `@kudos/db` (`giveKudos`, `prisma`).
- Produces: registers `/kudos` slash command (opens a modal with a user picker, a value select populated from `Value`, and a multiline message input) and a `view_submission` handler that calls `giveKudos`, posts a formatted message to the kudos channel, and stores its `ts` on the Kudos row. On a validation error, returns a Slack `response_action: "errors"`.

- [ ] **Step 1: Implement `apps/slack/src/kudosCommand.ts`**

```ts
import { app } from "./app.js";
import { prisma, giveKudos } from "@kudos/db";
import { resolveUser } from "./userSync.js";

const CHANNEL = process.env.SLACK_KUDOS_CHANNEL || "#kudos";

app.command("/kudos", async ({ ack, body, client }) => {
  await ack();
  const values = await prisma.value.findMany();
  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      callback_id: "kudos_submit",
      title: { type: "plain_text", text: "Give Kudos" },
      submit: { type: "plain_text", text: "Send" },
      blocks: [
        { type: "input", block_id: "who", label: { type: "plain_text", text: "Who?" },
          element: { type: "users_select", action_id: "user" } },
        { type: "input", block_id: "value", label: { type: "plain_text", text: "For what?" },
          element: { type: "static_select", action_id: "value",
            options: values.map((v) => ({
              text: { type: "plain_text", text: `${v.emoji} ${v.label}` }, value: v.key,
            })) } },
        { type: "input", block_id: "msg", label: { type: "plain_text", text: "Why? (be specific)" },
          element: { type: "plain_text_input", action_id: "message", multiline: true } },
      ],
    },
  });
});

app.view("kudos_submit", async ({ ack, body, view, client }) => {
  const state = view.state.values;
  const toSlackId = state.who.user.selected_user!;
  const valueKey = state.value.value.selected_option!.value;
  const message = state.msg.message.value ?? "";

  const fromName = body.user.name;
  const from = await resolveUser(body.user.id, fromName);
  const toInfo = await client.users.info({ user: toSlackId });
  const to = await resolveUser(toSlackId, toInfo.user?.real_name || toInfo.user?.name || "teammate");

  try {
    const { id } = await giveKudos({ fromUserId: from.id, toUserId: to.id, valueKey, message });
    await ack();
    const value = await prisma.value.findUniqueOrThrow({ where: { key: valueKey } });
    const posted = await client.chat.postMessage({
      channel: CHANNEL,
      text: `${value.emoji} <@${body.user.id}> recognized <@${toSlackId}> — *${value.label}*\n> ${message}`,
    });
    if (posted.ts) await prisma.kudos.update({ where: { id }, data: { slackMessageTs: posted.ts } });
  } catch (e) {
    await ack({
      response_action: "errors",
      errors: { msg: (e as Error).message },
    });
  }
});
```

- [ ] **Step 2: Re-enable the import in `app.ts`** (if commented in Task 8).

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev:slack` (requires real tokens in `apps/slack/.env`).
In Slack: `/kudos`, pick a user, a value, type a reason, Send.
Expected: a formatted message appears in the kudos channel; `prisma.kudos` has a row with `slackMessageTs` set.

- [ ] **Step 4: Commit**

```bash
git add apps/slack/src/kudosCommand.ts apps/slack/src/app.ts
git commit -m "feat(slack): /kudos modal + view submission -> giveKudos + channel post"
```

---

## Task 10: Reaction boosts

**Files:**
- Create: `apps/slack/src/boost.ts`

**Interfaces:**
- Consumes: `app`, `resolveUser`, `@kudos/db` (`prisma`, `addBoost`).
- Produces: a `reaction_added` handler that, when a reaction lands on a message whose `ts` matches a `Kudos.slackMessageTs`, calls `addBoost` for the reacting user.

- [ ] **Step 1: Implement `apps/slack/src/boost.ts`**

```ts
import { app } from "./app.js";
import { prisma, addBoost } from "@kudos/db";
import { resolveUser } from "./userSync.js";

app.event("reaction_added", async ({ event, client }) => {
  const ts = (event as any).item?.ts as string | undefined;
  if (!ts) return;
  const kudos = await prisma.kudos.findFirst({ where: { slackMessageTs: ts } });
  if (!kudos) return;

  const info = await client.users.info({ user: event.user });
  const booster = await resolveUser(event.user, info.user?.real_name || info.user?.name || "teammate");
  if (booster.id === kudos.toUserId) return; // don't boost your own kudos
  await addBoost({ kudosId: kudos.id, fromUserId: booster.id });
});
```

- [ ] **Step 2: Re-enable the import in `app.ts`** (if commented in Task 8).

- [ ] **Step 3: Manual smoke test**

React with any emoji to a kudos message.
Expected: a `Boost` row is created once; receiver `redeemableBalance` increases by 1; reacting again by the same user does nothing.

- [ ] **Step 4: Commit**

```bash
git add apps/slack/src/boost.ts apps/slack/src/app.ts
git commit -m "feat(slack): reaction_added -> idempotent boost"
```

---

## Task 11: Web app scaffold (Next.js + Tailwind)

**Files:**
- Create: `apps/web/package.json`, `apps/web/next.config.mjs`, `apps/web/tailwind.config.ts`, `apps/web/postcss.config.mjs`, `apps/web/app/layout.tsx`, `apps/web/app/globals.css`, `apps/web/lib/format.ts`

**Interfaces:**
- Produces: a running Next.js App-Router site on port 3000 with Tailwind; `lib/format.ts` exports `timeAgo(date: Date | string): string`.

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@kudos/web",
  "version": "0.0.0",
  "type": "module",
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },
  "dependencies": {
    "@kudos/db": "*",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/react": "^18.3.3",
    "@types/node": "^20.14.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 2: Create config files**

`apps/web/next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
export default { experimental: { externalDir: true } };
```

`apps/web/postcss.config.mjs`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`apps/web/tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}"], theme: { extend: {} }, plugins: [] } satisfies Config;
```

`apps/web/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
body { @apply bg-slate-50 text-slate-900; }
```

- [ ] **Step 3: Create `apps/web/app/layout.tsx`**

```tsx
import "./globals.css";
export const metadata = { title: "Kudos", description: "Peer recognition" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      <header className="border-b bg-white px-6 py-4">
        <nav className="mx-auto flex max-w-3xl gap-6 font-medium">
          <a href="/">Feed</a><a href="/rewards">Rewards</a>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </body></html>
  );
}
```

- [ ] **Step 4: Create `apps/web/lib/format.ts`**

```ts
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
```

- [ ] **Step 5: Install + run**

Run: `npm install && npm run dev:web`
Expected: Next.js starts on http://localhost:3000 with the header nav.

- [ ] **Step 6: Commit**

```bash
git add apps/web package-lock.json
git commit -m "feat(web): Next.js + Tailwind scaffold with layout"
```

---

## Task 12: Feed + celebration page

**Files:**
- Create: `apps/web/app/page.tsx`

**Interfaces:**
- Consumes: `@kudos/db` (`prisma`), `timeAgo`.
- Produces: a server component listing the 30 most recent kudos (giver, receiver, value emoji/label, message, boost count, time) and an inclusive "Recognized this month" strip (distinct receivers this period). No competitive ranking.

- [ ] **Step 1: Implement `apps/web/app/page.tsx`**

```tsx
import { prisma, currentPeriod } from "@kudos/db";
import { timeAgo } from "../lib/format.js";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const { start, end } = currentPeriod();
  const [kudos, values, recognized] = await Promise.all([
    prisma.kudos.findMany({
      orderBy: { createdAt: "desc" }, take: 30,
      include: { fromUser: true, toUser: true, _count: { select: { boosts: true } } },
    }),
    prisma.value.findMany(),
    prisma.kudos.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { toUser: true }, distinct: ["toUserId"],
    }),
  ]);
  const valueMap = Object.fromEntries(values.map((v) => [v.key, v]));

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Recognized this month</h2>
        <div className="flex flex-wrap gap-2">
          {recognized.map((k) => (
            <span key={k.toUserId} className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800">
              {k.toUser.name}
            </span>
          ))}
          {recognized.length === 0 && <span className="text-slate-400">No kudos yet — be the first!</span>}
        </div>
      </section>

      <section className="space-y-3">
        {kudos.map((k) => {
          const v = valueMap[k.valueKey];
          return (
            <article key={k.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  <span className="font-semibold">{k.fromUser.name}</span> recognized{" "}
                  <span className="font-semibold">{k.toUser.name}</span>
                </p>
                <span className="text-xs text-slate-400">{timeAgo(k.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{v ? `${v.emoji} ${v.label}` : k.valueKey}</p>
              <p className="mt-2">{k.message}</p>
              <p className="mt-2 text-xs text-slate-400">🎉 {k._count.boosts} boosts · +{k.points} pts</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run db:seed` then `npm run dev:web`; open http://localhost:3000.
Expected: page renders (empty feed after seed until kudos exist). Create a kudos via Slack or a quick `tsx` script, refresh → it appears.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(web): live feed + inclusive 'recognized this month' strip"
```

---

## Task 13: Rewards catalog + redeem

**Files:**
- Create: `apps/web/app/rewards/page.tsx`, `apps/web/app/api/redeem/route.ts`

**Interfaces:**
- Consumes: `@kudos/db` (`prisma`, `redeemReward`).
- Produces: a rewards grid showing cost + a redeem button; `POST /api/redeem` with `{ userId, rewardId }` that calls `redeemReward` and returns `{ ok, redemptionId }` or `{ ok:false, error }`. (Demo picks the current user via a simple selector defaulting to the first user.)

- [ ] **Step 1: Implement `apps/web/app/api/redeem/route.ts`**

```ts
import { NextResponse } from "next/server";
import { redeemReward } from "@kudos/db";

export async function POST(req: Request) {
  const { userId, rewardId } = await req.json();
  try {
    const { redemptionId } = await redeemReward({ userId, rewardId });
    return NextResponse.json({ ok: true, redemptionId });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Implement `apps/web/app/rewards/page.tsx`**

```tsx
import { prisma } from "@kudos/db";
import { RedeemButton } from "./redeem-button.js";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const [rewards, user] = await Promise.all([
    prisma.reward.findMany({ orderBy: { cost: "asc" } }),
    prisma.user.findFirst({ orderBy: { redeemableBalance: "desc" } }),
  ]);
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Redeeming as</p>
        <p className="text-lg font-semibold">{user?.name} · {user?.redeemableBalance ?? 0} pts</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {rewards.map((r) => (
          <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="font-semibold">{r.name}</p>
            <p className="text-sm text-slate-500">{r.cost} pts · {r.category}</p>
            {user && <RedeemButton userId={user.id} rewardId={r.id} affordable={user.redeemableBalance >= r.cost} />}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement client button `apps/web/app/rewards/redeem-button.tsx`**

```tsx
"use client";
import { useState } from "react";

export function RedeemButton({ userId, rewardId, affordable }: { userId: string; rewardId: string; affordable: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  async function redeem() {
    const res = await fetch("/api/redeem", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, rewardId }),
    });
    const data = await res.json();
    setMsg(data.ok ? "Requested! ✅" : data.error);
  }
  return (
    <div className="mt-2">
      <button onClick={redeem} disabled={!affordable}
        className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white disabled:bg-slate-300">
        Redeem
      </button>
      {msg && <p className="mt-1 text-xs text-slate-500">{msg}</p>}
    </div>
  );
}
```

Update the import in `rewards/page.tsx` to `./redeem-button.js` (already written that way).

- [ ] **Step 4: Verify**

Open http://localhost:3000/rewards. Click Redeem on an affordable reward.
Expected: "Requested! ✅"; a `Redemption(status="requested")` row exists; balance drops. Unaffordable rewards are disabled.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/rewards
git commit -m "feat(web): rewards catalog + redeem API"
```

---

## Task 14: README run instructions + final polish

**Files:**
- Modify: `README.md`

**Interfaces:** none.

- [ ] **Step 1: Add a "Run locally" section to `README.md`**

```markdown
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
```

- [ ] **Step 2: Verify the whole flow end-to-end**

Run tests: `npm test` → all suites PASS.
Start both apps; give a kudos in Slack → appears in `#kudos` + web feed; boost it → balance rises; redeem a reward → request logged.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: local run instructions for the core product"
```

---

## Self-Review

**Spec coverage vs `2026-06-30-kudos-program-design.md`:**
- §4 core loop (Slack give → feed → boost) → Tasks 9, 10, 12 ✅
- §6 data model (7 models incl. Team + teamId) → Task 2 ✅
- §7 points model (give-allowance computed-on-read, separate redeemable balance, never clawed back) → Tasks 4, 5, 6 ✅
- §7 anti-inflation (value + non-empty message required, points cap = fixed per-kudos) → Task 5 ✅
- §8 mechanics: /kudos modal ✅ (9), public channel post ✅ (9), boosts ✅ (10), values ✅ (7/9), inclusive celebration ✅ (12); NO leaderboard ✅ (12, by omission)
- §8 pulsed weekly nudge → **NOT in this plan** (stretch; deferred — noted below)
- Rewards catalog + redeem (logs request) → Tasks 6, 13 ✅
- §9 scale-ready schema (Team, teamId, cached slackUserId) → Tasks 2, 8 ✅
- §11 maintainability (tests on points logic, seed, README) → Tasks 3–7, 14 ✅
- §10 Simulation Lab → **separate plan** (Priority 2) ✅ by design
- Stretch (badges, AI assist, analytics, Vercel) → intentionally excluded ✅

**Deferred with intent:** the pulsed weekly nudge (spec §8 core) is a scheduled job; it's low-risk and demo-optional, so it's deferred to a short follow-up task rather than blocking the core loop. Flagged here so it isn't silently dropped.

**Placeholder scan:** no TBD/TODO; every code step has complete code. ✅
**Type consistency:** `giveKudos`, `addBoost`, `redeemReward`, `remainingAllowance`, `resolveUser`, `currentPeriod`, `timeAgo` signatures match across producing and consuming tasks. ✅
