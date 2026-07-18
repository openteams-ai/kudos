import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "./client.js";
import {
  redeemReward,
  listRedemptionsForUser,
  listAllRedemptions,
  fulfillRedemption,
  adminStats,
} from "./rewards.js";
import { currentPeriod } from "./period.js";

async function reset() {
  // Also clear Boost/Kudos: suites share one on-disk SQLite db and run
  // sequentially (see vitest.config.ts), so leftover Kudos/Boost rows from
  // kudos.test.ts / points.test.ts's last test would otherwise violate the
  // FK constraint on user.deleteMany() below.
  await prisma.redemption.deleteMany();
  await prisma.boost.deleteMany();
  await prisma.kudos.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
}

describe("redeemReward", () => {
  beforeEach(reset);
  // Clear our Redemption rows before the next suite: users.test.ts's reset()
  // deletes User but not Redemption, so a leftover row here would violate the
  // FK constraint on its user.deleteMany().
  afterAll(reset);

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

  it("does not create a Redemption row when balance is insufficient", async () => {
    const team = await prisma.team.create({ data: { name: "Eng" } });
    const user = await prisma.user.create({ data: { name: "Ada", teamId: team.id, redeemableBalance: 5 } });
    const reward = await prisma.reward.create({ data: { name: "Hoodie", cost: 200, category: "swag" } });
    await expect(redeemReward({ userId: user.id, rewardId: reward.id })).rejects.toThrow("insufficient balance");
    expect(await prisma.redemption.count()).toBe(0);
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.redeemableBalance).toBe(5);
  });

  it("never drives the balance negative under concurrent redeems", async () => {
    const team = await prisma.team.create({ data: { name: "Eng" } });
    const user = await prisma.user.create({ data: { name: "Ada", teamId: team.id, redeemableBalance: 100 } });
    const reward = await prisma.reward.create({ data: { name: "Hoodie", cost: 100, category: "swag" } });

    // Fire five redeems at once; the balance only covers one.
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => redeemReward({ userId: user.id, rewardId: reward.id })),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    // The invariant under contention: never more than one winner, never a negative
    // balance, and redemption rows exactly match the winners. On slow CI runners
    // SQLite lock contention can abort ALL five (0 winners) — that still satisfies
    // the safety property. The pre-fix TOCTOU code fails this: 5 winners, balance -400.
    expect(fulfilled.length).toBeLessThanOrEqual(1);
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.redeemableBalance).toBe(100 - 100 * fulfilled.length);
    expect(after!.redeemableBalance).toBeGreaterThanOrEqual(0);
    expect(await prisma.redemption.count()).toBe(fulfilled.length);
  }, 30_000); // generous timeout: concurrent SQLite txns are slow on shared CI runners
});

describe("listRedemptionsForUser", () => {
  beforeEach(reset);
  afterAll(reset);

  it("returns the user's redemptions newest first with the reward joined in", async () => {
    const team = await prisma.team.create({ data: { name: "Eng" } });
    const user = await prisma.user.create({ data: { name: "Ada", teamId: team.id, redeemableBalance: 500 } });
    const sticker = await prisma.reward.create({ data: { name: "Sticker", cost: 20, category: "Company Swag", emoji: "🎨" } });
    const hoodie = await prisma.reward.create({ data: { name: "Hoodie", cost: 200, category: "Company Swag", emoji: "🧥" } });

    await redeemReward({ userId: user.id, rewardId: sticker.id });
    await redeemReward({ userId: user.id, rewardId: hoodie.id });

    const history = await listRedemptionsForUser(user.id);

    expect(history).toHaveLength(2);
    expect(history[0].reward.name).toBe("Hoodie");
    expect(history[0].reward.emoji).toBe("🧥");
    expect(history[0].cost).toBe(200);
    expect(history[0].status).toBe("requested");
    expect(history[1].reward.name).toBe("Sticker");
  });

  it("excludes other users' redemptions", async () => {
    const team = await prisma.team.create({ data: { name: "Eng" } });
    const ada = await prisma.user.create({ data: { name: "Ada", teamId: team.id, redeemableBalance: 100 } });
    const ben = await prisma.user.create({ data: { name: "Ben", teamId: team.id, redeemableBalance: 100 } });
    const reward = await prisma.reward.create({ data: { name: "Pin", cost: 30, category: "Company Swag" } });

    await redeemReward({ userId: ben.id, rewardId: reward.id });

    expect(await listRedemptionsForUser(ada.id)).toHaveLength(0);
    expect(await listRedemptionsForUser(ben.id)).toHaveLength(1);
  });
});

describe("listAllRedemptions", () => {
  beforeEach(reset);
  afterAll(reset);

  it("returns every user's redemptions newest first with reward and user joined", async () => {
    const team = await prisma.team.create({ data: { name: "Eng" } });
    const ada = await prisma.user.create({ data: { name: "Ada", teamId: team.id, redeemableBalance: 100 } });
    const ben = await prisma.user.create({ data: { name: "Ben", teamId: team.id, redeemableBalance: 100 } });
    const sticker = await prisma.reward.create({ data: { name: "Sticker", cost: 20, category: "Company Swag", emoji: "🎨" } });
    const pin = await prisma.reward.create({ data: { name: "Pin", cost: 30, category: "Company Swag" } });

    await redeemReward({ userId: ada.id, rewardId: sticker.id });
    await redeemReward({ userId: ben.id, rewardId: pin.id });

    const all = await listAllRedemptions();

    expect(all).toHaveLength(2);
    expect(all[0].user.name).toBe("Ben");
    expect(all[0].reward.name).toBe("Pin");
    expect(all[1].user.name).toBe("Ada");
    expect(all[1].reward.emoji).toBe("🎨");
  });
});

describe("fulfillRedemption", () => {
  beforeEach(reset);
  afterAll(reset);

  it("flips a requested redemption to fulfilled", async () => {
    const team = await prisma.team.create({ data: { name: "Eng" } });
    const user = await prisma.user.create({ data: { name: "Ada", teamId: team.id, redeemableBalance: 50 } });
    const reward = await prisma.reward.create({ data: { name: "Sticker", cost: 20, category: "swag" } });
    const { redemptionId } = await redeemReward({ userId: user.id, rewardId: reward.id });

    expect(await fulfillRedemption(redemptionId)).toEqual({ updated: true });

    const after = await prisma.redemption.findUnique({ where: { id: redemptionId } });
    expect(after?.status).toBe("fulfilled");
  });

  it("is a no-op on an already-fulfilled redemption", async () => {
    const team = await prisma.team.create({ data: { name: "Eng" } });
    const user = await prisma.user.create({ data: { name: "Ada", teamId: team.id, redeemableBalance: 50 } });
    const reward = await prisma.reward.create({ data: { name: "Sticker", cost: 20, category: "swag" } });
    const { redemptionId } = await redeemReward({ userId: user.id, rewardId: reward.id });

    await fulfillRedemption(redemptionId);
    expect(await fulfillRedemption(redemptionId)).toEqual({ updated: false });

    const after = await prisma.redemption.findUnique({ where: { id: redemptionId } });
    expect(after?.status).toBe("fulfilled");
  });

  it("throws for an unknown redemption id", async () => {
    await expect(fulfillRedemption("nope")).rejects.toThrow();
  });
});

describe("adminStats", () => {
  beforeEach(reset);
  afterAll(reset);

  it("counts this month's kudos and awarded points (incl. boosts) and the pending queue", async () => {
    const team = await prisma.team.create({ data: { name: "Eng" } });
    const ada = await prisma.user.create({ data: { name: "Ada", teamId: team.id, redeemableBalance: 100 } });
    const ben = await prisma.user.create({ data: { name: "Ben", teamId: team.id } });
    const { start } = currentPeriod();
    const lastMonth = new Date(start.getTime() - 1000);
    const base = { fromUserId: ada.id, toUserId: ben.id, teamId: team.id, valueKey: "teamwork", message: "great work", points: 10 };

    // Two kudos this month, one from last month (excluded).
    const k1 = await prisma.kudos.create({ data: base });
    await prisma.kudos.create({ data: base });
    await prisma.kudos.create({ data: { ...base, createdAt: lastMonth } });
    // One boost this month, one from last month (excluded).
    await prisma.boost.create({ data: { kudosId: k1.id, fromUserId: ada.id, points: 1 } });
    await prisma.boost.create({ data: { kudosId: k1.id, fromUserId: ben.id, points: 1, createdAt: lastMonth } });

    // Two redemptions; fulfilling one leaves one pending.
    const reward = await prisma.reward.create({ data: { name: "Sticker", cost: 20, category: "swag" } });
    await redeemReward({ userId: ada.id, rewardId: reward.id });
    const { redemptionId } = await redeemReward({ userId: ada.id, rewardId: reward.id });
    await fulfillRedemption(redemptionId);

    expect(await adminStats()).toEqual({
      kudosThisMonth: 2,
      pointsAwardedThisMonth: 21,
      pendingRedemptions: 1,
    });
  });
});
