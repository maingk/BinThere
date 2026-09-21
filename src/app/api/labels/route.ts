import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { appOrigin } from "@/lib/totes";
import { buildLabelPdf, findSheet, type LabelTote } from "@/lib/labels";

/**
 * Streams a printable PDF of QR labels.
 * ?size=27G   restrict to one tote size; otherwise every unprinted label
 * ?sheet=     label stock id; ?copies= labels per tote (default 2)
 */
export async function GET(request: NextRequest) {
  const session = await requireSession();
  const supabase = await createClient();

  const { searchParams } = request.nextUrl;
  const sheet = findSheet(searchParams.get("sheet"));
  const copies = Math.min(
    Math.max(Number(searchParams.get("copies") ?? 2) || 2, 1),
    6,
  );
  const size = searchParams.get("size");

  // RLS keeps this to the caller's household.
  let query = supabase
    .from("totes")
    .select("size_prefix, index_no, name")
    .eq("status", "unclaimed")
    .order("size_prefix")
    .order("index_no");

  if (size) query = query.eq("size_prefix", size.toUpperCase());

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data?.length) {
    return NextResponse.json(
      { error: "No labels to print. Reserve some first." },
      { status: 404 },
    );
  }

  const pdf = await buildLabelPdf({
    totes: data as LabelTote[],
    householdSlug: session.household.slug,
    origin: appOrigin(),
    sheet,
    copies,
  });

  return new NextResponse(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="binthere-labels.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
