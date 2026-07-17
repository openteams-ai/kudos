import Link from "next/link";
import { prisma } from "@kudos/db";
import { getCurrentUser } from "../../lib/current-user";
import { PointsChip } from "../../components/ui/PointsChip";
import { RewardsStore, type StoreReward } from "./rewards-store";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const [rewards, user] = await Promise.all([
    prisma.reward.findMany({ orderBy: { cost: "asc" } }),
    getCurrentUser(),
  ]);

  if (!user) {
    return (
      <div className="rounded-card border border-borderx bg-card p-8 text-center shadow-card">
        <p className="text-4xl" aria-hidden="true">
          🎁
        </p>
        <p className="mt-3 font-display text-xl font-bold text-ink">Sign in to redeem rewards</p>
        <p className="mt-2 text-ink/60">
          Use “Sign in with Slack” in the top-right to see your balance and turn your kudos into
          rewards.
        </p>
      </div>
    );
  }

  const storeRewards: StoreReward[] = rewards.map((r) => ({
    id: r.id,
    name: r.name,
    cost: r.cost,
    category: r.category,
    description: r.description,
    emoji: r.emoji,
  }));

  return (
    <div className="space-y-8">
      <h1 className="sr-only">Rewards store</h1>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-borderx bg-card p-5 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">Redeeming as</p>
          <p className="font-display text-lg font-bold text-ink">{user.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <PointsChip points={user.redeemableBalance} />
          <Link
            href="/rewards/history"
            className="rounded-pill border border-borderx bg-card px-4 py-1.5 text-sm font-display font-semibold text-ink/70 transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            My Rewards
          </Link>
        </div>
      </div>

      <RewardsStore rewards={storeRewards} startingBalance={user.redeemableBalance} />
    </div>
  );
}
