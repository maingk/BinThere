"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActivePath } from "@/components/nav-items";

/**
 * Mobile navigation. A bottom bar rather than the desktop header row: this
 * app is used one-handed while wrangling a tote, so the targets need to be
 * within thumb reach and impossible to miss.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "glass-nav glass-nav-raised fixed inset-x-0 bottom-0 z-30 border-t sm:hidden",
        // Clears the iOS home indicator; needs viewportFit: "cover" to be set.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="mx-auto flex w-full max-w-3xl items-stretch">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActivePath(href, pathname);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // Tall enough to hit comfortably without looking at it.
                  "press flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2",
                  active
                    ? "text-primary"
                    : "text-foreground/70 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5 shrink-0", active && "stroke-[2.5]")}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-[0.625rem] leading-none",
                    active && "font-semibold",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
