import { signIn, signOut } from "../../auth";
import { Avatar } from "./Avatar";

type NavUser = { name?: string | null; image?: string | null };

/**
 * Sticky top navigation shell. Auth server actions are passed through unchanged;
 * this component only restyles the wordmark, links, and sign-in/out controls.
 */
export function Nav({ user }: { user?: NavUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-borderx bg-canvas/85 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-3xl items-center gap-6 px-6 py-3"
      >
        <a
          href="/"
          className="font-display text-xl font-extrabold text-primary tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded"
        >
          Kudos
        </a>
        <div className="flex items-center gap-5 font-display text-sm font-semibold">
          <a
            href="/"
            className="text-ink/70 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded"
          >
            Feed
          </a>
          <a
            href="/rewards"
            className="text-ink/70 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded"
          >
            Rewards
          </a>
          <a
            href="/setup"
            aria-label="Setup & diagnostics"
            className="text-ink/60 transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas rounded"
          >
            Setup
          </a>
        </div>
        <div className="ml-auto">
          {user ? (
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
              className="flex items-center gap-3"
            >
              <Avatar name={user.name ?? "?"} avatarUrl={user.image} size="sm" />
              <span className="hidden text-sm text-ink/70 sm:inline">{user.name}</span>
              <button className="rounded-pill border border-borderx px-3 py-1.5 text-sm font-display font-semibold text-ink/70 transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">
                Sign out
              </button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("slack");
              }}
            >
              <button className="rounded-pill bg-primary px-4 py-1.5 text-sm font-display font-semibold text-white shadow-card transition hover:bg-[#a012c0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas">
                Sign in with Slack
              </button>
            </form>
          )}
        </div>
      </nav>
      {/* Signature purple→teal gradient hairline under the nav. */}
      <div className="h-0.5 w-full bg-brand" />
    </header>
  );
}
