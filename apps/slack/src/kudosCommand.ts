import type { App } from "@slack/bolt";
import { prisma, giveKudos, remainingAllowance } from "@kudos/db";
import { resolveUser } from "./userSync.js";

const CHANNEL = process.env.SLACK_KUDOS_CHANNEL || "#kudos";

export function registerKudosCommand(app: App) {
  app.command("/kudos", async ({ ack, body, client }) => {
    await ack();
    const values = await prisma.value.findMany();
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "kudos_submit",
        title: { type: "plain_text", text: "Give Kudos" },
        submit: { type: "plain_text", text: "Send" },
        blocks: [
          { type: "input", block_id: "who", label: { type: "plain_text", text: "Who?" },
            element: { type: "users_select", action_id: "user" } },
          { type: "input", block_id: "value", label: { type: "plain_text", text: "For what?" },
            element: { type: "static_select", action_id: "value",
              options: values.map((v) => ({
                text: { type: "plain_text", text: `${v.emoji} ${v.label}` }, value: v.key,
              })) } },
          { type: "input", block_id: "msg", label: { type: "plain_text", text: "Why? (be specific)" },
            element: { type: "plain_text_input", action_id: "message", multiline: true } },
        ],
      },
    });
  });

  app.view("kudos_submit", async ({ ack, body, view, client }) => {
    const state = view.state.values;
    const toSlackId = state.who.user.selected_user!;
    const valueKey = state.value.value.selected_option!.value;
    const message = state.msg.message.value ?? "";

    const from = await resolveUser(body.user.id, body.user.name);
    const toInfo = await client.users.info({ user: toSlackId });
    const to = await resolveUser(toSlackId, toInfo.user?.real_name || toInfo.user?.name || "teammate");

    let kudosId: string;
    try {
      const res = await giveKudos({ fromUserId: from.id, toUserId: to.id, valueKey, message });
      kudosId = res.id;
    } catch (e) {
      await ack({ response_action: "errors", errors: { msg: (e as Error).message } });
      return;
    }

    await ack();

    try {
      const value = await prisma.value.findUniqueOrThrow({ where: { key: valueKey } });
      const posted = await client.chat.postMessage({
        channel: CHANNEL,
        text: `${value.emoji} <@${body.user.id}> recognized <@${toSlackId}> — *${value.label}*\n> ${message}`,
      });
      if (posted.ts) await prisma.kudos.update({ where: { id: kudosId }, data: { slackMessageTs: posted.ts } });
    } catch (e) {
      console.error("kudos post-ack failure:", e);
    }

    // Private allowance feedback for the giver; the kudos already succeeded,
    // so failures here are logged and never surfaced.
    try {
      const left = await remainingAllowance(from.id);
      const text = `✅ +10 pts to <@${toSlackId}> — you have ${left} pts left to give this month.`;
      try {
        await client.chat.postEphemeral({ channel: CHANNEL, user: body.user.id, text });
      } catch {
        // e.g. giver not in the kudos channel — DM them instead
        await client.chat.postMessage({ channel: body.user.id, text });
      }
    } catch (e) {
      console.error("allowance feedback failure:", e);
    }
  });
}
