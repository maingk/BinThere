"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

export type ActionState = { error: string | null; ok?: boolean };

const schema = z.object({
  name: z.string().trim().min(1, "Name the category").max(60),
});

function friendly(message: string): string {
  return message.includes("categories_household_id_name_key")
    ? "You already have a category with that name."
    : message;
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const session = await requireSession();
  const supabase = await createClient();

  // New categories sort to the end of the existing list.
  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("categories").insert({
    household_id: session.household.id,
    name: parsed.data.name,
    sort_order: (last?.sort_order ?? 0) + 10,
  });

  if (error) return { error: friendly(error.message) };

  revalidatePath("/categories");
  revalidatePath("/totes");
  return { error: null, ok: true };
}

export async function renameCategoryAction(
  categoryId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name })
    .eq("id", categoryId);

  if (error) return { error: friendly(error.message) };

  revalidatePath("/categories");
  revalidatePath("/totes");
  return { error: null, ok: true };
}

/** Totes in a deleted category fall back to uncategorized, not deleted. */
export async function deleteCategoryAction(
  categoryId: string,
  _formData: FormData,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", categoryId);
  revalidatePath("/categories");
  revalidatePath("/totes");
}
