import { prisma, currentPeriod } from "@kudos/db";
import { timeAgo } from "../lib/format.js";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const { start, end } = currentPeriod();
  const [kudos, values, recognized] = await Promise.all([
    prisma.kudos.findMany({
      orderBy: { createdAt: "desc" }, take: 30,
      include: { fromUser: true, toUser: true, _count: { select: { boosts: true } } },
    }),
    prisma.value.findMany(),
    prisma.kudos.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { toUser: true }, distinct: ["toUserId"],
    }),
  ]);
  const valueMap = Object.fromEntries(values.map((v) => [v.key, v]));

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Recognized this month</h2>
        <div className="flex flex-wrap gap-2">
          {recognized.map((k) => (
            <span key={k.toUserId} className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800">
              {k.toUser.name}
            </span>
          ))}
          {recognized.length === 0 && <span className="text-slate-400">No kudos yet — be the first!</span>}
        </div>
      </section>

      <section className="space-y-3">
        {kudos.map((k) => {
          const v = valueMap[k.valueKey];
          return (
            <article key={k.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  <span className="font-semibold">{k.fromUser.name}</span> recognized{" "}
                  <span className="font-semibold">{k.toUser.name}</span>
                </p>
                <span className="text-xs text-slate-400">{timeAgo(k.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{v ? `${v.emoji} ${v.label}` : k.valueKey}</p>
              <p className="mt-2">{k.message}</p>
              <p className="mt-2 text-xs text-slate-400">🎉 {k._count.boosts} boosts · +{k.points} pts</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
