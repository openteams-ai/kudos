import { prisma, currentPeriod } from "@kudos/db";
import { timeAgo } from "../lib/format.js";
import { getCurrentUser } from "../lib/current-user";
import { Avatar } from "../components/ui/Avatar";
import { KudosCard } from "../components/ui/KudosCard";
import { FeedConfetti } from "../components/ui/FeedConfetti";

export const dynamic = "force-dynamic";

// Opens the #kudos channel in the viewer's Slack, where giving happens this slice.
const SLACK_KUDOS_LINK = "https://slack.com/app_redirect?channel=kudos";

export default async function FeedPage() {
  const { start, end } = currentPeriod();
  const [kudos, values, recognized, monthCount, user] = await Promise.all([
    prisma.kudos.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { fromUser: true, toUser: true, _count: { select: { boosts: true } } },
    }),
    prisma.value.findMany(),
    prisma.kudos.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { toUser: true },
      distinct: ["toUserId"],
    }),
    prisma.kudos.count({ where: { createdAt: { gte: start, lt: end } } }),
    getCurrentUser(),
  ]);
  const valueMap = Object.fromEntries(values.map((v) => [v.key, v]));
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-8">
      <FeedConfetti latestId={kudos[0]?.id} />

      {/* Hero */}
      <section className="rounded-card border border-borderx bg-card p-6 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink">
              {firstName ? `Welcome back, ${firstName} 👋` : "Celebrate great work 🎉"}
            </h1>
            <p className="mt-1 text-ink/60">
              {monthCount > 0
                ? `${monthCount} kudos and ${recognized.length} teammates recognized this month.`
                : "Recognition makes the moment — give the first kudos this month."}
            </p>
          </div>
          <a
            href={SLACK_KUDOS_LINK}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-pill bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white shadow-card transition hover:bg-[#a012c0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Give kudos in Slack — type <code className="font-body">/kudos</code>
          </a>
        </div>
      </section>

      {/* Recognized this month — inclusive, no ranking */}
      <section>
        <h2 className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-ink/50">
          Recognized this month
        </h2>
        {recognized.length === 0 ? (
          <p className="text-ink/40">Be the first to recognize someone 🎉</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recognized.map((k) => (
              <span
                key={k.toUserId}
                className="inline-flex items-center gap-2 rounded-pill border border-borderx bg-card py-1 pl-1 pr-3 shadow-card"
              >
                <Avatar name={k.toUser.name} avatarUrl={k.toUser.avatarUrl} size="sm" />
                <span className="text-sm font-medium text-ink/80">{k.toUser.name}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Feed */}
      <section className="space-y-4">
        {kudos.length === 0 ? (
          <div className="rounded-card border border-borderx bg-card p-8 text-center shadow-card">
            <p className="font-display text-lg font-semibold text-ink">
              Be the first to recognize someone 🎉
            </p>
            <p className="mt-1 text-ink/60">Head to Slack and type /kudos to get the party started.</p>
          </div>
        ) : (
          kudos.map((k, i) => {
            const v = valueMap[k.valueKey];
            return (
              <KudosCard
                key={k.id}
                index={i}
                fromName={k.fromUser.name}
                toName={k.toUser.name}
                toAvatarUrl={k.toUser.avatarUrl}
                valueEmoji={v?.emoji}
                valueLabel={v ? v.label : k.valueKey}
                message={k.message}
                boosts={k._count.boosts}
                points={k.points}
                timeAgo={timeAgo(k.createdAt)}
              />
            );
          })
        )}
      </section>
    </div>
  );
}
