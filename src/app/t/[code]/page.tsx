import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

/**
 * Landing point for every QR scan. Resolves the printed code to either the
 * tote's page or the registration form, so a scan is one hop for the user.
 */
export default async function ScanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  await requireSession();

  const supabase = await createClient();
  const { data: tote } = await supabase
    .from("totes")
    .select("id, status")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (!tote) notFound();
  if (tote.status === "unclaimed") redirect(`/register/${code.toUpperCase()}`);

  redirect(`/totes/${tote.id}`);
}
