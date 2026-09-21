import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { OnboardingForms } from "@/app/onboarding/onboarding-forms";

export const metadata = { title: "Set up" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.household_id) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          One more step
        </h1>
        <p className="text-muted-foreground text-sm">
          Totes belong to a household. Start one, or join the household someone
          else already set up.
        </p>
      </div>
      <OnboardingForms />
    </main>
  );
}
