import { CATEGORY_ORDER, tileClass } from "../../lib/reward-categories";
import { Button } from "../../components/ui/Button";
import { updateRewardAction, createRewardAction, deleteRewardAction } from "./actions";

export type CatalogReward = {
  id: string;
  name: string;
  cost: number;
  category: string;
  emoji: string | null;
  description: string | null;
};

const inputClass =
  "rounded-[10px] border border-borderx bg-card px-3 py-1.5 text-sm text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-card";

const labelClass = "text-xs font-semibold uppercase tracking-wide text-ink/60";

const smallButtonClass = "px-3 py-1 text-xs";

// One catalog row: the always-visible cost form (the headline "reprice"
// use-case), a <details> expansion for the remaining fields, and delete.
// Multiple sibling forms per row — forms must not nest.
function RewardRow({ reward, redemptionCount }: { reward: CatalogReward; redemptionCount: number }) {
  return (
    <li className="border-b border-borderx px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] " +
            tileClass(reward.category)
          }
        >
          <span aria-hidden="true" className="text-xl">
            {reward.emoji ?? "🎁"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold text-ink">{reward.name}</p>
          <p className="truncate text-xs text-ink/60">
            {redemptionCount > 0
              ? `Redeemed ${redemptionCount} ${redemptionCount === 1 ? "time" : "times"}`
              : "Never redeemed"}
          </p>
        </div>

        <form action={updateRewardAction} className="flex items-center gap-2">
          <input type="hidden" name="rewardId" value={reward.id} />
          <label htmlFor={`cost-${reward.id}`} className="sr-only">
            Cost of {reward.name} in points
          </label>
          <input
            id={`cost-${reward.id}`}
            name="cost"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            defaultValue={reward.cost}
            className={`${inputClass} w-24`}
          />
          <span className="text-xs text-ink/60" aria-hidden="true">
            pts
          </span>
          <Button variant="subtle" className={smallButtonClass}>
            Save
            <span className="sr-only"> new cost for {reward.name}</span>
          </Button>
        </form>

        {redemptionCount > 0 ? (
          <span className="inline-flex flex-col items-center">
            <Button variant="subtle" className={smallButtonClass} disabled>
              Delete
            </Button>
            <span className="mt-0.5 text-[11px] text-ink/60">has redemption history</span>
          </span>
        ) : (
          <form action={deleteRewardAction}>
            <input type="hidden" name="rewardId" value={reward.id} />
            <Button variant="subtle" className={smallButtonClass}>
              Delete
              <span className="sr-only"> {reward.name}</span>
            </Button>
          </form>
        )}
      </div>

      <details className="mt-2">
        <summary className="inline-flex cursor-pointer items-center rounded-pill px-1 text-xs font-display font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card">
          Edit details
          <span className="sr-only"> of {reward.name}</span>
        </summary>
        <form
          action={updateRewardAction}
          className="mt-3 grid gap-3 rounded-[12px] border border-borderx bg-canvas/60 p-4 sm:grid-cols-2"
        >
          <input type="hidden" name="rewardId" value={reward.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor={`name-${reward.id}`} className={labelClass}>
              Name
            </label>
            <input
              id={`name-${reward.id}`}
              name="name"
              required
              defaultValue={reward.name}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`emoji-${reward.id}`} className={labelClass}>
              Emoji
            </label>
            <input
              id={`emoji-${reward.id}`}
              name="emoji"
              defaultValue={reward.emoji ?? ""}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor={`description-${reward.id}`} className={labelClass}>
              Description
            </label>
            <input
              id={`description-${reward.id}`}
              name="description"
              defaultValue={reward.description ?? ""}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`category-${reward.id}`} className={labelClass}>
              Category
            </label>
            <input
              id={`category-${reward.id}`}
              name="category"
              required
              defaultValue={reward.category}
              list="reward-categories"
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <Button variant="subtle" className={smallButtonClass}>
              Save details
              <span className="sr-only"> of {reward.name}</span>
            </Button>
          </div>
        </form>
      </details>
    </li>
  );
}

export function Catalog({
  rewards,
  redemptionCounts,
}: {
  rewards: CatalogReward[];
  redemptionCounts: Map<string, number>;
}) {
  // Known categories first in store order, then anything custom, alphabetized.
  const present = Array.from(new Set(rewards.map((r) => r.category)));
  const categories = [
    ...CATEGORY_ORDER.filter((c) => present.includes(c)),
    ...present.filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)).sort(),
  ];

  return (
    <section aria-labelledby="admin-catalog-heading" className="space-y-4">
      <div>
        <h2 id="admin-catalog-heading" className="font-display text-lg font-bold text-ink">
          Reward catalog
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          Reprice, edit, or retire rewards — the store updates immediately.
        </p>
      </div>

      {/* Shared category suggestions for the edit + add forms. */}
      <datalist id="reward-categories">
        {present.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {categories.map((category) => (
        <div key={category}>
          <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink/70">
            {category}
          </h3>
          <ul className="rounded-card border border-borderx bg-card shadow-card">
            {rewards
              .filter((r) => r.category === category)
              .map((r) => (
                <RewardRow key={r.id} reward={r} redemptionCount={redemptionCounts.get(r.id) ?? 0} />
              ))}
          </ul>
        </div>
      ))}

      <div className="rounded-card border border-borderx bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink/70">
          Add a reward
        </h3>
        <form action={createRewardAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="new-name" className={labelClass}>
              Name
            </label>
            <input id="new-name" name="name" required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="new-cost" className={labelClass}>
              Cost (points)
            </label>
            <input
              id="new-cost"
              name="cost"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="new-emoji" className={labelClass}>
              Emoji (optional)
            </label>
            <input id="new-emoji" name="emoji" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="new-category" className={labelClass}>
              Category
            </label>
            <input
              id="new-category"
              name="category"
              required
              list="reward-categories"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="new-description" className={labelClass}>
              Description (optional)
            </label>
            <input id="new-description" name="description" className={inputClass} />
          </div>
          <div>
            <Button variant="primary" className="px-4 py-1.5 text-sm">
              Add reward
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
