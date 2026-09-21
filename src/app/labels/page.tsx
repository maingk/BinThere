import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { LabelStudio } from "@/app/labels/label-studio";
import { SHEETS } from "@/lib/labels";

export const metadata = { title: "Labels" };

export default async function LabelsPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: unclaimed } = await supabase
    .from("totes")
    .select("code, created_at")
    .eq("status", "unclaimed")
    .order("created_at");

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Labels</h1>
          <p className="text-muted-foreground text-sm">
            Generate blank QR codes, print the sheet, and stick one on each
            tote. Scanning a blank code opens the registration form.
          </p>
        </div>
        <LabelStudio
          sheets={SHEETS.map(({ id, name }) => ({ id, name }))}
          unclaimedCount={unclaimed?.length ?? 0}
          unclaimedCodes={(unclaimed ?? []).map((t) => t.code)}
        />
      </div>
    </AppShell>
  );
}
