import { prisma } from "../src/client.js";
import { REWARDS } from "./catalog.js";

const VALUES = [
  { key: "friend", label: "Great Friend", emoji: "🤝", description: "Went out of their way to support a teammate." },
  { key: "client_hero", label: "Client Hero", emoji: "🛟", description: "Expertly handled a difficult client." },
  { key: "crisis", label: "Crisis Crusher", emoji: "🚨", description: "Provided critical help during a crisis." },
  { key: "craft", label: "Craftsmanship", emoji: "🛠️", description: "Raised the bar on quality." },
  { key: "teamwork", label: "Teamwork", emoji: "🧩", description: "Made the whole team better." },
];

const USERS = ["Ada Lovelace", "Ben Carter", "Cy Nguyen", "Dana Ruiz", "Evan Park", "Farah Aziz"];

async function main() {
  await prisma.redemption.deleteMany();
  await prisma.boost.deleteMany();
  await prisma.kudos.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.value.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  const team = await prisma.team.create({ data: { name: "Engineering", slackChannelId: null } });
  for (const v of VALUES) await prisma.value.create({ data: v });
  for (const r of REWARDS) await prisma.reward.create({ data: r });
  for (const name of USERS) await prisma.user.create({ data: { name, teamId: team.id } });

  console.log(`Seeded team ${team.name}, ${VALUES.length} values, ${REWARDS.length} rewards, ${USERS.length} users.`);
}

main().finally(() => prisma.$disconnect());
