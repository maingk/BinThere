import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { parseToteLabel } from "@/lib/totes";

/**
 * Landing point for every QR scan. Resolves the printed label to either the
 * tote's page or the registration form, so a scan is one hop for the user.
 *
 * The slug scopes the lookup: "17G-01" is only unique within a household, so
 * scanning another household's sticker must miss rather than silently resolve
 * to your own tote with the same number.
 */
export default async function ScanPage({
  params,
}: {
  params: Promise<{ slug: string; label: string }>;
}) {
  const { slug, label } = await params;
  const session = await requireSession();

  const parts = parseToteLabel(decodeURIComponent(label));
  if (!parts) notFound();

  // A sticker from someone else's household is not ours to resolve.
  if (slug.toLowerCase() !== session.household.slug.toLowerCase()) notFound();

  const supabase = await createClient();
  const { data: tote } = await supabase
    .from("totes")
    .select("id, status")
    .eq("size_prefix", parts.size_prefix)
    .eq("index_no", parts.index_no)
    .maybeSingle();

  if (!tote) notFound();
  if (tote.status === "unclaimed") {
    redirect(`/register/${slug}/${label}`);
  }

  redirect(`/totes/${tote.id}`);
}
