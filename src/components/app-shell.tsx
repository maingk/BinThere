import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/totes", label: "Totes" },
  { href: "/search", label: "Search" },
  { href: "/categories", label: "Categories" },
  { href: "/labels", label: "Labels" },
];

export function AppShell({
  householdName,
  children,
}: {
  householdName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            ToteNotes
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {householdName}
            </span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <nav className="mx-auto w-full max-w-3xl overflow-x-auto px-4 pb-2">
          <ul className="flex gap-1 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
