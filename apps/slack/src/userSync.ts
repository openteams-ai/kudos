import { prisma } from "@kudos/db";

export async function resolveUser(slackUserId: string, displayName: string): Promise<{ id: string }> {
  const linked = await prisma.user.findUnique({ where: { slackUserId } });
  if (linked) return { id: linked.id };

  // Link to an existing unlinked seeded user if names match, else create one.
  const unlinkedByName = await prisma.user.findFirst({
    where: { slackUserId: null, name: displayName },
  });
  if (unlinkedByName) {
    const updated = await prisma.user.update({
      where: { id: unlinkedByName.id }, data: { slackUserId },
    });
    return { id: updated.id };
  }

  const team = await prisma.team.findFirstOrThrow();
  const created = await prisma.user.create({
    data: { slackUserId, name: displayName, teamId: team.id },
  });
  return { id: created.id };
}
