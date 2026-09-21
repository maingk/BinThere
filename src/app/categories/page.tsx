import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CategoryManager } from "@/app/categories/category-manager";
import type { CategoryRow } from "@/lib/database.types";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, totes(count)")
    .order("sort_order");

  const rows = (categories ?? []).map((category) => {
    const joined = category as CategoryRow & { totes: { count: number }[] };
    return { ...category, toteCount: joined.totes?.[0]?.count ?? 0 };
  });

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">
            Group totes so the list stays browsable. Deleting a category leaves
            its totes uncategorized.
          </p>
        </div>
        <CategoryManager categories={rows} />
      </div>
    </AppShell>
  );
}
