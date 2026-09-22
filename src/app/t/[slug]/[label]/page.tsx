import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { parseToteLabel } from "@/lib/totes";
import { ToteDetail } from "@/components/tote-detail";

/**
 * Landing point for every QR scan.
 *
 * A registered tote renders here rather than redirecting to /totes/<id>. The
 * redirect cost a second server round-trip and a blank frame, which is the
 * first thing anyone sees after pointing a camera at a sticker. Keeping the
 * URL also means the address bar matches what is printed on the lid.
 *
 * The slug scopes the lookup: "17G-01" is only unique within a household, so
 * scanning another household's sticker must miss rather than silently resolve
 * to your own tote of the same number.
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

  if (slug.toLowerCase() !== session.household.slug.toLowerCase()) notFound();

  const supabase = await createClient();
  const { data: tote } = await supabase
    .from("totes")
    .select("id, status")
    .eq("size_prefix", parts.size_prefix)
    .eq("index_no", parts.index_no)
    .maybeSingle();

  if (!tote) notFound();

  // An unused label is a different page, so this one still redirects.
  if (tote.status === "unclaimed") {
    redirect(`/register/${slug}/${label}`);
  }

  return <ToteDetail toteId={tote.id} session={session} />;
}
