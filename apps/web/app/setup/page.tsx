import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getDatabaseStatus, getEnvStatus } from "../../lib/diagnostics";
import { isSetupPageEnabled } from "./setup-enabled";
import { CheckList, CheckRow, Code, type CheckItem } from "./check-ui";
import { SlackTestButton } from "./slack-test-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Setup · Kudos", description: "Onboarding & diagnostics" };

// External link with a consistent style + focus ring and an out-of-app cue.
function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-primary underline decoration-primary/40 underline-offset-2 transition hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded"
    >
      {children}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

export default async function SetupPage() {
  // In development the page is always available. In production it stays hidden
  // (404) unless the operator opts in with ENABLE_SETUP_PAGE="true".
  if (!isSetupPageEnabled()) notFound();

  const [db, env] = await Promise.all([getDatabaseStatus(), Promise.resolve(getEnvStatus())]);

  // ---- Database checks -----------------------------------------------------
  const dbChecks: CheckItem[] = [];

  dbChecks.push({
    status: "info",
    label: "Database mode",
    detail: (
      <>
        {db.label} — <Code>{db.masked}</Code>
      </>
    ),
    fix: (
      <>
        Set <Code>DATABASE_URL</Code> to switch modes: unset uses the bundled SQLite file, a{" "}
        <Code>file:…</Code> path uses a custom SQLite database, and a <Code>postgres://…</Code> URL
        uses PostgreSQL. See <Code>docs/database.md</Code>.
      </>
    ),
  });

  if (!db.connected) {
    dbChecks.push({
      status: "fail",
      label: "Database connection",
      detail: <>Could not connect. {db.error ? <Code>{db.error}</Code> : null}</>,
      fix: (
        <>
          Check <Code>DATABASE_URL</Code>, make sure the server is reachable, then create the schema
          with <Code>npm run db:push</Code> (SQLite) or <Code>npm run db:pg:migrate</Code>{" "}
          (PostgreSQL).
        </>
      ),
    });
  } else if (!db.migrated) {
    dbChecks.push({
      status: "fail",
      label: "Database schema",
      detail: (
        <>
          Connected, but the app tables are missing. {db.error ? <Code>{db.error}</Code> : null}
        </>
      ),
      fix: (
        <>
          Create the tables: <Code>npm run db:push</Code> (SQLite) or{" "}
          <Code>npm run db:pg:migrate</Code> (PostgreSQL).
        </>
      ),
    });
  } else {
    dbChecks.push({
      status: "pass",
      label: "Database connection",
      detail: "Connected and the schema is in place.",
    });

    const c = db.counts!;
    dbChecks.push({
      status: db.seeded ? "pass" : "warn",
      label: "Seed data",
      detail: db.seeded ? (
        <>
          {c.teams} team{c.teams === 1 ? "" : "s"}, {c.users} user{c.users === 1 ? "" : "s"},{" "}
          {c.values} value{c.values === 1 ? "" : "s"}, {c.rewards} reward
          {c.rewards === 1 ? "" : "s"}.
        </>
      ) : (
        <>Tables are empty — no values or rewards yet.</>
      ),
      fix: (
        <>
          Load starter values, rewards, and demo teammates: <Code>npm run db:seed</Code> (core) or{" "}
          <Code>npm run db:demo</Code> (adds sample kudos).
        </>
      ),
    });
  }

  // ---- Web auth checks -----------------------------------------------------
  const authChecks: CheckItem[] = [
    {
      status: env.auth.secretSet ? (env.auth.secretWeak ? "warn" : "pass") : "fail",
      label: "AUTH_SECRET",
      detail: !env.auth.secretSet
        ? "Not set — required to sign sessions."
        : env.auth.secretWeak
          ? "Set, but looks like a placeholder or is too short."
          : "Set.",
      fix: (
        <>
          Generate a strong value and put it in <Code>apps/web/.env.local</Code>:{" "}
          <Code>openssl rand -base64 32</Code>.
        </>
      ),
    },
    {
      status: env.auth.slackIdSet && env.auth.slackSecretSet ? "pass" : "info",
      label: "Sign in with Slack (optional)",
      detail:
        env.auth.slackIdSet && env.auth.slackSecretSet
          ? "AUTH_SLACK_ID and AUTH_SLACK_SECRET are set — SSO is enabled."
          : "AUTH_SLACK_ID / AUTH_SLACK_SECRET not set — the dashboard still works without SSO.",
      fix: (
        <>
          To enable Slack SSO, copy the app&apos;s <Code>client_id</Code> / <Code>client_secret</Code>{" "}
          (Slack app → Basic Information → App Credentials) into <Code>apps/web/.env.local</Code>.
        </>
      ),
    },
  ];

  // ---- Slack bot checks ----------------------------------------------------
  const botChecks: CheckItem[] = [
    {
      status: env.slack.botTokenSet ? (env.slack.botTokenLooksValid ? "pass" : "warn") : "fail",
      label: "SLACK_BOT_TOKEN",
      detail: !env.slack.botTokenSet
        ? "Not set."
        : env.slack.botTokenLooksValid
          ? "Set (starts with xoxb-)."
          : "Set, but does not start with xoxb- — double-check you pasted the bot token.",
      fix: (
        <>
          From your Slack app → OAuth &amp; Permissions → Bot User OAuth Token. Put it in{" "}
          <Code>apps/slack/.env</Code> (and optionally <Code>apps/web/.env.local</Code> for
          celebration posts).
        </>
      ),
    },
    {
      status: env.slack.appTokenSet ? (env.slack.appTokenLooksValid ? "pass" : "warn") : "fail",
      label: "SLACK_APP_TOKEN",
      detail: !env.slack.appTokenSet
        ? "Not set (needed by the bot for Socket Mode)."
        : env.slack.appTokenLooksValid
          ? "Set (starts with xapp-)."
          : "Set, but does not start with xapp- — double-check the app-level token.",
      fix: (
        <>
          Slack app → Basic Information → App-Level Tokens → generate one with the{" "}
          <Code>connections:write</Code> scope. Put it in <Code>apps/slack/.env</Code>.
        </>
      ),
    },
    {
      status: env.slack.channelSet ? "pass" : env.slack.channelEmptyTrap ? "fail" : "warn",
      label: "SLACK_KUDOS_CHANNEL",
      detail: env.slack.channelSet ? (
        "Set."
      ) : env.slack.channelEmptyTrap ? (
        <>Defined but empty — this is the classic unquoted-# trap.</>
      ) : (
        "Not set."
      ),
      fix: (
        <>
          Set the channel and <strong>keep the quotes</strong> — dotenv treats an unquoted{" "}
          <Code>#</Code> as a comment, so <Code>SLACK_KUDOS_CHANNEL=#kudos</Code> silently becomes
          empty. Use <Code>SLACK_KUDOS_CHANNEL=&quot;#kudos&quot;</Code>.
        </>
      ),
    },
  ];

  // ---- Celebration posts (web-side) ---------------------------------------
  const celebrationChecks: CheckItem[] = [
    {
      status: env.celebrationsEnabled ? "pass" : "info",
      label: "Redemption celebration posts",
      detail: env.celebrationsEnabled
        ? "Enabled — redeeming a reward posts a celebration to your kudos channel."
        : "Disabled — redemptions work, they just won't post to Slack.",
      fix: (
        <>
          To enable, set both <Code>SLACK_BOT_TOKEN</Code> and <Code>SLACK_KUDOS_CHANNEL</Code> in{" "}
          <Code>apps/web/.env.local</Code> (reuse the bot token from <Code>apps/slack/.env</Code>).
        </>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">Setup &amp; diagnostics 🛠️</h1>
        <p className="mt-1 text-ink/60">
          A live checklist of what&apos;s configured and what&apos;s left — so you can connect Kudos
          to your own Slack workspace and database. Nothing here accepts secrets; it only reads your
          environment and reports back.
        </p>
      </header>

      <CheckList title="Database">
        {dbChecks.map((c, i) => (
          <CheckRow key={i} {...c} />
        ))}
      </CheckList>

      <CheckList title="Web sign-in">
        {authChecks.map((c, i) => (
          <CheckRow key={i} {...c} />
        ))}
      </CheckList>

      <CheckList title="Slack bot">
        {botChecks.map((c, i) => (
          <CheckRow key={i} {...c} />
        ))}
        <li className="px-5 py-4">
          <p className="text-sm text-ink/70">
            With a bot token set, verify it talks to Slack (calls <Code>auth.test</Code> — your token
            is never shown):
          </p>
          <SlackTestButton />
        </li>
      </CheckList>

      <CheckList title="Slack celebrations">
        {celebrationChecks.map((c, i) => (
          <CheckRow key={i} {...c} />
        ))}
      </CheckList>

      {/* ---- Guide ---------------------------------------------------------- */}
      <section className="rounded-card border border-borderx bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink">Get set up in a few steps</h2>
        <p className="mt-1 text-sm text-ink/60">
          New here? Follow these in order. The checklist above turns green as you go.
        </p>

        <ol className="mt-4 space-y-4">
          <GuideStep n={1} title="Create the Slack app from the manifest">
            Go to{" "}
            <Ext href="https://api.slack.com/apps">api.slack.com/apps</Ext> → <em>Create New App</em>{" "}
            → <em>From a manifest</em>, pick your workspace, and paste the YAML from{" "}
            <Code>apps/slack/manifest.yaml</Code>. Then <em>Install to Workspace</em>.
          </GuideStep>

          <GuideStep n={2} title="Grab the two Slack tokens">
            From <em>OAuth &amp; Permissions</em>, copy the Bot User OAuth Token (
            <Code>xoxb-…</Code>). From <em>Basic Information → App-Level Tokens</em>, generate a token
            with the <Code>connections:write</Code> scope (<Code>xapp-…</Code>).
          </GuideStep>

          <GuideStep n={3} title="Fill in the env files">
            Copy <Code>apps/slack/.env.example</Code> → <Code>apps/slack/.env</Code> and{" "}
            <Code>apps/web/.env.local.example</Code> → <Code>apps/web/.env.local</Code>. Add the
            tokens, generate <Code>AUTH_SECRET</Code> with <Code>openssl rand -base64 32</Code>, and{" "}
            <strong>keep the quotes</strong> around{" "}
            <Code>SLACK_KUDOS_CHANNEL=&quot;#kudos&quot;</Code>.
          </GuideStep>

          <GuideStep n={4} title="Install deps, create the schema, seed">
            <Code>npm install</Code>, then <Code>npm run db:push</Code> to create the tables, then{" "}
            <Code>npm run db:seed</Code> for starter values &amp; rewards (or{" "}
            <Code>npm run db:demo</Code> for sample kudos too).
          </GuideStep>

          <GuideStep n={5} title="Run it">
            Start the dashboard with <Code>npm run dev:web</Code> (this page lives at{" "}
            <Code>/setup</Code>) and the bot with <Code>npm run dev:slack</Code>. Type{" "}
            <Code>/kudos</Code> in Slack to give recognition.
          </GuideStep>

          <GuideStep n={6} title="Prefer Docker?">
            Bring up Postgres + the apps with the compose setup — see <Code>docs/docker.md</Code>.
            For switching between SQLite and PostgreSQL, see <Code>docs/database.md</Code>.
          </GuideStep>
        </ol>
      </section>
    </div>
  );
}

function GuideStep({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-primary/10 font-display text-sm font-bold text-primary"
      >
        {n}
      </span>
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold text-ink">
          <span className="sr-only">Step {n}: </span>
          {title}
        </p>
        <p className="mt-0.5 text-sm text-ink/70">{children}</p>
      </div>
    </li>
  );
}
