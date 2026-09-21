import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

/**
 * Runs before every page: refreshes the Supabase session cookie and bounces
 * signed-out visitors to /login, preserving where they were headed.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static assets, so every page
     * gets a refreshed session cookie.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
