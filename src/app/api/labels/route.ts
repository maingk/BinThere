import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/totes";
import { buildLabelPdf, findSheet, type LabelTote } from "@/lib/labels";

/**
 * Streams a printable PDF of QR labels.
 * ?codes=A,B,C  explicit codes; otherwise every unclaimed code.
 * ?sheet=       label stock id; ?copies= labels per tote (default 2).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const sheet = findSheet(searchParams.get("sheet"));
  const copies = Math.min(
    Math.max(Number(searchParams.get("copies") ?? 2) || 2, 1),
    6,
  );
  const codes = searchParams.get("codes")?.split(",").filter(Boolean);

  // RLS keeps this to the caller's household.
  let query = supabase
    .from("totes")
    .select("code, size_prefix, index_no, name")
    .order("created_at");

  query = codes?.length
    ? query.in("code", codes)
    : query.eq("status", "unclaimed");

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data?.length) {
    return NextResponse.json(
      { error: "No labels to print. Generate some blank codes first." },
      { status: 404 },
    );
  }

  const pdf = await buildLabelPdf({
    totes: data as LabelTote[],
    origin: appOrigin(),
    sheet,
    copies,
  });

  return new NextResponse(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="totenotes-labels.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
