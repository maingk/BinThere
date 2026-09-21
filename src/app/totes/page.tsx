import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ToteCard } from "@/components/tote-card";
import { Button } from "@/components/ui/button";
import { ToteFilters } from "@/app/totes/tote-filters";

export const metadata = { title: "Totes" };

export default async function TotesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const { category, status } = await searchParams;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  let query = supabase
    .from("totes")
    .select("*, categories(name), items(count)")
    .order("size_prefix", { nullsFirst: false })
    .order("index_no");

  query =
    status === "archived"
      ? query.eq("status", "archived")
      : status === "unclaimed"
        ? query.eq("status", "unclaimed")
        : query.eq("status", "active");

  if (category) query = query.eq("category_id", category);

  const { data: totes, error } = await query;

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Totes</h1>
          <Button asChild size="sm">
            <Link href="/totes/new">Add tote</Link>
          </Button>
        </div>

        <ToteFilters
          categories={categories ?? []}
          activeCategory={category}
          activeStatus={status ?? "active"}
        />

        {error ? (
          <p className="text-destructive text-sm">{error.message}</p>
        ) : null}

        {totes && totes.length > 0 ? (
          <ul className="space-y-2">
            {totes.map((tote) => {
              const joined = tote as typeof tote & {
                categories: { name: string } | null;
                items: { count: number }[];
              };
              return (
                <li key={tote.id}>
                  <ToteCard
                    tote={{
                      ...tote,
                      categoryName: joined.categories?.name ?? null,
                      itemCount: joined.items?.[0]?.count ?? 0,
                    }}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">No totes here yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Print a sheet of labels, stick one on a tote, and scan it with
              your phone.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/labels">Print labels</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
