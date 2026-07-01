import { prisma } from "@kudos/db";
import { RedeemButton } from "./redeem-button.js";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const [rewards, user] = await Promise.all([
    prisma.reward.findMany({ orderBy: { cost: "asc" } }),
    prisma.user.findFirst({ orderBy: { redeemableBalance: "desc" } }),
  ]);
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Redeeming as</p>
        <p className="text-lg font-semibold">{user?.name} · {user?.redeemableBalance ?? 0} pts</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {rewards.map((r) => (
          <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="font-semibold">{r.name}</p>
            <p className="text-sm text-slate-500">{r.cost} pts · {r.category}</p>
            {user && <RedeemButton userId={user.id} rewardId={r.id} affordable={user.redeemableBalance >= r.cost} />}
          </div>
        ))}
      </div>
    </div>
  );
}
