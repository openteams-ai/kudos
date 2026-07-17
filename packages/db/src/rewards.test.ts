import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "./client.js";
import { redeemReward, listRedemptionsForUser } from "./rewards.js";

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
    expect(fulfilled).toHaveLength(1);
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.redeemableBalance).toBe(0);
    expect(await prisma.redemption.count()).toBe(1);
  });
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
    // Nudge the clock so the second redemption sorts strictly newer than the first.
    await new Promise((r) => setTimeout(r, 5));
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
