import { PrismaClient } from "@prisma/client";

// Zero-config default: with no DATABASE_URL set we fall back to the bundled
// SQLite dev database so `npm test`, `db:seed`, `db:demo`, and local dev all
// work with no environment setup. A DATABASE_URL that IS set always wins —
// a custom `file:...` path or, in PostgreSQL mode, a `postgres://...` URL
// (see docs/database.md). The relative SQLite path resolves against the
// prisma/ schema directory, i.e. packages/db/prisma/dev.db.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

export const prisma = new PrismaClient();
