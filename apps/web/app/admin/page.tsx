import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, adminStats, listAllRedemptions } from "@kudos/db";
import { getCurrentUser } from "../../lib/current-user";
import { Avatar } from "../../components/ui/Avatar";
import { PointsChip } from "../../components/ui/PointsChip";
import { Button } from "../../components/ui/Button";
import { fulfillRedemptionAction } from "./actions";
import { Catalog } from "./catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Kudos", description: "Program stats, redemption queue & catalog" };

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-borderx bg-card p-5 shadow-card">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-extrabold text-ink">{value}</dd>
    </div>
  );
}

// Status is always glyph + text, never color alone.
function StatusPill({ status }: { status: string }) {
  if (status === "fulfilled") {
    return (
      <span className="inline-flex items-center rounded-pill bg-teal/12 px-2.5 py-0.5 text-xs font-display font-semibold text-teal-ink">
        ✓ Fulfilled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-pill bg-gold/15 px-2.5 py-0.5 text-xs font-display font-semibold text-[#7A5A12]">
      ● Requested
    </span>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  // Unlisted + admin-only in every environment; 404 so the page's existence
  // isn't revealed to non-admins (same posture as /setup).
  const user = await getCurrentUser();
  if (user?.isAdmin !== true) notFound();

  const [stats, redemptions, rewards] = await Promise.all([
    adminStats(),
    listAllRedemptions(),
    prisma.reward.findMany({ orderBy: [{ cost: "asc" }, { id: "asc" }] }),
  ]);

  // Per-reward redemption counts drive the "can't delete, has history" state.
  const redemptionCounts = new Map<string, number>();
  for (const r of redemptions) {
    redemptionCounts.set(r.rewardId, (redemptionCounts.get(r.rewardId) ?? 0) + 1);
  }

  const error = searchParams?.error;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Admin dashboard</h1>
        <p className="mt-1 text-sm text-ink/60">
          What’s happening in the kudos program this month.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-[#F3C9C9] bg-[#FBEAEA] px-4 py-3 text-sm font-semibold text-[#8C1D1D]"
        >
          <span>{error}</span>
          <Link
            href="/admin"
            className="rounded-pill px-2 py-0.5 font-display underline decoration-[#8C1D1D]/40 underline-offset-2 hover:decoration-[#8C1D1D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Dismiss
          </Link>
        </div>
      )}

      <section aria-labelledby="admin-stats-heading">
        <h2 id="admin-stats-heading" className="sr-only">
          This month at a glance
        </h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Kudos this month" value={stats.kudosThisMonth} />
          <StatCard label="Points awarded" value={stats.pointsAwardedThisMonth} />
          <StatCard label="Pending redemptions" value={stats.pendingRedemptions} />
        </dl>
      </section>

      <section aria-labelledby="admin-queue-heading" className="space-y-3">
        <h2 id="admin-queue-heading" className="font-display text-lg font-bold text-ink">
          Redemption queue
        </h2>

        {redemptions.length === 0 ? (
          <div className="rounded-card border border-borderx bg-card p-8 text-center shadow-card">
            <p className="text-4xl" aria-hidden="true">
              🛎️
            </p>
            <p className="mt-3 font-display text-lg font-bold text-ink">No redemptions yet</p>
            <p className="mt-2 text-ink/60">
              When teammates redeem rewards, their requests land here for you to fulfill.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-borderx bg-card shadow-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-borderx text-xs font-semibold uppercase tracking-wide text-ink/60">
                  <th scope="col" className="px-4 py-3">
                    Teammate
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Reward
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Cost
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} className="border-b border-borderx last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={r.user.name} avatarUrl={r.user.avatarUrl} size="sm" />
                        <span className="font-display font-semibold text-ink">{r.user.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      <span aria-hidden="true" className="mr-1.5">
                        {r.reward.emoji ?? "🎁"}
                      </span>
                      {r.reward.name}
                    </td>
                    <td className="px-4 py-3">
                      <PointsChip points={r.cost} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink/70">
                      {dateFmt.format(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "requested" && (
                        <form action={fulfillRedemptionAction}>
                          <input type="hidden" name="redemptionId" value={r.id} />
                          <Button variant="subtle" className="px-3 py-1 text-xs">
                            Mark fulfilled
                            <span className="sr-only"> — {r.reward.name} for {r.user.name}</span>
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-ink/60">
          Fulfillment is manual by design: hand over the reward (or book the day off), then mark
          it fulfilled here. No integrations to break during the pilot.
        </p>
      </section>

      <Catalog rewards={rewards} redemptionCounts={redemptionCounts} />
    </div>
  );
}
