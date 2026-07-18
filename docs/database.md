# Database

Kudos runs on [Prisma](https://www.prisma.io/) and supports **SQLite** (zero-config,
the default) and **PostgreSQL** (for a real deployment) from a single data model.
Which one you get is decided entirely by the `DATABASE_URL` environment variable.

## The three modes

| Mode | `DATABASE_URL` | When to use | Setup |
| --- | --- | --- | --- |
| **1. None — zero-config SQLite** | _unset_ | Local dev, tests, demos, the hackathon default | Nothing. It just works. |
| **2. Bundled Postgres** | `postgres://…` (from `docker compose --profile postgres`) | A production-like local stack | `docker compose --profile postgres up`, then the Postgres deploy steps below |
| **3. Existing database** | `postgres://…` (your server) | Deploying against managed Postgres (RDS, Cloud SQL, Neon, …) | Point `DATABASE_URL` at it and run `migrate deploy` |

The URL scheme is the switch:

- **unset** → falls back to the bundled SQLite file `packages/db/prisma/dev.db`.
  This keeps `npm test`, `npm run db:seed`, `npm run db:demo`, and local app dev
  working with **zero** environment setup.
- **`file:…`** → a custom SQLite file at that path (relative paths resolve against
  `packages/db/prisma/`).
- **`postgres://…`** / **`postgresql://…`** → PostgreSQL mode. Use the generated
  `schema.postgres.prisma` and the `db:pg:*` scripts (below).

> The default is applied in two places so it holds for both the app runtime and
> the Prisma CLI: `packages/db/src/client.ts` sets `process.env.DATABASE_URL`
> before instantiating the client, and the `db:generate` / `db:push` npm scripts
> use a shell default (`${DATABASE_URL:-file:./dev.db}`). An explicit
> `DATABASE_URL` always wins over both.

## Why two schema files (the provider-swap design)

Prisma's `datasource.provider` is **static** — one schema file cannot declare both
`sqlite` and `postgresql`, and Prisma has no env-var fallback for it. Rather than
hand-maintain two schemas that inevitably drift, we keep **one source of truth**
and generate the other:

- **`packages/db/prisma/schema.prisma`** — the single source of truth (SQLite provider).
  Edit models, fields, relations, and indexes **here only**.
- **`packages/db/prisma/schema.postgres.prisma`** — **generated**, never hand-edited.
  `packages/db/scripts/gen-postgres-schema.ts` copies the source verbatim and swaps
  only the datasource provider (`sqlite` → `postgresql`). Because every model is
  byte-for-byte identical, the two cannot disagree about the data model.

This mechanical swap is safe because the schema uses only **portable** Prisma types
(`String`, `Int`, `Boolean`, `DateTime`) with no provider-specific native type
attributes (`@db.*`), enums, or provider-only features. The generator asserts this:
if a `@db.*` native type is ever introduced it fails loudly rather than emit an
invalid schema, and the generator must then be extended to translate it.

Regenerate / verify the Postgres schema:

```bash
npm run db:pg:schema         # regenerate schema.postgres.prisma from schema.prisma
npm run db:pg:schema:check   # CI-friendly: exit 1 if it is out of date
```

Wire `db:pg:schema:check` into CI so the generated schema can never drift from the
source without the build catching it.

### One data model, one app

Application code is 100% Prisma Client API — there is **no** raw SQL and no
SQLite- or Postgres-specific query logic anywhere in the codebase, so the exact
same app code runs against either database. The Prisma Client's provider is baked
in at `prisma generate` time, so the only difference between the two modes is
**which schema you generate the client from** before you run the app.

## Migrations

### SQLite (dev): `db push`, no migration history

SQLite mode uses `prisma db push`, which syncs the schema directly to `dev.db`.
This is deliberate: for a zero-config local/demo database there is no value in a
migration history, and `db push` keeps setup to a single command. We never run
SQLite in production, so there is nothing to migrate forward safely.

```bash
npm run db:push     # sync schema.prisma -> dev.db (zero env needed)
```

### PostgreSQL (prod): real, versioned migrations

Postgres mode uses committed SQL migrations under
`packages/db/prisma/migrations/`. The baseline `0_init` migration is the full
schema, generated deterministically from the Postgres schema with
`prisma migrate diff` (empty → schema). `migration_lock.toml` records
`provider = "postgresql"`.

Production deploy flow (all require `DATABASE_URL` to point at your Postgres):

```bash
export DATABASE_URL="postgres://user:pass@host:5432/kudos"

npm run db:pg:generate   # prisma generate --schema=…/schema.postgres.prisma
npm run db:pg:migrate    # prisma migrate deploy --schema=…/schema.postgres.prisma
# then seed if this is a fresh database:
npm run db:seed          # runtime scripts read DATABASE_URL; here it is Postgres
```

`migrate deploy` applies pending migrations only and never resets data — it is the
correct command for production and CI/CD.

**Adding a future migration** (schema change): edit `schema.prisma`, regenerate the
Postgres schema (`npm run db:pg:schema`), then create the migration SQL against a
shadow/dev Postgres:

```bash
# with DATABASE_URL pointing at a dev Postgres you can reset:
npx prisma migrate dev --name <change_name> \
  --schema=packages/db/prisma/schema.postgres.prisma
```

Commit the new folder under `packages/db/prisma/migrations/`. Production then picks
it up via `db:pg:migrate` (`migrate deploy`).

## Backups

- **SQLite** — the database is a single file, `packages/db/prisma/dev.db`. Back it
  up by copying the file (ideally quiesce writes first, or use
  `sqlite3 dev.db ".backup backup.db"` for a consistent online copy). It is
  gitignored and holds only demo data.
- **PostgreSQL** — use `pg_dump` for logical backups
  (`pg_dump "$DATABASE_URL" > backup.sql`) and your provider's snapshot/PITR
  features for the real thing. Restore with `psql "$DATABASE_URL" < backup.sql`.

## Script reference

Root `package.json` (run from the repo root):

| Script | What it does |
| --- | --- |
| `npm test` | Runs the `@kudos/db` test suite (SQLite, zero env) |
| `npm run db:generate` | Generate the Prisma Client for SQLite |
| `npm run db:push` | Sync `schema.prisma` → `dev.db` (SQLite) |
| `npm run db:seed` | Seed baseline data (values, rewards, users) |
| `npm run db:demo` | Fill the DB with realistic demo activity |
| `npm run db:pg:schema` | Regenerate `schema.postgres.prisma` from the source |
| `npm run db:pg:schema:check` | CI check that the Postgres schema is current |
| `npm run db:pg:generate` | Generate the Prisma Client for PostgreSQL |
| `npm run db:pg:migrate` | `prisma migrate deploy` against PostgreSQL |

> `db:generate` / `db:push` / `db:seed` / `db:demo` are the **SQLite-mode**
> commands: they honor a `file:` `DATABASE_URL` and default to the bundled
> `dev.db`. In PostgreSQL mode use the `db:pg:*` commands with `DATABASE_URL` set
> to your `postgres://` URL.
