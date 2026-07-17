import { Avatar } from "./Avatar";
import { ValueBadge } from "./ValueBadge";
import { PointsChip } from "./PointsChip";
import { BoostPill } from "./BoostPill";

export type KudosCardProps = {
  fromName: string;
  toName: string;
  toAvatarUrl?: string | null;
  valueEmoji?: string;
  valueLabel: string;
  message: string;
  boosts: number;
  points: number;
  timeAgo: string;
  /** Stagger index for the entrance animation. */
  index?: number;
};

export function KudosCard({
  fromName,
  toName,
  toAvatarUrl,
  valueEmoji,
  valueLabel,
  message,
  boosts,
  points,
  timeAgo,
  index = 0,
}: KudosCardProps) {
  return (
    <article
      className="animate-rise rounded-card border border-borderx bg-card p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-cardHover"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <Avatar name={toName} avatarUrl={toAvatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-ink/70">
              <span className="font-display font-semibold text-ink">{fromName}</span> recognized{" "}
              <span className="font-display font-semibold text-ink">{toName}</span>
            </p>
            <span className="shrink-0 whitespace-nowrap text-xs text-ink/40">{timeAgo}</span>
          </div>
          <div className="mt-2">
            <ValueBadge emoji={valueEmoji} label={valueLabel} />
          </div>
          <p className="mt-3 text-ink">{message}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <BoostPill count={boosts} />
            <PointsChip points={points} showSign />
          </div>
        </div>
      </div>
    </article>
  );
}
