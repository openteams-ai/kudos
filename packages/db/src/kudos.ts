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
