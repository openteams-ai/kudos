"use server";

// Read-only diagnostic action: verifies SLACK_BOT_TOKEN by calling Slack's
// auth.test. It reports the workspace + bot name on success and NEVER returns
// or logs the token itself.

import { isSetupPageEnabled } from "./setup-enabled";

export type SlackTestResult =
  | { ok: true; team: string; botUser: string; url?: string }
  | { ok: false; error: string };

// Simple in-memory rate limit: at most one auth.test call every 5s across the
// process. Page gating doesn't cover server actions (they're callable directly),
// so this guards against hammering Slack regardless of environment.
const MIN_INTERVAL_MS = 5_000;
let lastRunAt = 0;

async function runSlackTest(): Promise<SlackTestResult> {
  const token = process.env.SLACK_BOT_TOKEN?.trim();
  if (!token) {
    return {
      ok: false,
      error: "SLACK_BOT_TOKEN is not set in this web server's environment.",
    };
  }
  try {
    const res = await fetch("https://slack.com/api/auth.test", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      team?: string;
      user?: string;
      url?: string;
      error?: string;
    };
    if (!data.ok) {
      return { ok: false, error: data.error ?? "Slack rejected the request." };
    }
    return {
      ok: true,
      team: data.team ?? "(unknown workspace)",
      botUser: data.user ?? "(unknown bot user)",
      url: data.url,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error calling Slack." };
  }
}

/** useFormState-compatible wrapper (prevState + formData are unused). */
export async function slackTestAction(
  _prev: SlackTestResult | null,
  _formData: FormData,
): Promise<SlackTestResult> {
  // Server actions are reachable directly, so re-check the gate here rather
  // than relying on the page being hidden.
  if (!(await isSetupPageEnabled())) {
    return { ok: false, error: "Setup diagnostics are disabled on this server." };
  }

  const now = Date.now();
  if (now - lastRunAt < MIN_INTERVAL_MS) {
    return { ok: false, error: "Too many attempts — try again in a moment." };
  }
  lastRunAt = now;

  return runSlackTest();
}
