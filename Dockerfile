# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Kudos monorepo image. One multi-stage build, two runnable targets:
#   --target web    -> Next.js dashboard (next start, port 3000)
#   --target slack  -> Bolt Socket Mode bot (tsx, no inbound port)
# Both share a single install + build so the Prisma client and workspace deps
# are produced once. See docs/docker.md.
# ---------------------------------------------------------------------------

# --- base -------------------------------------------------------------------
# Node 20 (matches .nvmrc). openssl + libc6-compat are required for the Prisma
# query engine on Alpine/musl; without them `prisma generate` and the client
# fail at runtime.
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- deps -------------------------------------------------------------------
# Install workspace dependencies from the lockfile. Only package manifests are
# copied so this layer caches until dependencies actually change.
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/web/package.json ./apps/web/
COPY apps/slack/package.json ./apps/slack/
RUN npm ci

# --- build ------------------------------------------------------------------
# Bring in the full source, generate the Prisma client for the selected DB
# provider, and build the Next app.
#
#   DB_PROVIDER=sqlite   (default) -> client from prisma/schema.prisma
#   DB_PROVIDER=postgres           -> client from prisma/schema.postgres.prisma
#
# Build with `--build-arg DB_PROVIDER=postgres` for a Postgres deployment; the
# baked client must match the target database or it cannot talk to it.
#
# The exported DATABASE_URL is a throwaway matching the provider's protocol:
# `prisma generate` (and PrismaClient construction during `next build`) validate
# the URL scheme, but nothing connects at build time — all DB-backed pages are
# `force-dynamic`. It is NOT carried into the runtime stages.
FROM base AS build
ARG DB_PROVIDER=sqlite
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN if [ "$DB_PROVIDER" = "postgres" ]; then \
      export DATABASE_URL="postgresql://build:build@localhost:5432/build"; \
      npm run db:pg:generate; \
    else \
      export DATABASE_URL="file:/tmp/build.db"; \
      npm run db:generate; \
    fi && \
    npm -w @kudos/web run build

# --- runtime ----------------------------------------------------------------
# Shared runtime layer for both targets: production env + the fully built
# workspace (deps, generated Prisma client, and .next output).
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./

# --- web target -------------------------------------------------------------
FROM runtime AS web
EXPOSE 3000
CMD ["npm", "-w", "@kudos/web", "start"]

# --- slack target -----------------------------------------------------------
# Socket Mode: outbound WebSocket only, no published port needed.
FROM runtime AS slack
CMD ["npm", "-w", "@kudos/slack", "start"]
