"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Confetti } from "../../components/ui/Confetti";
import { PointsChip } from "../../components/ui/PointsChip";
import { CATEGORY_ORDER, CATEGORY_STYLES, tileClass } from "../../lib/reward-categories";

export type StoreReward = {
  id: string;
  name: string;
  cost: number;
  category: string;
  description: string | null;
  emoji: string | null;
};

const FEATURED_NAMES = ["Extra Day Off", "Cozy Hoodie", "Donate $10 to Charity", "Coffee House $25"];

type Filter = "All" | (typeof CATEGORY_ORDER)[number];
const FILTERS: Filter[] = ["All", ...CATEGORY_ORDER];

export function RewardsStore({
  rewards,
  startingBalance,
}: {
  rewards: StoreReward[];
  startingBalance: number;
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(startingBalance);
  const [filter, setFilter] = useState<Filter>("All");
  const [dialog, setDialog] = useState<StoreReward | null>(null);
  const [redeemedIds, setRedeemedIds] = useState<Set<string>>(new Set());
  const [confettiN, setConfettiN] = useState(0);
  // The most recently redeemed reward gets keyboard focus once its card
  // re-renders into the "Requested" state, so focus is never lost to <body>.
  const [focusId, setFocusId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  function handleRedeemed(reward: StoreReward) {
    const newBalance = balance - reward.cost;
    setBalance(newBalance);
    setRedeemedIds((prev) => new Set(prev).add(reward.id));
    setConfettiN((n) => n + 1);
    setFocusId(reward.id);
    setAnnouncement(`Requested! ${reward.name}. New balance ${newBalance} pts.`);
    setDialog(null);
    // Reconcile with server truth (balance lives on the User row).
    router.refresh();
  }

  const featured = FEATURED_NAMES.map((n) => rewards.find((r) => r.name === n)).filter(
    (r): r is StoreReward => Boolean(r),
  );

  // The save-up spotlight: the unaffordable reward the user is closest to earning.
  const spotlight = rewards
    .filter((r) => r.cost > balance)
    .sort((a, b) => a.cost - b.cost)[0];

  const visible = filter === "All" ? rewards : rewards.filter((r) => r.category === filter);
  const note = filter !== "All" ? CATEGORY_STYLES[filter]?.note : undefined;

  return (
    <div className="space-y-8">
      {confettiN > 0 && <Confetti key={confettiN} fire />}

      {/* Polite live region: announces the redeem outcome and the new balance,
          which is otherwise conveyed only through confetti (aria-hidden). */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {spotlight && <SaveUpSpotlight reward={spotlight} balance={balance} />}

      {filter === "All" && featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="space-y-3">
          <h2 id="featured-heading" className="font-display text-lg font-bold text-ink">
            Crowd favorites
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {featured.map((r) => (
              <FeaturedCard
                key={r.id}
                reward={r}
                balance={balance}
                redeemed={redeemedIds.has(r.id)}
                focus={focusId === r.id}
                onFocused={() => setFocusId(null)}
                onRedeem={() => setDialog(r)}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="catalog-heading" className="space-y-4">
        <h2 id="catalog-heading" className="sr-only">
          Rewards catalog
        </h2>
        <div role="group" aria-label="Filter rewards by category" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className={
                  "rounded-pill px-4 py-1.5 text-sm font-display font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
                  (active
                    ? "bg-primary text-white shadow-card"
                    : "border border-borderx bg-card text-ink/70 hover:border-primary hover:text-primary")
                }
              >
                {f}
              </button>
            );
          })}
        </div>

        {note && (
          <p className="flex items-center gap-2 rounded-card bg-[#F43F5E]/8 px-4 py-3 text-sm text-ink/70">
            <span aria-hidden="true">💝</span>
            {note}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((r) => (
            <RewardCard
              key={r.id}
              reward={r}
              balance={balance}
              redeemed={redeemedIds.has(r.id)}
              focus={focusId === r.id}
              onFocused={() => setFocusId(null)}
              onRedeem={() => setDialog(r)}
            />
          ))}
        </div>
      </section>

      <ConfirmDialog
        reward={dialog}
        balance={balance}
        onClose={() => setDialog(null)}
        onRedeemed={handleRedeemed}
      />
    </div>
  );
}

function Emoji({ value, className }: { value: string | null; className?: string }) {
  return (
    <span aria-hidden="true" className={className}>
      {value ?? "🎁"}
    </span>
  );
}

/**
 * The "Requested" state that replaces a Redeem button after a successful
 * redeem. Focusable (tabIndex -1) and labeled so the dialog's closing
 * focus-restore lands here instead of falling to <body>. Only the first card
 * for a given reward (featured renders before the grid) claims focus.
 */
function RequestedTag({
  name,
  focus,
  onFocused,
}: {
  name: string;
  focus: boolean;
  onFocused: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (focus) {
      ref.current?.focus();
      onFocused();
    }
  }, [focus, onFocused]);
  return (
    <span
      ref={ref}
      tabIndex={-1}
      aria-label={`Requested: ${name}`}
      className="rounded text-sm font-display font-semibold text-teal-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      Requested ✓
    </span>
  );
}

function MorePtsHint({ gap }: { gap: number }) {
  return (
    <span className="rounded-pill bg-borderx px-3 py-1.5 text-xs font-display font-semibold text-ink/70">
      {gap} more pts
    </span>
  );
}

function RewardCard({
  reward,
  balance,
  redeemed,
  focus,
  onFocused,
  onRedeem,
}: {
  reward: StoreReward;
  balance: number;
  redeemed: boolean;
  focus: boolean;
  onFocused: () => void;
  onRedeem: () => void;
}) {
  const affordable = balance >= reward.cost;
  const gap = reward.cost - balance;

  return (
    <div className="flex flex-col rounded-card border border-borderx bg-card p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-cardHover">
      <div
        className={
          "flex h-24 items-center justify-center rounded-card " +
          tileClass(reward.category) +
          (affordable ? "" : " opacity-60")
        }
      >
        <Emoji value={reward.emoji} className="text-5xl" />
      </div>
      <p className="mt-3 font-display font-semibold text-ink">{reward.name}</p>
      {reward.description && (
        <p className="mt-1 line-clamp-2 text-sm text-ink/60">{reward.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-3 pt-1">
        <PointsChip points={reward.cost} />
        {redeemed ? (
          <RequestedTag name={reward.name} focus={focus} onFocused={onFocused} />
        ) : affordable ? (
          <button
            onClick={onRedeem}
            aria-label={`Redeem ${reward.name}`}
            className="rounded-pill bg-primary px-4 py-1.5 text-sm font-display font-semibold text-white shadow-card transition hover:bg-[#a012c0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Redeem
          </button>
        ) : (
          <MorePtsHint gap={gap} />
        )}
      </div>
    </div>
  );
}

function FeaturedCard({
  reward,
  balance,
  redeemed,
  focus,
  onFocused,
  onRedeem,
}: {
  reward: StoreReward;
  balance: number;
  redeemed: boolean;
  focus: boolean;
  onFocused: () => void;
  onRedeem: () => void;
}) {
  const affordable = balance >= reward.cost;
  const gap = reward.cost - balance;

  return (
    <div className="flex gap-4 rounded-card border border-borderx bg-card p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-cardHover">
      <div
        className={
          "flex h-20 w-20 shrink-0 items-center justify-center rounded-card " +
          tileClass(reward.category) +
          (affordable ? "" : " opacity-60")
        }
      >
        <Emoji value={reward.emoji} className="text-4xl" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="inline-flex w-fit items-center gap-1 rounded-pill bg-gold/20 px-2 py-0.5 text-[11px] font-display font-semibold text-[#7A5F16]">
          ★ Crowd favorite
        </span>
        <p className="mt-1 truncate font-display font-semibold text-ink">{reward.name}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <PointsChip points={reward.cost} />
          {redeemed ? (
            <RequestedTag name={reward.name} focus={focus} onFocused={onFocused} />
          ) : affordable ? (
            <button
              onClick={onRedeem}
              aria-label={`Redeem ${reward.name}`}
              className="rounded-pill bg-primary px-4 py-1.5 text-sm font-display font-semibold text-white shadow-card transition hover:bg-[#a012c0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Redeem
            </button>
          ) : (
            <MorePtsHint gap={gap} />
          )}
        </div>
      </div>
    </div>
  );
}

function SaveUpSpotlight({ reward, balance }: { reward: StoreReward; balance: number }) {
  const pct = Math.min(100, Math.round((balance / reward.cost) * 100));
  const gap = reward.cost - balance;
  const almost = gap <= 40;

  return (
    <section
      aria-label={`Saving toward ${reward.name}`}
      className="rounded-card border border-borderx bg-card p-5 shadow-card"
    >
      <div className="flex items-center gap-4">
        <div
          className={"flex h-14 w-14 shrink-0 items-center justify-center rounded-card " + tileClass(reward.category)}
        >
          <Emoji value={reward.emoji} className="text-3xl" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/60">
            {almost ? "Almost there" : "Saving toward"}
          </p>
          <p className="font-display font-bold text-ink">{reward.name}</p>
        </div>
        <p className="shrink-0 font-display text-sm font-semibold text-ink/70">
          {balance} / {reward.cost}
        </p>
      </div>
      <div className="mt-3">
        <div
          className="h-2.5 w-full overflow-hidden rounded-pill bg-borderx"
          role="progressbar"
          aria-valuenow={balance}
          aria-valuemin={0}
          aria-valuemax={reward.cost}
          aria-label={`${balance} of ${reward.cost} points`}
        >
          <div className="h-full rounded-pill bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm text-ink/60">
          {almost
            ? `Just ${gap} more ${gap === 1 ? "point" : "points"} — you're so close!`
            : `${gap} points to go. Every kudos gets you closer.`}
        </p>
      </div>
    </section>
  );
}

function ConfirmDialog({
  reward,
  balance,
  onClose,
  onRedeemed,
}: {
  reward: StoreReward | null;
  balance: number;
  onClose: () => void;
  onRedeemed: (reward: StoreReward) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reward && !el.open) {
      setError(null);
      el.showModal();
      // showModal makes the background inert but does not stop it scrolling.
      document.body.style.overflow = "hidden";
    } else if (!reward && el.open) {
      el.close();
    }
  }, [reward]);

  // Failsafe: never leave the body scroll-locked if this unmounts while open.
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function confirm() {
    if (!reward) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      // Non-JSON 500s would otherwise throw and swallow the failure silently.
      const data = await res.json().catch(() => ({}) as { ok?: boolean; error?: string });
      if (res.ok && data.ok) {
        onRedeemed(reward);
        return;
      }
      setError(
        res.status === 409
          ? "You don't have quite enough points for this yet."
          : res.status === 401
            ? "Your session expired — please sign in again."
            : "Something went wrong redeeming this. Please try again.",
      );
    } catch {
      setError("Something went wrong redeeming this. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const balanceAfter = reward ? balance - reward.cost : 0;

  return (
    <dialog
      ref={ref}
      aria-labelledby="redeem-dialog-title"
      onClose={() => {
        document.body.style.overflow = "";
        onClose();
      }}
      onClick={(e) => {
        // Backdrop click (target is the dialog element itself) dismisses.
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(92vw,26rem)] rounded-card border border-borderx bg-card p-0 text-ink shadow-cardHover backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      {reward && (
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className={"flex h-20 w-20 items-center justify-center rounded-card " + tileClass(reward.category)}>
              <Emoji value={reward.emoji} className="text-5xl" />
            </div>
            <h2 id="redeem-dialog-title" className="mt-3 font-display text-lg font-bold text-ink">
              Redeem {reward.name}?
            </h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-ink/70">
              <PointsChip points={reward.cost} />
              <span aria-hidden="true">·</span>
              <span>
                Balance after: <span className="font-semibold text-ink">{balanceAfter} pts</span>
              </span>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-card bg-[#F43F5E]/10 px-4 py-2 text-center text-sm text-[#b21e3b]">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              onClick={onClose}
              disabled={pending}
              className="flex-1 rounded-pill border border-borderx bg-card px-4 py-2 text-sm font-display font-semibold text-ink/70 transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50"
            >
              Not yet
            </button>
            <button
              onClick={confirm}
              disabled={pending}
              className="flex-1 rounded-pill bg-primary px-4 py-2 text-sm font-display font-semibold text-white shadow-card transition hover:bg-[#a012c0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Redeeming…" : "Confirm & redeem"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
