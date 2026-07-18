import { Prisma } from "@prisma/client";
import { prisma } from "./client.js";
import { currentPeriod } from "./period.js";

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
    // id (a monotonic cuid) breaks ties so same-millisecond redemptions still
    // sort deterministically newest-first.
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

/**
 * Every redemption across all users for the admin queue, newest first, with
 * the reward and the redeeming user joined in.
 */
export async function listAllRedemptions() {
  return prisma.redemption.findMany({
    include: { reward: true, user: true },
    // Same deterministic newest-first ordering as listRedemptionsForUser.
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

/**
 * Mark a requested redemption as fulfilled. Idempotent for the admin UI: a
 * double-click (or two admins racing) on an already-fulfilled redemption is a
 * no-op reported as `{ updated: false }`. An unknown id still throws.
 */
export async function fulfillRedemption(id: string): Promise<{ updated: boolean }> {
  // Conditional update: only flips rows still in "requested", so concurrent
  // fulfills can't both report success.
  const res = await prisma.redemption.updateMany({
    where: { id, status: "requested" },
    data: { status: "fulfilled" },
  });
  if (res.count === 1) return { updated: true };
  await prisma.redemption.findUniqueOrThrow({ where: { id } });
  return { updated: false };
}

/**
 * Snapshot counters for the admin dashboard: recognition activity this
 * calendar month plus the current fulfillment backlog.
 */
export async function adminStats(now: Date = new Date()) {
  const { start, end } = currentPeriod(now);
  const inPeriod = { createdAt: { gte: start, lt: end } };
  const [kudosAgg, boostAgg, pendingRedemptions] = await Promise.all([
    prisma.kudos.aggregate({ _count: true, _sum: { points: true }, where: inPeriod }),
    prisma.boost.aggregate({ _sum: { points: true }, where: inPeriod }),
    prisma.redemption.count({ where: { status: "requested" } }),
  ]);
  return {
    kudosThisMonth: kudosAgg._count,
    // Boosts credit redeemable balances too, so "points awarded" counts both.
    pointsAwardedThisMonth: (kudosAgg._sum.points ?? 0) + (boostAgg._sum.points ?? 0),
    pendingRedemptions,
  };
}
