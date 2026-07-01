import { app } from "./app.js";
import { prisma, giveKudos } from "@kudos/db";
import { resolveUser } from "./userSync.js";

const CHANNEL = process.env.SLACK_KUDOS_CHANNEL || "#kudos";

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

  const fromName = body.user.name;
  const from = await resolveUser(body.user.id, fromName);
  const toInfo = await client.users.info({ user: toSlackId });
  const to = await resolveUser(toSlackId, toInfo.user?.real_name || toInfo.user?.name || "teammate");

  try {
    const { id } = await giveKudos({ fromUserId: from.id, toUserId: to.id, valueKey, message });
    await ack();
    const value = await prisma.value.findUniqueOrThrow({ where: { key: valueKey } });
    const posted = await client.chat.postMessage({
      channel: CHANNEL,
      text: `${value.emoji} <@${body.user.id}> recognized <@${toSlackId}> — *${value.label}*\n> ${message}`,
    });
    if (posted.ts) await prisma.kudos.update({ where: { id }, data: { slackMessageTs: posted.ts } });
  } catch (e) {
    await ack({
      response_action: "errors",
      errors: { msg: (e as Error).message },
    });
  }
});
