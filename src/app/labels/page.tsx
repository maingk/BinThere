import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { LabelStudio } from "@/app/labels/label-studio";
import { SHEETS } from "@/lib/labels";
import { formatToteLabel } from "@/lib/totes";

export const metadata = { title: "Labels" };

export default async function LabelsPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: unclaimed } = await supabase
    .from("totes")
    .select("size_prefix, index_no")
    .eq("status", "unclaimed")
    .order("size_prefix")
    .order("index_no");

  // Group the unprinted labels by size so each size prints as its own sheet.
  const bySize = new Map<string, string[]>();
  for (const tote of unclaimed ?? []) {
    const list = bySize.get(tote.size_prefix) ?? [];
    list.push(formatToteLabel(tote));
    bySize.set(tote.size_prefix, list);
  }

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Labels</h1>
          <p className="text-muted-foreground text-sm">
            Reserve a run of labels for a tote size, print the sheet, and stick
            one on each tote. Scanning an unused label opens the form to record
            what&apos;s inside.
          </p>
        </div>
        <LabelStudio
          sheets={SHEETS.map(({ id, name }) => ({ id, name }))}
          pending={[...bySize.entries()].map(([size, labels]) => ({
            size,
            labels,
          }))}
        />
      </div>
    </AppShell>
  );
}
