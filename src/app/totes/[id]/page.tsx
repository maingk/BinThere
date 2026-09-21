import Image from "next/image";
import { notFound } from "next/navigation";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { appOrigin, formatToteLabel, toteScanUrl } from "@/lib/totes";
import { toteQrDataUrl } from "@/lib/qr";
import { AppShell } from "@/components/app-shell";
import { ItemsSection } from "@/components/items-section";
import { ToteDetailsPanel } from "@/app/totes/[id]/details-panel";
import { Badge } from "@/components/ui/badge";
import type { ItemRow, ToteRow } from "@/lib/database.types";

export default async function ToteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: tote }, { data: items }, { data: categories }] =
    await Promise.all([
      supabase
        .from("totes")
        .select("*, categories(name)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("items")
        .select("*")
        .eq("tote_id", id)
        .order("created_at"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);

  if (!tote) notFound();

  const joined = tote as ToteRow & { categories: { name: string } | null };
  const label = formatToteLabel(joined);
  const origin = appOrigin();
  const qr = await toteQrDataUrl(joined.code, origin);

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {label ? (
                <span className="bg-secondary text-secondary-foreground rounded px-2 py-0.5 font-mono text-sm font-medium">
                  {label}
                </span>
              ) : null}
              {joined.categories?.name ? (
                <Badge variant="secondary">{joined.categories.name}</Badge>
              ) : null}
              {joined.status === "archived" ? (
                <Badge variant="outline">Archived</Badge>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {joined.name ?? "Unnamed tote"}
            </h1>
            {joined.location ? (
              <p className="text-muted-foreground text-sm">
                {joined.location}
              </p>
            ) : null}
            {joined.description ? (
              <p className="text-sm whitespace-pre-line">
                {joined.description}
              </p>
            ) : null}
          </div>
          <a
            href={toteScanUrl(joined.code, origin)}
            className="shrink-0 text-center"
            title={joined.code}
          >
            <Image
              src={qr}
              alt={`QR code for tote ${joined.code}`}
              width={88}
              height={88}
              className="rounded border bg-white p-1"
              unoptimized
            />
            <span className="text-muted-foreground mt-1 block font-mono text-[10px] tracking-widest">
              {joined.code}
            </span>
          </a>
        </header>

        <ItemsSection toteId={joined.id} items={(items ?? []) as ItemRow[]} />

        <ToteDetailsPanel
          tote={joined}
          categories={categories ?? []}
        />
      </div>
    </AppShell>
  );
}
