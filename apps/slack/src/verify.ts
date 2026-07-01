// Verifies your Slack tokens WITHOUT starting the bot.
//   cp apps/slack/.env.example apps/slack/.env   (fill in both tokens)
//   npm -w @kudos/slack run verify
//
// - Bot token (xoxb-...) is checked via auth.test.
// - App-level token (xapp-...) is checked via apps.connections.open (Socket Mode).
import "dotenv/config";

const BOT = process.env.SLACK_BOT_TOKEN;
const APP = process.env.SLACK_APP_TOKEN;
const CHANNEL = process.env.SLACK_KUDOS_CHANNEL || "#kudos";

async function slack(method: string, token: string): Promise<any> {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return res.json();
}

async function main() {
  let ok = true;

  if (!BOT) {
    console.log("✗ SLACK_BOT_TOKEN missing (expected xoxb-...)");
    ok = false;
  } else {
    const r = await slack("auth.test", BOT);
    if (r.ok) console.log(`✓ Bot token valid — team "${r.team}", bot user "${r.user}"`);
    else { console.log(`✗ Bot token invalid — ${r.error}`); ok = false; }
  }

  if (!APP) {
    console.log("✗ SLACK_APP_TOKEN missing (expected xapp-... with connections:write)");
    ok = false;
  } else {
    const r = await slack("apps.connections.open", APP);
    if (r.ok) console.log("✓ App-level token valid — Socket Mode connection can open");
    else { console.log(`✗ App-level token invalid — ${r.error}`); ok = false; }
  }

  console.log(`\nKudos channel configured as: ${CHANNEL} (make sure the bot is invited to it)`);
  console.log(ok ? "\n✅ Tokens look good — run: npm run dev:slack" : "\n❌ Fix the above, then re-run verify.");
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
