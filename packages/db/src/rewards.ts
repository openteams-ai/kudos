import { Prisma } from "@prisma/client";
import { prisma } from "./client.js";

export class InsufficientBalanceError extends Error {
  constructor() {
    super("insufficient balance");
    this.name = "InsufficientBalanceError";
  }
}

export async function redeemReward(input: { userId: string; rewardId: string }): Promise<{ redemptionId: string }> {
  const { userId, rewardId } = input;
  await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const reward = await prisma.reward.findUniqueOrThrow({ where: { id: rewardId } });

  const redemption = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Conditional decrement: only debits when the balance still covers the
    // cost, so concurrent redeems can't drive redeemableBalance negative.
    const debited = await tx.user.updateMany({
      where: { id: userId, redeemableBalance: { gte: reward.cost } },
      data: { redeemableBalance: { decrement: reward.cost } },
    });
    if (debited.count === 0) throw new InsufficientBalanceError();
    return tx.redemption.create({
      data: { userId, rewardId, cost: reward.cost, status: "requested" },
    });
  });
  return { redemptionId: redemption.id };
}

/**
 * A user's redemption history, newest first, with the redeemed reward joined in
 * so the UI can show its emoji, name, and category without a second query.
 */
export async function listRedemptionsForUser(userId: string) {
  return prisma.redemption.findMany({
    where: { userId },
    include: { reward: true },
    orderBy: { createdAt: "desc" },
  });
}
