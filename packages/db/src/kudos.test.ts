import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "./client.js";
import { giveKudos, addBoost, POINTS_PER_KUDOS, BOOST_POINTS } from "./kudos.js";

async function reset() {
  await prisma.boost.deleteMany();
  await prisma.kudos.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
}
async function trio() {
  const team = await prisma.team.create({ data: { name: "Eng" } });
  const a = await prisma.user.create({ data: { name: "Ada", teamId: team.id } });
  const b = await prisma.user.create({ data: { name: "Ben", teamId: team.id } });
  const c = await prisma.user.create({ data: { name: "Cy", teamId: team.id } });
  return { team, a, b, c };
}

describe("giveKudos", () => {
  beforeEach(reset);

  it("creates a kudos and credits the receiver's redeemable balance", async () => {
    const { a, b } = await trio();
    await giveKudos({ fromUserId: a.id, toUserId: b.id, valueKey: "friend", message: "clutch help" });
    const kudos = await prisma.kudos.findFirst();
    expect(kudos?.points).toBe(POINTS_PER_KUDOS);
    const receiver = await prisma.user.findUnique({ where: { id: b.id } });
    expect(receiver?.redeemableBalance).toBe(POINTS_PER_KUDOS);
  });

  it("rejects self-recognition", async () => {
    const { a } = await trio();
    await expect(giveKudos({ fromUserId: a.id, toUserId: a.id, valueKey: "friend", message: "me" }))
      .rejects.toThrow("cannot recognize yourself");
  });

  it("rejects empty message", async () => {
    const { a, b } = await trio();
    await expect(giveKudos({ fromUserId: a.id, toUserId: b.id, valueKey: "friend", message: "   " }))
      .rejects.toThrow("message is required");
  });

  it("rejects when allowance is exhausted", async () => {
    const { a, b, c } = await trio();
    // spend the full 100 allowance: 10 kudos of 10 pts
    for (let i = 0; i < 10; i++) {
      await giveKudos({ fromUserId: a.id, toUserId: (i % 2 ? b.id : c.id), valueKey: "friend", message: `n${i}` });
    }
    await expect(giveKudos({ fromUserId: a.id, toUserId: b.id, valueKey: "friend", message: "one too many" }))
      .rejects.toThrow("not enough allowance");
  });
});

describe("addBoost", () => {
  beforeEach(reset);
  afterEach(() => vi.restoreAllMocks());

  it("adds boost points once and is idempotent per user", async () => {
    const { a, b, c } = await trio();
    await giveKudos({ fromUserId: a.id, toUserId: b.id, valueKey: "friend", message: "nice" });
    const kudos = await prisma.kudos.findFirstOrThrow();

    const first = await addBoost({ kudosId: kudos.id, fromUserId: c.id });
    expect(first.added).toBe(true);
    const second = await addBoost({ kudosId: kudos.id, fromUserId: c.id });
    expect(second.added).toBe(false);

    const receiver = await prisma.user.findUnique({ where: { id: b.id } });
    expect(receiver?.redeemableBalance).toBe(POINTS_PER_KUDOS + BOOST_POINTS);
  });

  it("treats a unique-constraint conflict on create as a duplicate (returns added:false, no double-credit)", async () => {
    const { a, b, c } = await trio();
    await giveKudos({ fromUserId: a.id, toUserId: b.id, valueKey: "friend", message: "nice" });
    const kudos = await prisma.kudos.findFirstOrThrow();

    // Simulate the row already existing (as if a concurrent request beat us to it),
    // bypassing addBoost's own findUnique pre-check.
    await prisma.boost.create({ data: { kudosId: kudos.id, fromUserId: c.id, points: BOOST_POINTS } });

    const before = await prisma.user.findUniqueOrThrow({ where: { id: b.id } });

    await expect(addBoost({ kudosId: kudos.id, fromUserId: c.id })).resolves.toEqual({ added: false });

    const after = await prisma.user.findUniqueOrThrow({ where: { id: b.id } });
    expect(after.redeemableBalance).toBe(before.redeemableBalance);
  });

  it("swallows a P2002 raised inside the transaction (fast-path skipped, catch branch exercised)", async () => {
    const { a, b, c } = await trio();
    await giveKudos({ fromUserId: a.id, toUserId: b.id, valueKey: "friend", message: "nice" });
    const kudos = await prisma.kudos.findFirstOrThrow();

    // No pre-existing Boost row for c, so addBoost's findUnique fast-path returns null
    // and execution reaches the try/catch around prisma.$transaction.
    const before = await prisma.user.findUniqueOrThrow({ where: { id: b.id } });

    const spy = vi.spyOn(prisma, "$transaction").mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.20.0",
      })
    );

    const res = await addBoost({ kudosId: kudos.id, fromUserId: c.id });
    expect(res.added).toBe(false);

    const after = await prisma.user.findUniqueOrThrow({ where: { id: b.id } });
    expect(after.redeemableBalance).toBe(before.redeemableBalance);

    spy.mockRestore();
  });
});
