import Link from "next/link";
import { listRedemptionsForUser } from "@kudos/db";
import { getCurrentUser } from "../../../lib/current-user";
import { PointsChip } from "../../../components/ui/PointsChip";
import { tileClass } from "../../../lib/reward-categories";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function RewardsHistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="rounded-card border border-borderx bg-card p-8 text-center shadow-card">
        <p className="text-4xl" aria-hidden="true">
          🎁
        </p>
        <p className="mt-3 font-display text-xl font-bold text-ink">Sign in to see your rewards</p>
        <p className="mt-2 text-ink/60">
          Use “Sign in with Slack” in the top-right to view everything you’ve redeemed.
        </p>
      </div>
    );
  }

  const redemptions = await listRedemptionsForUser(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">My Rewards</h1>
          <p className="mt-1 text-sm text-ink/60">Everything you’ve redeemed with your kudos.</p>
        </div>
        <Link
          href="/rewards"
          className="rounded-pill border border-borderx bg-card px-4 py-1.5 text-sm font-display font-semibold text-ink/70 transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          ← Back to store
        </Link>
      </div>

      {redemptions.length === 0 ? (
        <div className="rounded-card border border-borderx bg-card p-8 text-center shadow-card">
          <p className="text-4xl" aria-hidden="true">
            🛍️
          </p>
          <p className="mt-3 font-display text-lg font-bold text-ink">No rewards yet</p>
          <p className="mt-2 text-ink/60">
            Head to the store and turn your points into something good.
          </p>
          <Link
            href="/rewards"
            className="mt-4 inline-flex rounded-pill bg-primary px-5 py-2 text-sm font-display font-semibold text-white shadow-card transition hover:bg-[#a012c0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Browse rewards
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {redemptions.map((redemption) => (
            <li
              key={redemption.id}
              className="flex items-center gap-4 rounded-card border border-borderx bg-card p-4 shadow-card"
            >
              <div
                className={
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-card " +
                  tileClass(redemption.reward.category)
                }
              >
                <span aria-hidden="true" className="text-3xl">
                  {redemption.reward.emoji ?? "🎁"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold text-ink">
                  {redemption.reward.name}
                </p>
                <p className="text-sm text-ink/50">{dateFmt.format(redemption.createdAt)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <PointsChip points={redemption.cost} />
                <span className="inline-flex items-center rounded-pill bg-teal/12 px-2.5 py-0.5 text-xs font-display font-semibold text-teal">
                  Requested ✓
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {redemptions.length > 0 && (
        <p className="text-center text-xs text-ink/50">
          “Requested” means your team has the request and will get it fulfilled. 🎉
        </p>
      )}
    </div>
  );
}
