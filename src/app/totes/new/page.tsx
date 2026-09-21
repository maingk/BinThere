import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ToteForm } from "@/components/tote-form";
import { createToteAction } from "@/app/totes/actions";

export const metadata = { title: "Add tote" };

export default async function NewTotePage() {
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: categories }, { data: suggestedIndex }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.rpc("next_tote_index", { p_size_prefix: "M" }),
  ]);

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Add a tote</h1>
          <p className="text-muted-foreground text-sm">
            This mints a fresh QR code you can print later from the Labels page.
          </p>
        </div>
        <ToteForm
          action={createToteAction}
          categories={categories ?? []}
          submitLabel="Create tote"
          suggestedIndex={suggestedIndex ?? 1}
        />
      </div>
    </AppShell>
  );
}
