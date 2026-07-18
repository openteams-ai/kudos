"use client";

import { useFormState, useFormStatus } from "react-dom";
import { slackTestAction, type SlackTestResult } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-pill border border-borderx bg-card px-4 py-2 text-sm font-display font-semibold text-ink transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Testing…" : "Test Slack connection"}
    </button>
  );
}

/**
 * Runs the auth.test server action and shows the workspace + bot name inline.
 * The token never reaches the client — only this pass/fail summary does.
 */
export function SlackTestButton() {
  const [state, formAction] = useFormState<SlackTestResult | null, FormData>(
    slackTestAction,
    null,
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      <SubmitButton />
      {state ? (
        state.ok ? (
          <p role="status" className="text-sm text-teal-ink">
            <span aria-hidden="true">✓ </span>
            Connected to <span className="font-semibold">{state.team}</span> as{" "}
            <span className="font-semibold">{state.botUser}</span>.
          </p>
        ) : (
          <p role="alert" className="text-sm text-ink">
            <span aria-hidden="true" className="text-primary">
              ✕{" "}
            </span>
            Slack test failed: {state.error}
          </p>
        )
      ) : null}
    </form>
  );
}
