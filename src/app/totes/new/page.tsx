import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ToteForm } from "@/components/tote-form";
import { createToteAction } from "@/app/totes/actions";

export const metadata = { title: "Add tote" };

export default async function NewTotePage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Add a tote</h1>
          <p className="text-muted-foreground text-sm">
            For a tote you&apos;re cataloguing before its sticker exists. This
            reserves the next label for the size you pick; print it later from
            the Labels page.
          </p>
        </div>
        <ToteForm
          action={createToteAction}
          categories={categories ?? []}
          submitLabel="Create tote"
        />
      </div>
    </AppShell>
  );
}
