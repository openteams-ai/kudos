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

export class RewardValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RewardValidationError";
  }
}

export class RewardInUseError extends Error {
  constructor() {
    super("reward has redemption history");
    this.name = "RewardInUseError";
  }
}

const MAX_REWARD_COST = 100_000;

type RewardFields = {
  name: string;
  cost: number;
  category: string;
  emoji?: string | null;
  description?: string | null;
};

// Validates whichever catalog fields are present, so it serves both create
// (all fields) and update (a partial patch).
function validateRewardFields(fields: Partial<RewardFields>) {
  if (fields.name !== undefined && fields.name.trim().length === 0)
    throw new RewardValidationError("Reward name is required.");
  if (fields.cost !== undefined && (!Number.isInteger(fields.cost) || fields.cost < 1 || fields.cost > MAX_REWARD_COST))
    throw new RewardValidationError(`Cost must be a whole number between 1 and ${MAX_REWARD_COST} points.`);
  if (fields.category !== undefined && fields.category.trim().length === 0)
    throw new RewardValidationError("Category is required.");
}

export async function createReward(input: RewardFields) {
  validateRewardFields(input);
  return prisma.reward.create({
    data: {
      name: input.name.trim(),
      cost: input.cost,
      category: input.category.trim(),
      emoji: input.emoji?.trim() || null,
      description: input.description?.trim() || null,
    },
  });
}

export async function updateReward(id: string, patch: Partial<RewardFields>) {
  validateRewardFields(patch);
  const data: Partial<RewardFields> = {};
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.cost !== undefined) data.cost = patch.cost;
  if (patch.category !== undefined) data.category = patch.category.trim();
  if (patch.emoji !== undefined) data.emoji = patch.emoji?.trim() || null;
  if (patch.description !== undefined) data.description = patch.description?.trim() || null;
  if (Object.keys(data).length === 0) return prisma.reward.findUniqueOrThrow({ where: { id } });
  return prisma.reward.update({ where: { id }, data });
}

/**
 * Hard-deletes a reward, refusing when any redemption references it so
 * history stays intact. Future work: an `active`/archived flag on Reward so
 * retired rewards can leave the store without losing their history — skipped
 * for now to avoid a schema change.
 */
export async function deleteReward(id: string): Promise<void> {
  const inUse = await prisma.redemption.count({ where: { rewardId: id } });
  if (inUse > 0) throw new RewardInUseError();
  // The FK on Redemption.rewardId backstops the race where a redeem lands
  // between the count and the delete.
  await prisma.reward.delete({ where: { id } });
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
