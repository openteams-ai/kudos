"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  fulfillRedemption,
  createReward,
  updateReward,
  deleteReward,
  RewardValidationError,
  RewardInUseError,
} from "@kudos/db";
import { getCurrentUser } from "../../lib/current-user";

// Server actions are reachable directly, so every mutation re-checks the
// admin gate here rather than relying on the page 404ing for non-admins.
async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isAdmin === true;
}

export async function fulfillRedemptionAction(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;

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

// ---- Catalog management ----------------------------------------------------

// Optional-text fields: absent from the form -> undefined (leave unchanged);
// present but blank -> "" (updateReward stores that as null, i.e. cleared).
function text(formData: FormData, key: string, maxLength: number): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  return value.slice(0, maxLength);
}

function costField(formData: FormData): number | undefined {
  const raw = formData.get("cost");
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  // Non-numeric input becomes NaN, which fails reward validation server-side.
  return Number(raw.trim());
}

// Pages that show reward data and must reflect a catalog edit immediately.
function revalidateCatalog() {
  revalidatePath("/admin");
  revalidatePath("/rewards");
  revalidatePath("/rewards/history");
}

function catalogErrorMessage(e: unknown): string {
  if (e instanceof RewardValidationError) return e.message;
  if (e instanceof RewardInUseError)
    return "That reward has redemption history, so it can't be deleted.";
  return "Couldn't save that change — the reward may no longer exist. Refresh and try again.";
}

export async function updateRewardAction(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;

  const id = formData.get("rewardId");
  if (typeof id !== "string" || id.length === 0) return;

  const name = text(formData, "name", 80);
  const cost = costField(formData);
  const category = text(formData, "category", 40);
  const emoji = text(formData, "emoji", 16);
  const description = text(formData, "description", 300);

  let error: string | null = null;
  try {
    await updateReward(id, {
      ...(name !== undefined && { name }),
      ...(cost !== undefined && { cost }),
      ...(category !== undefined && { category }),
      ...(emoji !== undefined && { emoji }),
      ...(description !== undefined && { description }),
    });
  } catch (e) {
    error = catalogErrorMessage(e);
  }
  revalidateCatalog();
  // On failure, reload /admin with a friendly banner instead of Next's opaque
  // server-action error screen.
  if (error) redirect(`/admin?error=${encodeURIComponent(error)}`);
}

export async function createRewardAction(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;

  let error: string | null = null;
  try {
    await createReward({
      name: text(formData, "name", 80) ?? "",
      cost: costField(formData) ?? NaN,
      category: text(formData, "category", 40) ?? "",
      emoji: text(formData, "emoji", 16) ?? null,
      description: text(formData, "description", 300) ?? null,
    });
  } catch (e) {
    error = catalogErrorMessage(e);
  }
  revalidateCatalog();
  if (error) redirect(`/admin?error=${encodeURIComponent(error)}`);
}

export async function deleteRewardAction(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;

  const id = formData.get("rewardId");
  if (typeof id !== "string" || id.length === 0) return;

  let error: string | null = null;
  try {
    await deleteReward(id);
  } catch (e) {
    error = catalogErrorMessage(e);
  }
  revalidateCatalog();
  if (error) redirect(`/admin?error=${encodeURIComponent(error)}`);
}
