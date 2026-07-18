# Running Kudos with Docker

One image, two services: the **web** dashboard (Next.js, port 3000) and the
**slack** bot (Bolt Socket Mode, no inbound port). Both are built from the same
[`Dockerfile`](../Dockerfile) and wired together by
[`docker-compose.yml`](../docker-compose.yml).

By default the app runs on SQLite stored in a named Docker volume, so the data
survives restarts and is shared between the two containers. PostgreSQL is
available as an opt-in profile.

## Quick start

```bash
# 1. Create your env file (not committed). The web example lists every key;
#    the slack bot reads SLACK_* from the same file.
cp apps/web/.env.local.example .env.docker
#    then edit .env.docker — at minimum set AUTH_SECRET (openssl rand -base64 32)
#    and the SLACK_* values if you want the bot / SSO.

# 2. Build both targets.
docker compose build

# 3. Initialise the database (one-shot: create tables, then seed values+rewards).
docker compose run --rm web npm run db:push
docker compose run --rm web npm run db:seed
#    optional: richer demo data instead of the minimal seed
#    docker compose run --rm web npm run db:demo

# 4. Start everything.
docker compose up
#    web  -> http://localhost:3000
#    slack -> connects out to Slack over Socket Mode (no public URL needed)
```

To rebuild a single image directly (without compose):

```bash
docker build --target web   -t kudos:web   .
docker build --target slack -t kudos:slack .

# For a Postgres deployment, bake the Postgres Prisma client:
docker build --target web --build-arg DB_PROVIDER=postgres -t kudos:web .
```

## Database modes

The `DATABASE_URL` env var selects the backend. All three modes are honored by
`@kudos/db`; compose just passes the variable through.

| `DATABASE_URL`        | Backend    | Where the data lives                                   |
| --------------------- | ---------- | ------------------------------------------------------ |
| _unset_ (default)     | SQLite     | `packages/db/prisma/dev.db` — on the `kudos-db` volume |
| `file:/path/to/x.db`  | SQLite     | custom file path (also persisted if on a volume)       |
| `postgresql://…`      | PostgreSQL | the Postgres server you point it at                    |

### Default: SQLite on a shared volume

Nothing to configure. The `kudos-db` named volume is mounted at
`/app/packages/db/prisma` in **both** the web and slack containers, so they read
and write the same `dev.db`. It persists across `docker compose down`/`up`.

Reset the database (wipe the volume) with:

```bash
docker compose down -v      # removes the kudos-db volume
```

> Note: because the volume shadows the Prisma directory, updated seed scripts in
> a rebuilt image do not reach an existing volume automatically. Run
> `docker compose down -v` and re-init to pick them up.

### PostgreSQL (opt-in profile)

A `postgres:16-alpine` service ships behind the `postgres` compose profile with a
healthcheck and its own `kudos-pg` volume.

Postgres uses a **different Prisma schema** (`prisma/schema.postgres.prisma`,
provider `postgresql`) and a migration-based flow. The image must be built with
the Postgres client — the default SQLite client cannot talk to Postgres — so the
Postgres path starts with a rebuild:

```bash
# 1. Build the images with the Postgres Prisma client.
docker compose build --build-arg DB_PROVIDER=postgres

# 2. In .env.docker, point the app at the bundled Postgres. The password must
#    match POSTGRES_PASSWORD in docker-compose.yml — change both (they ship with
#    a local-only placeholder) before exposing Postgres beyond your machine:
#    DATABASE_URL=postgresql://kudos:change-me-local-kudos-pw@db:5432/kudos?schema=public

# 3. Start the db service (profile-gated) and wait for it to be healthy.
docker compose --profile postgres up -d db

# 4. Apply migrations, then seed. Use db:pg:migrate (migrate deploy against the
#    Postgres schema) — NOT db:push, which targets SQLite and fails with a
#    provider/URL mismatch (Prisma P1012).
docker compose run --rm web npm run db:pg:migrate
docker compose run --rm web npm run db:seed

# 5. Start everything.
docker compose --profile postgres up
```

The service name `db` is the hostname on the compose network, which is why the
URL host is `db`. For migration internals and adding future migrations, see
[`docs/database.md`](./database.md).

## Environment variables

Put these in `.env.docker` (referenced by both services in
`docker-compose.yml`). The file is optional at boot — the containers start
without it — but the web app needs `AUTH_SECRET` and the bot needs its tokens to
be useful. (The optional `env_file` object form used in `docker-compose.yml`
requires **Docker Compose v2.24+**; on older versions, create `.env.docker`
before running or drop the `required: false` line.) Full reference:
[`apps/web/.env.local.example`](../apps/web/.env.local.example)
and [`apps/slack/.env.example`](../apps/slack/.env.example).

| Variable              | Used by     | Required?                     | Notes                                                                 |
| --------------------- | ----------- | ----------------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`        | web + slack | no (defaults to SQLite)       | See _Database modes_ above.                                           |
| `AUTH_SECRET`         | web         | yes                           | `openssl rand -base64 32`.                                            |
| `AUTH_URL`            | web         | recommended                   | `http://localhost:3000` for local; the public URL in production.     |
| `AUTH_SLACK_ID`       | web         | for Slack SSO                 | Slack app client id. Optional for a data-only demo.                  |
| `AUTH_SLACK_SECRET`   | web         | for Slack SSO                 | Slack app client secret.                                             |
| `SLACK_BOT_TOKEN`     | web + slack | yes (bot); optional (web)     | `xoxb-…`. The bot needs it; web reuses it to post celebration messages. |
| `SLACK_APP_TOKEN`     | slack       | yes (bot)                     | `xapp-…` with `connections:write` — required for Socket Mode.        |
| `SLACK_KUDOS_CHANNEL` | web + slack | for Slack posts               | **Quote it**: `SLACK_KUDOS_CHANNEL="#kudos"` — dotenv treats an unquoted `#` as a comment. |

## Troubleshooting

**SQLite volume permissions / "unable to open database file".**
The container runs as `node` and the volume is created by Docker; on first use it
inherits the image's `packages/db/prisma` contents. If you see permission errors,
wipe and recreate: `docker compose down -v && docker compose run --rm web npm run db:push`.

**"Table does not exist" / empty dashboard.**
You skipped the init step. Run `docker compose run --rm web npm run db:push` then
`npm run db:seed` (see Quick start step 3).

**Slack bot can't connect (Socket Mode).**
Socket Mode needs outbound WebSocket access to Slack — no inbound port or public
URL. Confirm `SLACK_BOT_TOKEN` (`xoxb-`) and `SLACK_APP_TOKEN` (`xapp-`, scope
`connections:write`) are set in `.env.docker`, and that egress to `slack.com` is
allowed. Validate tokens with `docker compose run --rm slack npm -w @kudos/slack run verify`.

**Prisma / OpenSSL errors at runtime.**
The image installs `openssl` and `libc6-compat` for the Prisma query engine on
Alpine. If you swap the base image, keep those packages or Prisma will fail to
load its engine.

**Changed the seed data but the app still shows the old data.**
The SQLite file lives on a persistent volume. Re-run the seed, or reset with
`docker compose down -v` and re-init.
