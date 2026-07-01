import { prisma } from "./client.js";

export async function linkSlackUser(input: {
  slackUserId: string; name: string; email?: string | null; avatarUrl?: string | null;
}): Promise<{ id: string }> {
  const { slackUserId, name, email, avatarUrl } = input;

  const linked = await prisma.user.findUnique({ where: { slackUserId } });
  if (linked) {
    const updated = await prisma.user.update({
      where: { id: linked.id },
      data: { name, ...(email ? { email } : {}), ...(avatarUrl ? { avatarUrl } : {}) },
    });
    return { id: updated.id };
  }

  const unlinkedByName = await prisma.user.findFirst({ where: { slackUserId: null, name } });
  if (unlinkedByName) {
    const updated = await prisma.user.update({
      where: { id: unlinkedByName.id },
      data: { slackUserId, ...(email ? { email } : {}), ...(avatarUrl ? { avatarUrl } : {}) },
    });
    return { id: updated.id };
  }

  const team = await prisma.team.findFirstOrThrow();
  const created = await prisma.user.create({
    data: { slackUserId, name, email: email ?? null, avatarUrl: avatarUrl ?? null, teamId: team.id },
  });
  return { id: created.id };
}
