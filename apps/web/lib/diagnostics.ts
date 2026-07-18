// Server-only onboarding diagnostics for the /setup page.
//
// Everything here reads the running web process's environment and the shared
// Prisma client. It NEVER returns a secret value — only booleans, masked URLs,
// and human-readable status. Safe to render into a server component.

import { prisma } from "@kudos/db";

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export type DbMode = "sqlite-default" | "sqlite-file" | "postgres" | "unknown";

export type DbInfo = {
  mode: DbMode;
  /** Friendly one-liner for the mode, e.g. "SQLite (bundled dev.db)". */
  label: string;
  /** DATABASE_URL with any credentials stripped — safe to display. */
  masked: string;
};

/**
 * Classify DATABASE_URL per the shared contract:
 *   unset            -> default bundled SQLite
 *   file:...         -> a custom SQLite file
 *   postgres(ql)://  -> Postgres
 * Credentials are always masked before display.
 */
export function classifyDatabaseUrl(raw: string | undefined): DbInfo {
  const url = raw?.trim();
  if (!url) {
    return {
      mode: "sqlite-default",
      label: "SQLite — bundled dev database (default)",
      masked: "file:./packages/db/prisma/dev.db",
    };
  }
  if (url.startsWith("file:")) {
    return { mode: "sqlite-file", label: "SQLite — custom file", masked: url };
  }
  if (/^postgres(ql)?:\/\//i.test(url)) {
    return { mode: "postgres", label: "PostgreSQL", masked: maskUrl(url) };
  }
  return { mode: "unknown", label: "Unrecognized DATABASE_URL scheme", masked: maskUrl(url) };
}

/** Strip user:password from a URL, keeping scheme + host (+ port + db name). */
function maskUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const auth = u.username ? "***@" : "";
    const port = u.port ? `:${u.port}` : "";
    const db = u.pathname && u.pathname !== "/" ? u.pathname : "";
    return `${u.protocol}//${auth}${u.hostname}${port}${db}`;
  } catch {
    return "(could not parse DATABASE_URL)";
  }
}

export type DbStatus = DbInfo & {
  /** Did a trivial `SELECT 1` succeed? */
  connected: boolean;
  /** Did the app tables exist and respond to counts? */
  migrated: boolean;
  /** Do we have core seed data (values + rewards)? */
  seeded: boolean;
  counts: { teams: number; users: number; values: number; rewards: number } | null;
  /** Short error message when connection/counts failed (never a secret). */
  error: string | null;
};

export async function getDatabaseStatus(): Promise<DbStatus> {
  const info = classifyDatabaseUrl(process.env.DATABASE_URL);

  // 1. Can we open a connection at all?
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch (e) {
    return {
      ...info,
      connected: false,
      migrated: false,
      seeded: false,
      counts: null,
      error: shortError(e),
    };
  }

  // 2. Connected — do the tables exist and hold seed data?
  try {
    const [teams, users, values, rewards] = await Promise.all([
      prisma.team.count(),
      prisma.user.count(),
      prisma.value.count(),
      prisma.reward.count(),
    ]);
    return {
      ...info,
      connected: true,
      migrated: true,
      seeded: values > 0 && rewards > 0,
      counts: { teams, users, values, rewards },
      error: null,
    };
  } catch (e) {
    return {
      ...info,
      connected: true,
      migrated: false,
      seeded: false,
      counts: null,
      error: shortError(e),
    };
  }
}

function shortError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.split("\n")[0].slice(0, 200);
}

// ---------------------------------------------------------------------------
// Environment (auth + Slack), read from this web process. Never echoes values.
// ---------------------------------------------------------------------------

export type EnvStatus = {
  auth: {
    secretSet: boolean;
    /** Set but looks like the placeholder or is too short to be safe. */
    secretWeak: boolean;
    slackIdSet: boolean;
    slackSecretSet: boolean;
  };
  slack: {
    botTokenSet: boolean;
    botTokenLooksValid: boolean; // starts with xoxb-
    appTokenSet: boolean;
    appTokenLooksValid: boolean; // starts with xapp-
    channelSet: boolean;
    /** Defined but empty — the classic unquoted-`#` dotenv trap. */
    channelEmptyTrap: boolean;
  };
  celebrationsEnabled: boolean;
};

export function getEnvStatus(): EnvStatus {
  const authSecret = process.env.AUTH_SECRET?.trim() ?? "";
  const secretSet = authSecret.length > 0;
  const secretWeak = secretSet && (authSecret === "replace-me" || authSecret.length < 16);

  const slackId = process.env.AUTH_SLACK_ID?.trim() ?? "";
  const slackSecret = process.env.AUTH_SLACK_SECRET?.trim() ?? "";
  const slackIdSet = slackId.length > 0 && slackId !== "your-slack-client-id";
  const slackSecretSet = slackSecret.length > 0 && slackSecret !== "your-slack-client-secret";

  const botToken = process.env.SLACK_BOT_TOKEN?.trim() ?? "";
  const appToken = process.env.SLACK_APP_TOKEN?.trim() ?? "";
  const channelRaw = process.env.SLACK_KUDOS_CHANNEL;
  const channel = channelRaw?.trim() ?? "";

  const botTokenSet = botToken.length > 0;
  const appTokenSet = appToken.length > 0;
  const channelSet = channel.length > 0;

  return {
    auth: { secretSet, secretWeak, slackIdSet, slackSecretSet },
    slack: {
      botTokenSet,
      botTokenLooksValid: botToken.startsWith("xoxb-"),
      appTokenSet,
      appTokenLooksValid: appToken.startsWith("xapp-"),
      channelSet,
      // Defined in the environment yet empty -> almost always an unquoted `#`.
      channelEmptyTrap: channelRaw !== undefined && channel.length === 0,
    },
    celebrationsEnabled: botTokenSet && channelSet,
  };
}
