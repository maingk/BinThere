"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { SIZE_VALUES, formatToteLabel } from "@/lib/totes";

export type ActionState = { error: string | null; ok?: boolean };

/** Form selects submit a sentinel rather than "" for "no choice". */
const NO_CATEGORY = "__none__";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && (v.trim() === "" || v === NO_CATEGORY) ? null : v;

/*
 * Note what is absent: size_prefix and index_no. A tote's printed label is
 * assigned once, when its sticker is minted, and is never editable — the
 * sticker is already on the lid and cannot be updated to match.
 */
const toteDetailsSchema = z.object({
  name: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  category_id: z.preprocess(emptyToNull, z.uuid().nullable()),
  description: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable()),
  location: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
});

function parseToteDetails(formData: FormData) {
  return toteDetailsSchema.safeParse({
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    location: formData.get("location"),
  });
}

/** Fills in a tote whose sticker is printed but whose contents are unrecorded. */
export async function claimToteAction(
  toteId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseToteDetails(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("totes")
    .update({
      ...parsed.data,
      status: "active",
      claimed_at: new Date().toISOString(),
    })
    .eq("id", toteId)
    .eq("status", "unclaimed")
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "That label has already been registered." };

  revalidatePath("/totes");
  redirect(`/totes/${data.id}`);
}

/**
 * Manual creation: mints the next label for the chosen size, then fills it in.
 * The sticker still needs printing from the Labels page.
 */
export async function createToteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const size = z
    .enum(SIZE_VALUES as [string, ...string[]])
    .safeParse(formData.get("size_prefix"));
  if (!size.success) return { error: "Pick a tote size." };

  const parsed = parseToteDetails(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  const { data: minted, error: mintError } = await supabase
    .rpc("mint_totes", { p_size_prefix: size.data, p_count: 1 })
    .select("id")
    .single();

  if (mintError) return { error: mintError.message };

  const { data, error } = await supabase
    .from("totes")
    .update({
      ...parsed.data,
      status: "active",
      claimed_at: new Date().toISOString(),
    })
    .eq("id", minted.id)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/totes");
  revalidatePath("/labels");
  redirect(`/totes/${data.id}`);
}

export async function updateToteAction(
  toteId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseToteDetails(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("totes")
    .update(parsed.data)
    .eq("id", toteId);

  if (error) return { error: error.message };

  revalidatePath(`/totes/${toteId}`);
  revalidatePath("/totes");
  return { error: null, ok: true };
}

/* The trailing FormData arg lets these be bound straight to a <form action>. */

export async function setToteStatusAction(
  toteId: string,
  status: "active" | "archived",
  _formData: FormData,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("totes").update({ status }).eq("id", toteId);
  revalidatePath(`/totes/${toteId}`);
  revalidatePath("/totes");
}

export async function deleteToteAction(
  toteId: string,
  _formData: FormData,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("totes").delete().eq("id", toteId);
  revalidatePath("/totes");
  redirect("/totes");
}

/** Resolves a label typed off a sticker, e.g. "17G-01". */
export async function lookupToteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = String(formData.get("label") ?? "").trim();
  if (!raw) return { error: "Type the label from the sticker, e.g. 17G-01." };

  const supabase = await createClient();
  const { data: toteId, error } = await supabase.rpc("find_tote_by_label", {
    p_label: raw,
  });

  if (error) return { error: error.message };
  if (!toteId) return { error: `No tote labelled “${raw}”.` };

  // A label that exists but has no contents recorded should land on the
  // registration form, exactly as scanning its sticker would.
  const { data: tote } = await supabase
    .from("totes")
    .select("status, size_prefix, index_no")
    .eq("id", toteId)
    .single();

  if (tote?.status === "unclaimed") {
    const { data: household } = await supabase
      .from("households")
      .select("slug")
      .single();
    if (household) {
      redirect(
        `/register/${household.slug}/${formatToteLabel(tote)}`,
      );
    }
  }

  redirect(`/totes/${toteId}`);
}

// --------------------------------------------------------------------- items

const itemSchema = z.object({
  name: z.string().trim().min(1, "Name the item").max(160),
  quantity: z.coerce.number().int().min(1).max(9999).default(1),
  notes: z.preprocess(emptyToNull, z.string().trim().max(500).nullable()),
});

export async function addItemAction(
  toteId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity") || 1,
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .insert({ tote_id: toteId, ...parsed.data });

  if (error) return { error: error.message };

  revalidatePath(`/totes/${toteId}`);
  return { error: null, ok: true };
}

export async function updateItemAction(
  itemId: string,
  toteId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity") || 1,
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update(parsed.data)
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath(`/totes/${toteId}`);
  return { error: null, ok: true };
}

export async function deleteItemAction(
  itemId: string,
  toteId: string,
  _formData: FormData,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("items").delete().eq("id", itemId);
  revalidatePath(`/totes/${toteId}`);
}
