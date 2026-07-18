/**
 * Whether the /setup diagnostics page and its server actions are available.
 *
 * The page exposes environment/database diagnostics, so it stays out of
 * production by default. In development (NODE_ENV !== "production") it is always
 * on; in production an operator must opt in with ENABLE_SETUP_PAGE="true".
 */
export function isSetupPageEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ENABLE_SETUP_PAGE === "true";
}
