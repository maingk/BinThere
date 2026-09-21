import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopNav } from "@/components/desktop-nav";

export function AppShell({
  householdName,
  children,
}: {
  householdName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="glass-nav sticky top-0 z-20 border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            BinThere
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
        <DesktopNav />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-6">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
