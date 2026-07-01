import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "./client.js";
import { redeemReward } from "./rewards.js";

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
