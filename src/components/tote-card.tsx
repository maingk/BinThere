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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 font-mono text-xs font-medium">
              {label}
            </span>
            <span className="truncate font-medium">
              {tote.name ?? "Not yet recorded"}
            </span>
          </div>
          {tote.location ? (
            <p className="text-muted-foreground truncate text-sm">
              {tote.location}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {tote.categoryName ? (
            <Badge variant="secondary">{tote.categoryName}</Badge>
          ) : null}
          {typeof tote.itemCount === "number" ? (
            <span className="text-muted-foreground text-xs">
              {tote.itemCount} {tote.itemCount === 1 ? "item" : "items"}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
