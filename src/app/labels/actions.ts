"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null; minted?: number };

/** Creates blank, unclaimed codes ready to be printed and stuck on totes. */
export async function mintCodesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const count = Number(formData.get("count"));

  if (!Number.isInteger(count) || count < 1 || count > 200) {
    return { error: "Choose between 1 and 200 labels." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mint_tote_codes", {
    p_count: count,
  });

  if (error) return { error: error.message };

  revalidatePath("/labels");
  revalidatePath("/totes");
  return { error: null, minted: data?.length ?? count };
}
