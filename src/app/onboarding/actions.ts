"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  householdName: z.string().trim().min(1, "Give your household a name").max(80),
  displayName: z.string().trim().max(80).optional(),
});

const joinSchema = z.object({
  inviteCode: z.string().trim().min(4, "Enter the invite code").max(40),
  displayName: z.string().trim().max(80).optional(),
});

export type ActionState = { error: string | null };

export async function createHouseholdAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createSchema.safeParse({
    householdName: formData.get("householdName"),
    displayName: formData.get("displayName") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_household", {
    p_name: parsed.data.householdName,
    p_display_name: parsed.data.displayName ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function joinHouseholdAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = joinSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    displayName: formData.get("displayName") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_household", {
    p_invite_code: parsed.data.inviteCode,
    p_display_name: parsed.data.displayName ?? null,
  });

  if (error) {
    return {
      error: /invalid invite/i.test(error.message)
        ? "That invite code doesn't match a household."
        : error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
