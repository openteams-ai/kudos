import { NextResponse } from "next/server";
import { prisma, redeemReward, InsufficientBalanceError } from "@kudos/db";
import { getCurrentUser } from "../../../lib/current-user";
import { celebrateRedemption } from "../../../lib/slack-celebrate";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "not signed in" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
  }
  const rewardId = (body as { rewardId?: unknown })?.rewardId;
  if (typeof rewardId !== "string" || rewardId.length === 0) {
    return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
  }

  try {
    const { redemptionId } = await redeemReward({ userId: user.id, rewardId });
    // Fire-and-forget Slack celebration — must never affect the API response.
    void prisma.reward
      .findUnique({ where: { id: rewardId } })
      .then((reward) => {
        if (reward) {
          celebrateRedemption({
            userName: user.name,
            slackUserId: user.slackUserId,
            rewardName: reward.name,
            rewardEmoji: reward.emoji,
            cost: reward.cost,
          });
        }
      })
      .catch((e) => console.error("slack celebration lookup failed:", e));
    return NextResponse.json({ ok: true, redemptionId });
  } catch (e) {
    if (e instanceof InsufficientBalanceError) {
      return NextResponse.json({ ok: false, error: "insufficient balance" }, { status: 409 });
    }
    if ((e as { code?: string }).code === "P2025") {
      return NextResponse.json({ ok: false, error: "reward not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: "could not redeem reward" }, { status: 500 });
  }
}
