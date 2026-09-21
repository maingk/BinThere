import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ToteForm } from "@/components/tote-form";
import { claimToteAction } from "@/app/totes/actions";

export const metadata = { title: "Register tote" };

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const session = await requireSession();
  const supabase = await createClient();

  const { data: tote } = await supabase
    .from("totes")
    .select("id, status")
    .eq("code", code)
    .maybeSingle();

  if (!tote) notFound();
  if (tote.status !== "unclaimed") redirect(`/totes/${tote.id}`);

  const [{ data: categories }, { data: suggestedIndex }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.rpc("next_tote_index", { p_size_prefix: "M" }),
  ]);

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            {code}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Register this tote
          </h1>
          <p className="text-muted-foreground text-sm">
            This label hasn&apos;t been used yet. Give the tote a size, number
            and name, then start listing what&apos;s inside.
          </p>
        </div>
        <ToteForm
          action={claimToteAction.bind(null, code)}
          categories={categories ?? []}
          submitLabel="Register tote"
          suggestedIndex={suggestedIndex ?? 1}
        />
      </div>
    </AppShell>
  );
}
