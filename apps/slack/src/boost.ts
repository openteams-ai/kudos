import type { App } from "@slack/bolt";
import { prisma, addBoost } from "@kudos/db";
import { resolveUser } from "./userSync.js";

export function registerBoost(app: App) {
  app.event("reaction_added", async ({ event, client }) => {
    const ts = (event as any).item?.ts as string | undefined;
    if (!ts) return;
    const kudos = await prisma.kudos.findFirst({ where: { slackMessageTs: ts } });
    if (!kudos) return;

    const info = await client.users.info({ user: event.user });
    const booster = await resolveUser(event.user, info.user?.real_name || info.user?.name || "teammate");
    if (booster.id === kudos.toUserId) return; // don't boost your own kudos
    await addBoost({ kudosId: kudos.id, fromUserId: booster.id });
  });
}
