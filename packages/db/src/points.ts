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
