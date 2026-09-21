"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { SIZE_VALUES, formatToteLabel } from "@/lib/totes";

export type ActionState = {
  error: string | null;
  /** Labels just reserved, e.g. ["27G-01", "27G-02"], for the success line. */
  minted?: string[];
};

const schema = z.object({
  size_prefix: z.enum(SIZE_VALUES as [string, ...string[]]),
  count: z.coerce.number().int().min(1).max(200),
});

/**
 * Reserves the next run of labels for a size. They exist as unclaimed totes
 * until someone scans one and records what's inside.
 */
export async function mintLabelsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schema.safeParse({
    size_prefix: formData.get("size_prefix"),
    count: formData.get("count"),
  });
  if (!parsed.success) {
    return { error: "Pick a size and a count between 1 and 200." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mint_totes", {
    p_size_prefix: parsed.data.size_prefix,
    p_count: parsed.data.count,
  });

  if (error) return { error: error.message };

  revalidatePath("/labels");
  revalidatePath("/totes");
  return {
    error: null,
    minted: (data ?? []).map((t) => formatToteLabel(t)),
  };
}
