import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/app/login/login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(next ?? "/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">BinThere</h1>
        <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
          ToteNotes
        </p>
        <p className="text-muted-foreground text-sm">
          Know what&apos;s in the basement without opening a single lid.
        </p>
      </div>
      <LoginForm next={next} />
    </main>
  );
}
