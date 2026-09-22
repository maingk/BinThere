import Image from "next/image";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { appOrigin, formatToteLabel, toteScanUrl } from "@/lib/totes";
import { toteQrDataUrl } from "@/lib/qr";
import { AppShell } from "@/components/app-shell";
import { ItemsSection } from "@/components/items-section";
import { ToteDetailsPanel } from "@/components/tote-details-panel";
import { Badge } from "@/components/ui/badge";
import type { ItemRow, ToteRow } from "@/lib/database.types";
import type { Session } from "@/lib/auth";

/**
 * The tote page itself, shared by /totes/[id] and by the scan URL.
 *
 * A scan used to resolve the label, redirect, and load again -- two server
 * round-trips and a blank frame between them, which no amount of animation
 * would have covered up. The scan route renders this directly instead.
 */
export async function ToteDetail({
  toteId,
  session,
}: {
  toteId: string;
  session: Session;
}) {
  const supabase = await createClient();

  const [{ data: tote }, { data: items }, { data: categories }] =
    await Promise.all([
      supabase
        .from("totes")
        .select("*, categories(name)")
        .eq("id", toteId)
        .maybeSingle(),
      supabase
        .from("items")
        .select("*")
        .eq("tote_id", toteId)
        .order("created_at"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);

  if (!tote) notFound();

  const joined = tote as ToteRow & { categories: { name: string } | null };
  const label = formatToteLabel(joined);
  const origin = appOrigin();
  const slug = session.household.slug;
  const qr = await toteQrDataUrl(slug, joined, origin);

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-8">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {/*
                Named for the view transition: tapping this tote from a list
                morphs the chip from the row into this header, so the label is
                continuous across the navigation.
              */}
              <span
                style={{ viewTransitionName: `tote-label-${joined.id}` }}
                className="bg-secondary text-secondary-foreground rounded px-2 py-0.5 font-mono text-sm font-medium whitespace-nowrap tabular-nums"
              >
                {label}
              </span>
              {joined.categories?.name ? (
                <Badge variant="secondary">{joined.categories.name}</Badge>
              ) : null}
              {joined.status === "archived" ? (
                <Badge variant="outline">Archived</Badge>
              ) : null}
              {joined.status === "unclaimed" ? (
                <Badge variant="outline">Label not yet used</Badge>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {joined.name ?? "Not yet recorded"}
            </h1>
            {joined.location ? (
              <p className="text-muted-foreground text-sm">{joined.location}</p>
            ) : null}
            {joined.description ? (
              <p className="text-sm whitespace-pre-line">
                {joined.description}
              </p>
            ) : null}
          </div>
          <a
            href={toteScanUrl(slug, joined, origin)}
            className="shrink-0 text-center"
            title={label}
          >
            <Image
              src={qr}
              alt={`QR code for tote ${label}`}
              width={88}
              height={88}
              className="rounded border bg-white p-1"
              unoptimized
            />
            <span className="text-muted-foreground mt-1 block font-mono text-[0.625rem]">
              {label}
            </span>
          </a>
        </header>

        <ItemsSection toteId={joined.id} items={(items ?? []) as ItemRow[]} />

        <ToteDetailsPanel tote={joined} categories={categories ?? []} />
      </div>
    </AppShell>
  );
}
