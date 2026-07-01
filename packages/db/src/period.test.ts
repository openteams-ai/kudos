import { describe, it, expect } from "vitest";
import { currentPeriod } from "./period.js";

describe("currentPeriod", () => {
  it("returns month start and next-month start in UTC", () => {
    const { start, end } = currentPeriod(new Date("2026-06-15T12:00:00Z"));
    expect(start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("rolls over December to next January", () => {
    const { start, end } = currentPeriod(new Date("2026-12-31T23:59:59Z"));
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
