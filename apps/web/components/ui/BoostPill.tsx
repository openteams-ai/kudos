// Gold pill counting the boosts (celebratory reactions) on a kudos.
export function BoostPill({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-gold/15 px-2.5 py-1 text-xs font-display font-semibold text-[#9a6b12]">
      <span aria-hidden="true">🎉</span>
      {count} {count === 1 ? "boost" : "boosts"}
    </span>
  );
}
