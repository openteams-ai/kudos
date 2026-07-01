import { auth } from "../auth";
import { prisma } from "@kudos/db";

export async function getCurrentUser() {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
