import { getCurrentUser } from "../../lib/current-user";

/**
 * Whether the /setup diagnostics page and its server actions are available.
 *
 * The page exposes environment/database diagnostics, so access is restricted:
 *   - development (NODE_ENV !== "production"): always available.
 *   - production: available only if EITHER
 *       (a) ENABLE_SETUP_PAGE === "true" — a bootstrap escape hatch, since a
 *           fresh deploy can't sign anyone in until setup is complete; OR
 *       (b) the current signed-in user is an admin (User.isAdmin).
 *
 * The page is also unlisted — there is no UI link to it; reach it by URL.
 */
export async function isSetupPageEnabled(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.ENABLE_SETUP_PAGE === "true") return true;
  const user = await getCurrentUser();
  return user?.isAdmin === true;
}
