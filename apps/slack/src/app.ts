import "dotenv/config";
import pkg from "@slack/bolt";
const { App } = pkg;
import { registerKudosCommand } from "./kudosCommand.js";
// import { registerBoost } from "./boost.js";  // Task 10 re-enables

export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

registerKudosCommand(app);
// registerBoost(app);  // Task 10

const port = 3001;
await app.start(port);
console.log("⚡️ Kudos Slack app running (Socket Mode)");
