/**
 * Posts a redemption celebration to the Slack kudos channel.
 *
 * Fire-and-forget by design: it never throws and never blocks the caller.
 * Without SLACK_BOT_TOKEN + SLACK_KUDOS_CHANNEL it silently no-ops so local
 * dev keeps working with no Slack app configured. Uses plain fetch — no SDK.
 */
import { escapeSlackText } from "./slack-escape";

export function celebrateRedemption(input: {
  userName: string;
  slackUserId?: string | null;
  rewardName: string;
  rewardEmoji?: string | null;
  cost: number;
}): void {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_KUDOS_CHANNEL;
  if (!token?.trim() || !channel?.trim()) return;

  // Escape user-influenced strings; keep the <@…> mention markup we build ourselves.
  const who = input.slackUserId
    ? `<@${input.slackUserId}>`
    : `*${escapeSlackText(input.userName)}*`;
  const emoji = input.rewardEmoji || "🎁";
  const text = `${emoji} ${who} just redeemed *${escapeSlackText(input.rewardName)}* (${input.cost} pts) — congrats! 🎉`;

  fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel, text }),
  })
    .then(async (res) => {
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!data.ok) console.error("slack celebration failed:", data.error);
    })
    .catch((e) => console.error("slack celebration failed:", e));
}
