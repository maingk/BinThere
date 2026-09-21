import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { SearchBox } from "@/app/search/search-box";
import { formatToteLabel } from "@/lib/totes";
import { Badge } from "@/components/ui/badge";
import type { SearchResultRow } from "@/lib/database.types";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await requireSession();
  const query = q?.trim() ?? "";

  let results: SearchResultRow[] = [];
  let error: string | null = null;

  if (query.length >= 2) {
    const supabase = await createClient();
    const { data, error: rpcError } = await supabase.rpc("search_totes", {
      q: query,
    });
    results = (data ?? []) as SearchResultRow[];
    error = rpcError?.message ?? null;
  }

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
          <p className="text-muted-foreground text-sm">
            Find the tote an item is in — by item name, tote name, label,
            category or location.
          </p>
        </div>

        <SearchBox defaultValue={query} />

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        {query.length >= 2 ? (
          results.length > 0 ? (
            <ul className="space-y-2">
              {results.map((result) => {
                const label = formatToteLabel(result);
                return (
                  <li key={result.id}>
                    <Link
                      href={`/totes/${result.id}`}
                      className="hover:bg-accent/50 block rounded-lg border p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            {label ? (
                              <span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 font-mono text-xs font-medium">
                                {label}
                              </span>
                            ) : null}
                            <span className="truncate font-medium">
                              {result.name ?? "Unnamed tote"}
                            </span>
                          </div>
                          {result.matched_items.length > 0 ? (
                            <p className="text-muted-foreground text-sm">
                              Contains: {result.matched_items.join(", ")}
                            </p>
                          ) : null}
                          {result.location ? (
                            <p className="text-muted-foreground text-xs">
                              {result.location}
                            </p>
                          ) : null}
                        </div>
                        {result.category_name ? (
                          <Badge variant="secondary" className="shrink-0">
                            {result.category_name}
                          </Badge>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
              Nothing matches &ldquo;{query}&rdquo;.
            </p>
          )
        ) : null}
      </div>
    </AppShell>
  );
}
