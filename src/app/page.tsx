import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ToteCard } from "@/components/tote-card";
import { ToteLookup } from "@/components/tote-lookup";
import { Button } from "@/components/ui/button";
import type { ToteRow } from "@/lib/database.types";

export default async function HomePage() {
  const session = await requireSession();
  const supabase = await createClient();

  const [activeCount, unclaimedCount, itemCount, recent] = await Promise.all([
    supabase
      .from("totes")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("totes")
      .select("id", { count: "exact", head: true })
      .eq("status", "unclaimed"),
    supabase.from("items").select("id", { count: "exact", head: true }),
    supabase
      .from("totes")
      .select("*, categories(name), items(count)")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Totes", value: activeCount.count ?? 0, href: "/totes" },
    { label: "Items", value: itemCount.count ?? 0, href: "/search" },
    {
      label: "Unused labels",
      value: unclaimedCount.count ?? 0,
      href: "/labels",
    },
  ];

  return (
    <AppShell householdName={session.household.name}>
      <div className="space-y-8">
        <section className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {session.household.name}
          </h1>
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="hover:bg-accent/50 rounded-lg border p-4 transition-colors"
              >
                <p className="text-2xl font-semibold tabular-nums">
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-xs">{stat.label}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-medium">Type a label</h2>
          <ToteLookup />
          <p className="text-muted-foreground text-xs">
            The label printed under the QR code on every sticker.
          </p>
        </section>

        <section className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/search">Find something</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/totes/new">Add a tote</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/labels">Print labels</Link>
          </Button>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium">Recently updated</h2>
            <Link
              href="/totes"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              See all
            </Link>
          </div>
          {recent.data && recent.data.length > 0 ? (
            <ul className="space-y-2">
              {recent.data.map((tote) => {
                const joined = tote as ToteRow & {
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
              <p className="font-medium">Nothing catalogued yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Print a sheet of QR labels, stick one on a tote, and scan it
                with your phone camera.
              </p>
              <Button asChild className="mt-4">
                <Link href="/labels">Start with labels</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="text-muted-foreground rounded-lg border p-4 text-sm">
          <p className="text-foreground font-medium">Invite your family</p>
          <p className="mt-1">
            Share this code so they can join the household from the sign-in
            screen:
          </p>
          <p className="text-foreground mt-2 font-mono text-base">
            {session.household.invite_code}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
