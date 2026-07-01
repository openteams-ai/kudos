import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "./client.js";
import { linkSlackUser } from "./users.js";

async function reset() {
  await prisma.boost.deleteMany();
  await prisma.kudos.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
}

describe("linkSlackUser", () => {
  beforeEach(async () => {
    await reset();
    await prisma.team.create({ data: { name: "Engineering" } });
  });

  it("links an existing unlinked user with the same name", async () => {
    const seeded = await prisma.user.create({
      data: { name: "Ada Lovelace", teamId: (await prisma.team.findFirstOrThrow()).id },
    });
    const { id } = await linkSlackUser({ slackUserId: "U123", name: "Ada Lovelace", email: "ada@x.com" });
    expect(id).toBe(seeded.id);
    const after = await prisma.user.findUnique({ where: { id } });
    expect(after?.slackUserId).toBe("U123");
    expect(after?.email).toBe("ada@x.com");
  });

  it("returns and enriches an already-linked user (idempotent)", async () => {
    const first = await linkSlackUser({ slackUserId: "U999", name: "New Person" });
    const second = await linkSlackUser({ slackUserId: "U999", name: "New Person", avatarUrl: "http://img/a.png" });
    expect(second.id).toBe(first.id);
    const after = await prisma.user.findUnique({ where: { id: first.id } });
    expect(after?.avatarUrl).toBe("http://img/a.png");
    expect(await prisma.user.count()).toBe(1);
  });

  it("creates a new user when there is no match", async () => {
    const before = await prisma.user.count();
    const { id } = await linkSlackUser({ slackUserId: "U555", name: "Stranger" });
    expect(await prisma.user.count()).toBe(before + 1);
    const created = await prisma.user.findUnique({ where: { id } });
    expect(created?.slackUserId).toBe("U555");
  });

  it("preserves existing email/avatar when a later call omits them", async () => {
    const first = await linkSlackUser({
      slackUserId: "U777", name: "Grace Hopper", email: "grace@x.com", avatarUrl: "http://img/g.png",
    });
    // second call for the SAME slackUserId omits email and avatarUrl
    const second = await linkSlackUser({ slackUserId: "U777", name: "Grace Hopper" });
    expect(second.id).toBe(first.id);
    const after = await prisma.user.findUnique({ where: { id: first.id } });
    expect(after?.email).toBe("grace@x.com");      // preserved, not nulled
    expect(after?.avatarUrl).toBe("http://img/g.png"); // preserved, not nulled
  });
});
