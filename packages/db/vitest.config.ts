import { defineConfig } from "vitest/config";
export default defineConfig({
  // Test files share one on-disk SQLite DB via independent PrismaClient
  // connections; running files in parallel races reset()/create() across
  // suites (e.g. points.test.ts and kudos.test.ts both seed User/Team).
  // Force sequential file execution so DB-touching suites don't interleave.
  test: { environment: "node", fileParallelism: false },
});
