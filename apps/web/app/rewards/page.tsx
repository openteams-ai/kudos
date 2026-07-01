import { prisma } from "@kudos/db";
import { getCurrentUser } from "../../lib/current-user";
import { RedeemButton } from "./redeem-button";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const [rewards, user] = await Promise.all([
    prisma.reward.findMany({ orderBy: { cost: "asc" } }),
    getCurrentUser(),
  ]);

  if (!user) {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-semibold">Sign in to redeem rewards</p>
        <p className="mt-1 text-sm text-slate-500">Use “Sign in with Slack” in the top-right to see your balance and redeem.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Redeeming as</p>
        <p className="text-lg font-semibold">{user.name} · {user.redeemableBalance} pts</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {rewards.map((r) => (
          <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="font-semibold">{r.name}</p>
            <p className="text-sm text-slate-500">{r.cost} pts · {r.category}</p>
            <RedeemButton userId={user.id} rewardId={r.id} affordable={user.redeemableBalance >= r.cost} />
          </div>
        ))}
      </div>
    </div>
  );
}
