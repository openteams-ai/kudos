// Teal chip showing a point value or balance, e.g. "+10 pts".
export function PointsChip({
  points,
  showSign = false,
}: {
  points: number;
  showSign?: boolean;
}) {
  const sign = showSign && points > 0 ? "+" : "";
  return (
    <span className="inline-flex items-center rounded-pill bg-teal/12 px-2.5 py-1 text-xs font-display font-semibold text-teal-ink">
      {sign}
      {points} pts
    </span>
  );
}
