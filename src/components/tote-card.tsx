import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatToteLabel } from "@/lib/totes";
import type { ToteRow } from "@/lib/database.types";

export interface ToteCardData
  extends Pick<
    ToteRow,
    "id" | "name" | "size_prefix" | "index_no" | "location" | "description"
  > {
  categoryName?: string | null;
  itemCount?: number;
}

export function ToteCard({ tote }: { tote: ToteCardData }) {
  const label = formatToteLabel(tote);

  return (
    <Link
      href={`/totes/${tote.id}`}
      className="hover:bg-accent/50 block rounded-lg border p-4 transition-colors"
    >
      {/*
        Two rows, not one. At 375px a single row had to share width between the
        label, the name, a category badge and a count -- the label wrapped mid
        code ("17G-" / "01") and names truncated after a word or two. The name
        now owns the first row; everything secondary sits on the second.
      */}
      <div className="flex items-baseline gap-2">
        <span className="bg-secondary text-secondary-foreground shrink-0 rounded px-1.5 py-0.5 font-mono text-xs font-medium whitespace-nowrap tabular-nums">
          {label}
        </span>
        <span className="truncate font-medium">
          {tote.name ?? "Not yet recorded"}
        </span>
      </div>

      <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {tote.categoryName ? (
          <Badge variant="secondary" className="font-normal">
            {tote.categoryName}
          </Badge>
        ) : null}
        {tote.location ? (
          <span className="truncate">{tote.location}</span>
        ) : null}
        {typeof tote.itemCount === "number" ? (
          <span className="ml-auto shrink-0 tabular-nums">
            {tote.itemCount} {tote.itemCount === 1 ? "item" : "items"}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
