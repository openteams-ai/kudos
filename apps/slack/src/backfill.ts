// One-off demo utility: backfill the #kudos channel with recent kudos from the DB
// so the channel feed looks alive without needing real Slack users.
// Usage: npm -w @kudos/slack run backfill   (posts the 10 most recent kudos)
import "dotenv/config";
import { WebClient } from "@slack/web-api";
import { prisma } from "@kudos/db";

const CHANNEL = process.env.SLACK_KUDOS_CHANNEL ?? "#kudos";
const COUNT = Number(process.env.BACKFILL_COUNT ?? 10);

type Value = Awaited<ReturnType<typeof prisma.value.findMany>>[number];

async function main() {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token || token.includes("...")) throw new Error("SLACK_BOT_TOKEN not configured");
  const slack = new WebClient(token);

  const values = Object.fromEntries(
    (await prisma.value.findMany()).map((v: Value): [string, Value] => [v.key, v]),
  );
  const kudos = await prisma.kudos.findMany({
    orderBy: { createdAt: "desc" },
    take: COUNT,
    include: { fromUser: true, toUser: true },
  });

  // oldest first so the channel reads chronologically
  for (const k of kudos.reverse()) {
    const v = values[k.valueKey];
    const text = `${v?.emoji ?? "🌟"} *${k.fromUser.name}* recognized *${k.toUser.name}* — *${v?.label ?? k.valueKey}*\n> ${k.message}`;
    await slack.chat.postMessage({ channel: CHANNEL, text });
    console.log(`posted: ${k.fromUser.name} → ${k.toUser.name} (${v?.label})`);
    await new Promise((r) => setTimeout(r, 1100)); // respect chat.postMessage rate limit
  }
  console.log(`\nDone — ${kudos.length} kudos posted to ${CHANNEL}`);
}

main().catch((e) => {
  console.error(e?.data ?? e);
  process.exit(1);
});
