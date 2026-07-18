"use server";

import { revalidatePath } from "next/cache";
import { fulfillRedemption } from "@kudos/db";
import { getCurrentUser } from "../../lib/current-user";

export async function fulfillRedemptionAction(formData: FormData): Promise<void> {
  // Server actions are reachable directly, so re-check the admin gate here
  // rather than relying on the page 404ing for non-admins.
  const user = await getCurrentUser();
  if (user?.isAdmin !== true) return;

  const id = formData.get("redemptionId");
  if (typeof id !== "string" || id.length === 0) return;

  try {
    await fulfillRedemption(id);
  } catch {
    // Unknown id — e.g. the queue was reseeded underneath a stale page. The
    // revalidate below refreshes the queue either way.
  }
  revalidatePath("/admin");
}
