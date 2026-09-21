"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { SIZE_VALUES } from "@/lib/totes";

export type ActionState = { error: string | null; ok?: boolean };

/** Form selects submit a sentinel rather than "" for "no choice". */
const NO_CATEGORY = "__none__";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && (v.trim() === "" || v === NO_CATEGORY) ? null : v;

const toteDetailsSchema = z.object({
  size_prefix: z.enum(SIZE_VALUES as [string, ...string[]]),
  index_no: z.coerce.number().int().min(1).max(9999),
  name: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
  category_id: z.preprocess(emptyToNull, z.uuid().nullable()),
  description: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable()),
  location: z.preprocess(emptyToNull, z.string().trim().max(120).nullable()),
});

function parseToteDetails(formData: FormData) {
  return toteDetailsSchema.safeParse({
    size_prefix: formData.get("size_prefix"),
    index_no: formData.get("index_no"),
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    location: formData.get("location"),
  });
}

/** Duplicate label (size + index) is the one error worth phrasing nicely. */
function friendlyError(message: string): string {
  if (message.includes("totes_label_key")) {
    return "Another tote already uses that size and number.";
  }
  return message;
}

/** Turns a scanned, unclaimed code into a real tote. */
export async function claimToteAction(
  code: string,
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
    .eq("code", code)
    .eq("status", "unclaimed")
    .select("id")
    .maybeSingle();

  if (error) return { error: friendlyError(error.message) };
  if (!data) return { error: "That code has already been registered." };

  revalidatePath("/totes");
  redirect(`/totes/${data.id}`);
}

/** Manual creation, for totes whose label hasn't been printed yet. */
export async function createToteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseToteDetails(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const session = await requireSession();
  const supabase = await createClient();

  const { data: minted, error: mintError } = await supabase
    .rpc("mint_tote_codes", { p_count: 1 })
    .select("id")
    .single();

  if (mintError) return { error: friendlyError(mintError.message) };

  const { data, error } = await supabase
    .from("totes")
    .update({
      ...parsed.data,
      status: "active",
      claimed_at: new Date().toISOString(),
      created_by: session.userId,
    })
    .eq("id", minted.id)
    .select("id")
    .single();

  if (error) return { error: friendlyError(error.message) };

  revalidatePath("/totes");
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

  if (error) return { error: friendlyError(error.message) };

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
