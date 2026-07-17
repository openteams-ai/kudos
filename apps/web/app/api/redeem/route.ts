import { NextResponse } from "next/server";
import { redeemReward, InsufficientBalanceError } from "@kudos/db";
import { getCurrentUser } from "../../../lib/current-user";

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
