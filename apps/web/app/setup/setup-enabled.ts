import { prisma } from "@kudos/db";
import { getCurrentUser } from "../../lib/current-user";

/** Access decision for /setup, plus whether we're in the open first-run window. */
export type SetupAccess = { allowed: false } | { allowed: true; firstRun: boolean };

/**
 * Self-locking first-run gate for /setup (Bitwarden-style).
 *
 *   - development: always available.
 *   - production, no admin user exists yet: OPEN — the first-run window, so a
 *     fresh deploy can be configured (Slack/SSO/DB) before anyone can sign in.
 *   - production, an admin exists: locked to a signed-in admin (User.isAdmin);
 *     everyone else gets a 404.
 *   - production, DB unreachable: treated as not-set-up and allowed. That's
 *     exactly when an operator needs the diagnostics page, and with no DB
 *     reachable the page can't leak counts anyway. Deliberate tradeoff.
 */
export async function checkSetupAccess(): Promise<SetupAccess> {
  if (process.env.NODE_ENV !== "production") return { allowed: true, firstRun: false };

  let adminCount: number;
  try {
    adminCount = await prisma.user.count({ where: { isAdmin: true } });
  } catch {
    // DB unreachable — allow (see above). Not flagged as first-run: the page's
    // own database diagnostics explain the real state to the operator.
    return { allowed: true, firstRun: false };
  }

  // First-run window: no admin yet -> open so the operator can lock it later.
  if (adminCount === 0) return { allowed: true, firstRun: true };

  // Locked: an admin exists, so require a signed-in admin.
  const user = await getCurrentUser();
  return user?.isAdmin === true ? { allowed: true, firstRun: false } : { allowed: false };
}
