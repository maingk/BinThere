import Link from "next/link";

import { ToteIllustration } from "@/components/tote-illustration";

export interface BannerStat {
  label: string;
  value: number;
  href: string;
}

/**
 * The Home screen's identity band: what this is, whose it is, and how much is
 * in it, answered before anything else on the page.
 *
 * It sits full-bleed against the shell's padding so it reads as a band rather
 * than a card, and the counts stay links -- they were the only way to reach
 * Totes, Search and Labels from here before the tab bar existed, and they are
 * still the fastest.
 */
export function HouseholdBanner({
  householdName,
  stats,
}: {
  householdName: string;
  stats: BannerStat[];
}) {
  return (
    <section className="bg-secondary -mx-4 -mt-6 mb-2 border-b px-4 py-4">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4">
        <ToteIllustration
          decorative
          scan
          instanceId="home-tote"
          className="h-16 w-auto shrink-0 sm:h-20"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground text-[0.625rem] font-bold tracking-[0.16em] uppercase">
            Household
          </span>
          <h1 className="text-xl leading-tight font-medium sm:text-2xl">
            {householdName}
          </h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="hover:text-foreground whitespace-nowrap underline-offset-4 hover:underline"
              >
                <span className="text-foreground font-medium tabular-nums">
                  {stat.value}
                </span>{" "}
                {stat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
