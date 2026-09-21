import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { HouseholdRow, ProfileRow } from "@/lib/database.types";

export interface Session {
  userId: string;
  email: string | null;
  profile: ProfileRow;
  household: HouseholdRow;
}

/**
 * Every signed-in page needs a user *and* a household. Users who have
 * verified their email but not yet joined a household land on /onboarding.
 */
export async function requireSession(): Promise<Session> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.household_id) redirect("/onboarding");

  const { data: household } = await supabase
    .from("households")
    .select("*")
    .eq("id", profile.household_id)
    .maybeSingle();

  if (!household) redirect("/onboarding");

  return {
    userId: user.id,
    email: user.email ?? null,
    profile,
    household,
  };
}
