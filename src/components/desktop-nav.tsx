"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActivePath } from "@/components/nav-items";

/**
 * Top-bar navigation, tablet and up.
 *
 * Inactive links sit at foreground/70 rather than muted-foreground: muted is
 * tuned for supporting prose, and at navigation size it reads as disabled --
 * which is how the whole menu came to be overlooked.
 */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="mx-auto hidden w-full max-w-3xl overflow-x-auto px-4 pb-2 sm:block"
    >
      <ul className="flex gap-1 text-sm">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActivePath(href, pathname);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
