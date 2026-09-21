import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/app/login/login-form";
import { ToteIllustration } from "@/components/tote-illustration";

export const metadata = { title: "Sign in" };

/**
 * Turns Supabase's wording into something actionable. The PKCE case is the
 * one people actually hit: the sign-in form stores a verifier in the browser
 * that started it, so opening the emailed link in a *different* browser
 * cannot complete, and the raw message doesn't hint at that at all.
 */
function explainError(raw: string): { message: string; hint?: string } {
  if (raw === "missing_code") {
    return {
      message: "That sign-in link was incomplete.",
      hint: "Request a new one below.",
    };
  }
  if (/code verifier|both auth code/i.test(raw)) {
    return {
      message: "That link was opened in a different browser.",
      hint: "Request a new link below, then open it in this same browser — the sign-in has to finish where it started.",
    };
  }
  if (/expired|invalid/i.test(raw)) {
    return {
      message: "That link has expired or was already used.",
      hint: "Each link works once. Request a new one below.",
    };
  }
  return { message: raw };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(next ?? "/");

  const explained = error ? explainError(error) : null;

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-4 py-12">
      <div className="relative isolate w-full max-w-sm">
        {/*
          Anchored to the form rather than the viewport, so the tote stays
          tucked under it at any window height instead of drifting to the
          bottom of a tall screen. It runs off the frame below, cropped by
          the overflow-hidden on <main>.
        */}
        <ToteIllustration
          decorative
          scan
          instanceId="signin-tote"
          className="pointer-events-none absolute left-1/2 top-full -z-10 w-[min(155vw,680px)] max-w-none -translate-x-1/2 -translate-y-[14%] opacity-[0.55]"
        />

        <div className="flex flex-col gap-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">BinThere</h1>
            <p className="font-hand text-muted-foreground text-3xl">
              Notes for Your Totes
            </p>
          </div>

          {explained ? (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/5 space-y-1 rounded-lg border p-4 text-sm"
            >
              <p className="text-destructive font-medium">
                {explained.message}
              </p>
              {explained.hint ? (
                <p className="text-muted-foreground">{explained.hint}</p>
              ) : null}
            </div>
          ) : null}

          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
