"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/lib/database.types";

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "unclaimed", label: "Unused labels" },
  { value: "archived", label: "Archived" },
];

function chipClass(active: boolean) {
  return cn(
    "inline-block rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
    active
      ? "bg-primary text-primary-foreground border-primary"
      : "text-muted-foreground hover:text-foreground",
  );
}

export function ToteFilters({
  categories,
  activeCategory,
  activeStatus,
}: {
  categories: CategoryRow[];
  activeCategory?: string;
  activeStatus: string;
}) {
  const href = (next: { category?: string; status?: string }) => {
    const params = new URLSearchParams();
    const category = "category" in next ? next.category : activeCategory;
    const status = next.status ?? activeStatus;
    if (category) params.set("category", category);
    if (status && status !== "active") params.set("status", status);
    const qs = params.toString();
    return qs ? `/totes?${qs}` : "/totes";
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((status) => (
          <Link
            key={status.value}
            href={href({ status: status.value })}
            className={chipClass(activeStatus === status.value)}
          >
            {status.label}
          </Link>
        ))}
      </div>
      {categories.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href={href({ category: undefined })}
            className={chipClass(!activeCategory)}
          >
            All categories
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={href({ category: category.id })}
              className={chipClass(activeCategory === category.id)}
            >
              {category.name}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
