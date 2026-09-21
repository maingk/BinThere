import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ScanNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Unknown label</h1>
      <p className="text-muted-foreground text-sm">
        This QR code isn&apos;t one of your household&apos;s labels. If you just
        printed it, make sure you printed the sheet from this account.
      </p>
      <Button asChild>
        <Link href="/totes">Back to totes</Link>
      </Button>
    </main>
  );
}
