"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, House, QrCode, Search, Tags } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", Icon: House },
  { href: "/totes", label: "Totes", Icon: Boxes },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/categories", label: "Categories", Icon: Tags },
  { href: "/labels", label: "Labels", Icon: QrCode },
] as const;

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
        "fixed inset-x-0 bottom-0 z-30 sm:hidden",
        "bg-background/85 border-t backdrop-blur-lg backdrop-saturate-150",
        // Clears the iOS home indicator; needs viewportFit: "cover" to be set.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="flex items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // Tall enough to hit comfortably without looking at it.
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2",
                  "transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5 shrink-0", active && "stroke-[2.5]")}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-[10px] leading-none",
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
