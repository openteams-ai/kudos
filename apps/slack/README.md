# Kudos Slack bot — setup

Socket Mode (no public URL / ngrok). ~5 minutes in your own test workspace.

## 1. Create the app from the manifest (one shot)
1. Go to <https://api.slack.com/apps> → **Create New App** → **From a manifest**.
2. Pick your (personal/test) workspace.
3. Paste the contents of [`manifest.yaml`](./manifest.yaml) → **Create**.
   - This configures Socket Mode, the bot scopes, the `/kudos` command, and the `reaction_added` event automatically.

## 2. Get the two tokens
- **Bot token** (`xoxb-…`): **Install to Workspace** → **OAuth & Permissions** → copy *Bot User OAuth Token*.
- **App-level token** (`xapp-…`): **Basic Information** → **App-Level Tokens** → **Generate** with scope `connections:write` → copy it.

## 3. Configure env
```bash
cp apps/slack/.env.example apps/slack/.env
# edit .env: paste SLACK_BOT_TOKEN=xoxb-...  and  SLACK_APP_TOKEN=xapp-...
```

## 4. Create the channel & invite the bot
- Create a `#kudos` channel (or set `SLACK_KUDOS_CHANNEL` in `.env` to another).
- In that channel: `/invite @kudos`.

## 5. Verify tokens (before running the app)
```bash
npm -w @kudos/slack run verify
```
Confirms both tokens are valid and the Socket Mode connection can open. Fix anything it flags.

## 6. Run
```bash
npm run db:generate && npm run db:push && npm run db:seed   # first time
npm run dev:slack   # terminal 1
npm run dev:web     # terminal 2 -> http://localhost:3000
```
Then in Slack: `/kudos`, pick a teammate + value + reason → it posts to `#kudos` and appears in the web feed. React to a kudos to boost it.
