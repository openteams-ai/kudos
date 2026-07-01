import { NextResponse } from "next/server";
import { redeemReward } from "@kudos/db";

export async function POST(req: Request) {
  const { userId, rewardId } = await req.json();
  try {
    const { redemptionId } = await redeemReward({ userId, rewardId });
    return NextResponse.json({ ok: true, redemptionId });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
