import "dotenv/config";
import pkg from "@slack/bolt";
const { App } = pkg;

export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// Handlers are registered by importing the modules below (side-effect registration).
// TODO(Task 10): re-enable once boost.ts is created.
import "./kudosCommand.js";
// import "./boost.js";

const port = 3001;
await app.start(port);
console.log("⚡️ Kudos Slack app running (Socket Mode)");
