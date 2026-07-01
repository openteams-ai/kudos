import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "./client.js";
import { MONTHLY_ALLOWANCE, pointsGivenThisPeriod, remainingAllowance } from "./points.js";

async function reset() {
  await prisma.boost.deleteMany();
  await prisma.kudos.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
}

async function seedUserPair() {
  const team = await prisma.team.create({ data: { name: "Eng" } });
  const giver = await prisma.user.create({ data: { name: "Giver", teamId: team.id } });
  const receiver = await prisma.user.create({ data: { name: "Receiver", teamId: team.id } });
  return { team, giver, receiver };
}

describe("allowance (computed-on-read)", () => {
  beforeEach(reset);

  it("starts with the full monthly allowance", async () => {
    const { giver } = await seedUserPair();
    expect(await remainingAllowance(giver.id)).toBe(MONTHLY_ALLOWANCE);
    expect(await pointsGivenThisPeriod(giver.id)).toBe(0);
  });

  it("counts only kudos given in the current period", async () => {
    const { team, giver, receiver } = await seedUserPair();
    await prisma.kudos.create({ data: {
      fromUserId: giver.id, toUserId: receiver.id, teamId: team.id,
      valueKey: "friend", message: "thanks", points: 10,
      createdAt: new Date("2026-06-10T00:00:00Z"),
    }});
    await prisma.kudos.create({ data: {
      fromUserId: giver.id, toUserId: receiver.id, teamId: team.id,
      valueKey: "friend", message: "last month", points: 30,
      createdAt: new Date("2026-05-10T00:00:00Z"),
    }});
    const now = new Date("2026-06-15T00:00:00Z");
    expect(await pointsGivenThisPeriod(giver.id, now)).toBe(10);
    expect(await remainingAllowance(giver.id, now)).toBe(MONTHLY_ALLOWANCE - 10);
  });

  it("never returns a negative allowance", async () => {
    const { team, giver, receiver } = await seedUserPair();
    await prisma.kudos.create({ data: {
      fromUserId: giver.id, toUserId: receiver.id, teamId: team.id,
      valueKey: "friend", message: "big", points: 999,
      createdAt: new Date("2026-06-10T00:00:00Z"),
    }});
    expect(await remainingAllowance(giver.id, new Date("2026-06-15T00:00:00Z"))).toBe(0);
  });
});
