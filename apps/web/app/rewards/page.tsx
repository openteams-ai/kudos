import { prisma } from "@kudos/db";
import { getCurrentUser } from "../../lib/current-user";
import { RedeemButton } from "./redeem-button";
import { PointsChip } from "../../components/ui/PointsChip";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const [rewards, user] = await Promise.all([
    prisma.reward.findMany({ orderBy: { cost: "asc" } }),
    getCurrentUser(),
  ]);

  if (!user) {
    return (
      <div className="rounded-card border border-borderx bg-card p-8 text-center shadow-card">
        <p className="font-display text-xl font-bold text-ink">Sign in to redeem rewards</p>
        <p className="mt-2 text-ink/60">
          Use “Sign in with Slack” in the top-right to see your balance and redeem.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-card border border-borderx bg-card p-5 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Redeeming as</p>
          <p className="font-display text-lg font-bold text-ink">{user.name}</p>
        </div>
        <PointsChip points={user.redeemableBalance} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rewards.map((r) => {
          const affordable = user.redeemableBalance >= r.cost;
          return (
            <div
              key={r.id}
              className="flex flex-col rounded-card border border-borderx bg-card p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-cardHover"
            >
              <p className="font-display font-semibold text-ink">{r.name}</p>
              <p className="mt-1 text-sm text-ink/50">{r.category}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <PointsChip points={r.cost} />
                {!affordable && (
                  <span className="text-xs text-ink/40">
                    {r.cost - user.redeemableBalance} more to go
                  </span>
                )}
              </div>
              <RedeemButton rewardId={r.id} affordable={affordable} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
