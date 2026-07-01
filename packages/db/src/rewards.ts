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
