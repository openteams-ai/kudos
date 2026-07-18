// Demo-data generator — fills the DB with a believable team + ~4 weeks of
// realistic kudos, boosts, and point balances so the dashboard looks alive.
// Safe to re-run: it clears prior activity (kudos/boosts/redemptions) and
// regenerates, while preserving any real Slack-linked users.
//   npm run db:demo
import { prisma, giveKudos, addBoost, currentPeriod, redeemReward, fulfillRedemption } from "../src/index.js";
import { REWARDS as REWARD_DEFS } from "./catalog.js";

const VALUE_DEFS = [
  { key: "friend", label: "Great Friend", emoji: "🤝", description: "Went out of their way to support a teammate." },
  { key: "client_hero", label: "Client Hero", emoji: "🛟", description: "Expertly handled a difficult client." },
  { key: "crisis", label: "Crisis Crusher", emoji: "🚨", description: "Provided critical help during a crisis." },
  { key: "craft", label: "Craftsmanship", emoji: "🛠️", description: "Raised the bar on quality." },
  { key: "teamwork", label: "Teamwork", emoji: "🧩", description: "Made the whole team better." },
];

const CAST = [
  "Ada Lovelace", "Ben Carter", "Cy Nguyen", "Dana Ruiz", "Evan Park", "Farah Aziz",
  "Grace Hopper", "Hana Kim", "Ravi Patel", "Sofia Marino", "Liam O'Brien",
  "Mia Chen", "Noah Weber", "Priya Nair",
];

const MESSAGES: Record<string, string[]> = {
  friend: [
    "stayed late to help me untangle a gnarly merge conflict",
    "checked in on me during a rough week — it meant a lot",
    "covered my on-call so I could make it to my kid's recital",
    "brought me coffee and moral support before the big review",
  ],
  client_hero: [
    "calmed down a furious client and turned the whole call around",
    "wrote the clearest customer update I've ever read",
    "handled the escalation solo and saved the account",
    "spent an hour walking a confused customer through setup, no complaints",
  ],
  crisis: [
    "jumped on the 2am outage and had us back in twenty minutes",
    "kept a cool head during the prod incident and coordinated the fix",
    "caught the data bug before it ever reached customers",
    "rewrote the failing deploy script under pressure and unblocked the release",
  ],
  craft: [
    "refactored the auth module — it's finally readable",
    "wrote tests that caught three real bugs before release",
    "shipped a UI detail nobody asked for but everyone loves",
    "left the codebase noticeably cleaner than they found it",
  ],
  teamwork: [
    "unblocked three different people in a single standup",
    "paired with the new hire all afternoon to get them ramped",
    "volunteered for the boring migration so the rest of us could focus",
    "quietly kept the whole sprint on track",
  ],
};

const rand = () => Math.random();
const pick = <T>(a: T[]): T => a[Math.floor(rand() * a.length)];
const shuffle = <T>(a: T[]): T[] => a.slice().sort(() => rand() - 0.5);

async function main() {
  const DAYS = 28;
  const DAY_MS = 24 * 60 * 60 * 1000;

  // 1) Clear prior activity; reset balances. Structure (values/rewards) preserved.
  await prisma.redemption.deleteMany();
  await prisma.boost.deleteMany();
  await prisma.kudos.deleteMany();
  await prisma.user.updateMany({ data: { redeemableBalance: 0 } });

  // 2) Ensure a team.
  let team = await prisma.team.findFirst();
  if (!team) team = await prisma.team.create({ data: { name: "Engineering" } });

  // 3) Ensure values + rewards exist. Rewards are fully resynced to the shared
  //    catalog (redemptions were cleared in step 1, so this is FK-safe) — that
  //    keeps a re-run's store in step with catalog.ts as the catalog evolves.
  for (const v of VALUE_DEFS) await prisma.value.upsert({ where: { key: v.key }, update: {}, create: v });
  await prisma.reward.deleteMany();
  for (const r of REWARD_DEFS) await prisma.reward.create({ data: r });

  // 4) Ensure the demo cast (create missing by name; preserves real Slack-linked users).
  for (const name of CAST) {
    const exists = await prisma.user.findFirst({ where: { name } });
    if (!exists) await prisma.user.create({ data: { name, teamId: team.id } });
  }
  const users = await prisma.user.findMany();
  const valueKeys = VALUE_DEFS.map((v) => v.key);

  // 5) Generate kudos across the last 28 days (giveKudos enforces the monthly
  //    allowance and credits the receiver's redeemable balance).
  const kudos: { id: string; toUserId: string }[] = [];
  for (let d = DAYS - 1; d >= 0; d--) {
    const perDay = 2 + Math.floor(rand() * 4); // 2–5 kudos/day
    for (let k = 0; k < perDay; k++) {
      const from = pick(users);
      const to = pick(users);
      if (to.id === from.id) continue;
      const valueKey = pick(valueKeys);
      const message = pick(MESSAGES[valueKey]);
      const when = new Date(Date.now() - d * DAY_MS + Math.floor(rand() * DAY_MS));
      try {
        const res = await giveKudos({ fromUserId: from.id, toUserId: to.id, valueKey, message, now: when });
        kudos.push({ id: res.id, toUserId: to.id });
      } catch {
        /* monthly allowance exhausted for this giver — skip */
      }
    }
  }

  // 5b) Current-month burst so the "Recognized this month" strip is lively
  //     (otherwise sparse right after a month rollover). Spreads across many
  //     distinct receivers, dated within the current calendar month up to now.
  const { start: monthStart } = currentPeriod();
  const nowMs = Date.now();
  const monthSpan = Math.max(1, nowMs - monthStart.getTime());
  const receivers = shuffle(users);
  for (let i = 0; i < Math.min(18, users.length * 3); i++) {
    const to = receivers[i % receivers.length];
    const from = pick(users.filter((u) => u.id !== to.id));
    const valueKey = pick(valueKeys);
    const message = pick(MESSAGES[valueKey]);
    const when = new Date(monthStart.getTime() + Math.floor(rand() * monthSpan));
    try {
      const res = await giveKudos({ fromUserId: from.id, toUserId: to.id, valueKey, message, now: when });
      kudos.push({ id: res.id, toUserId: to.id });
    } catch {
      /* allowance exhausted — skip */
    }
  }

  // 6) Boosts on ~45% of kudos (never the receiver boosting their own).
  let boosts = 0;
  for (const k of kudos) {
    if (rand() > 0.45) continue;
    const candidates = shuffle(users.filter((u) => u.id !== k.toUserId)).slice(0, 1 + Math.floor(rand() * 3));
    for (const b of candidates) {
      try {
        const r = await addBoost({ kudosId: k.id, fromUserId: b.id });
        if (r.added) boosts++;
      } catch {
        /* ignore */
      }
    }
  }

  // 7) Guarantee a flattering spread for the rewards store, regardless of how
  //    the random kudos landed: one teammate comfortably into the mid-tier and
  //    one a hair short of the aspirational Extra Day Off (500 pts).
  const setBalance = async (name: string, redeemableBalance: number) => {
    const u = await prisma.user.findFirst({ where: { name } });
    if (u) await prisma.user.update({ where: { id: u.id }, data: { redeemableBalance } });
  };
  await setBalance("Ada Lovelace", 500); // lands on 320 after her redemptions below — affords Team Lunch, Premium Parking, a Hoodie…
  await setBalance("Ben Carter", 480); //  so close to the Extra Day Off — just save a bit more
  await setBalance("Grace Hopper", 200);
  await setBalance("Mia Chen", 250);

  // 7b) A few redemptions with mixed statuses so the admin queue and reward
  //     history look lived-in. They go through redeemReward, so costs come out
  //     of the balances set above and the numbers add up (Ada: 500 − 180 = 320).
  //     Ben Carter deliberately redeems nothing — he's the save-up story.
  const redeem = async (
    userName: string,
    rewardName: string,
    opts: { fulfilled?: boolean; daysAgo?: number } = {},
  ) => {
    const u = await prisma.user.findFirst({ where: { name: userName } });
    const r = await prisma.reward.findFirst({ where: { name: rewardName } });
    if (!u || !r) return;
    try {
      const { redemptionId } = await redeemReward({ userId: u.id, rewardId: r.id });
      if (opts.daysAgo)
        await prisma.redemption.update({
          where: { id: redemptionId },
          data: { createdAt: new Date(Date.now() - opts.daysAgo * DAY_MS) },
        });
      if (opts.fulfilled) await fulfillRedemption(redemptionId);
    } catch {
      /* insufficient balance — skip rather than fail the seed */
    }
  };
  await redeem("Ada Lovelace", "Coffee House $25", { fulfilled: true, daysAgo: 6 });
  await redeem("Mia Chen", "Enamel Pin Set", { fulfilled: true, daysAgo: 4 });
  await redeem("Grace Hopper", "Donut & Coffee $10", { daysAgo: 2 });
  await redeem("Ada Lovelace", "Sticker Pack", { daysAgo: 1 });

  // 8) Ada doubles as the demo admin so /admin is showable (sign in as her, or
  //    set DEV_PREVIEW_USER="Ada Lovelace"). Ben stays non-admin on purpose.
  const ada = await prisma.user.findFirst({ where: { name: "Ada Lovelace" } });
  if (ada) await prisma.user.update({ where: { id: ada.id }, data: { isAdmin: true } });

  const { start } = currentPeriod();
  const thisMonth = await prisma.kudos.count({ where: { createdAt: { gte: start } } });
  const topBalance = await prisma.user.findFirst({ orderBy: { redeemableBalance: "desc" } });
  const redemptions = await prisma.redemption.count();
  const pending = await prisma.redemption.count({ where: { status: "requested" } });
  console.log(
    `Demo data ready: ${users.length} users, ${kudos.length} kudos (${thisMonth} this month), ${boosts} boosts, ` +
      `${redemptions} redemptions (${pending} pending). ` +
      `Top redeemable balance: ${topBalance?.name} @ ${topBalance?.redeemableBalance} pts. ` +
      `Admin: Ada Lovelace (/admin).`
  );
}

main().finally(() => prisma.$disconnect());
