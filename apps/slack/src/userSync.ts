import { linkSlackUser } from "@kudos/db";

export async function resolveUser(slackUserId: string, displayName: string): Promise<{ id: string }> {
  return linkSlackUser({ slackUserId, name: displayName });
}
