// Generates prisma/schema.postgres.prisma from prisma/schema.prisma.
//
// Prisma's datasource `provider` is static — one schema file cannot serve both
// SQLite and PostgreSQL. Rather than hand-maintain two schemas (which drift),
// we keep schema.prisma as the single source of truth and mechanically derive
// the PostgreSQL variant by swapping only the datasource provider. Every model,
// field, relation, and index stays byte-for-byte identical, so the two can
// never disagree about the data model.
//
// This is safe here because the schema uses only portable Prisma types
// (String, Int, Boolean, DateTime) with no SQLite- or PostgreSQL-specific
// native type attributes (`@db.*`), enums, or provider-only features. If such a
// feature is ever added, this generator must grow to translate it (and the
// assertion below will fail loudly rather than emit an invalid schema).
//
// Usage:
//   tsx scripts/gen-postgres-schema.ts          # (re)generate the file
//   tsx scripts/gen-postgres-schema.ts --check   # CI: fail if out of date

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(here, "..", "prisma", "schema.prisma");
const TARGET = join(here, "..", "prisma", "schema.postgres.prisma");

const GENERATED_HEADER = `// ============================================================================
// GENERATED FILE — DO NOT EDIT.
// Produced from schema.prisma by scripts/gen-postgres-schema.ts.
// Edit schema.prisma (the single source of truth) and run:
//   npm run db:pg:schema        (from the repo root)
// ============================================================================
`;

function generate(source: string): string {
  // Swap the datasource provider sqlite -> postgresql. The url stays
  // env("DATABASE_URL"): the same variable selects the database, and in
  // PostgreSQL mode it holds a postgres:// URL.
  const swapped = source.replace(
    /(datasource\s+\w+\s*\{[^}]*?provider\s*=\s*)"sqlite"/,
    '$1"postgresql"'
  );

  if (swapped === source) {
    throw new Error(
      'Could not find `provider = "sqlite"` in the datasource block of schema.prisma.'
    );
  }
  if (/provider\s*=\s*"sqlite"/.test(swapped)) {
    throw new Error("A `sqlite` provider still remains after the swap — aborting.");
  }
  // Guard against silently emitting an invalid schema if a non-portable,
  // provider-specific native type is ever introduced.
  const nativeType = swapped.match(/@db\.\w+/);
  if (nativeType) {
    throw new Error(
      `schema.prisma uses a provider-specific native type (${nativeType[0]}). ` +
        "The generator only swaps the provider and cannot translate native types; " +
        "extend gen-postgres-schema.ts before adding one."
    );
  }

  return GENERATED_HEADER + "\n" + swapped.replace(/^﻿/, "").trimStart();
}

const source = readFileSync(SOURCE, "utf8");
const generated = generate(source);
const check = process.argv.includes("--check");

if (check) {
  let current = "";
  try {
    current = readFileSync(TARGET, "utf8");
  } catch {
    /* missing target is treated as out of date */
  }
  if (current !== generated) {
    console.error(
      "schema.postgres.prisma is out of date. Run `npm run db:pg:schema` and commit the result."
    );
    process.exit(1);
  }
  console.log("schema.postgres.prisma is up to date.");
} else {
  writeFileSync(TARGET, generated);
  console.log(`Wrote ${TARGET}`);
}
