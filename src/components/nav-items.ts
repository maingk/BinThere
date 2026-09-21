import { Boxes, FolderTree, House, QrCode, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

/**
 * One list for both navigations, so the phone tab bar and the desktop row can
 * never drift apart.
 *
 * Imported only by client components: lucide icons carry no "use client"
 * directive, so a server component cannot pass one across the boundary as a
 * prop.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", Icon: House },
  { href: "/totes", label: "Totes", Icon: Boxes },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/categories", label: "Categories", Icon: FolderTree },
  { href: "/labels", label: "Labels", Icon: QrCode },
];

/** "/" matches only itself; every other section matches its whole subtree. */
export function isActivePath(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
