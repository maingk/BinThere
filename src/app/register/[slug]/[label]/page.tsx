import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { formatToteLabel, parseToteLabel } from "@/lib/totes";
import { AppShell } from "@/components/app-shell";
import { ToteForm } from "@/components/tote-form";
import { claimToteAction } from "@/app/totes/actions";

export const metadata = { title: "Register tote" };

export default async function RegisterPage({
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
  if (tote.status !== "unclaimed") redirect(`/totes/${tote.id}`);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="bg-secondary text-secondary-foreground inline-block rounded px-2 py-0.5 font-mono text-sm font-medium">
            {formatToteLabel(parts)}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            What&apos;s in this tote?
          </h1>
          <p className="text-muted-foreground text-sm">
            This sticker hasn&apos;t been used yet. Give the tote a name, then
            start listing what&apos;s inside.
          </p>
        </div>
        <ToteForm
          action={claimToteAction.bind(null, tote.id)}
          categories={categories ?? []}
          tote={parts}
          submitLabel="Save tote"
          lockLabel
        />
      </div>
    </AppShell>
  );
}
