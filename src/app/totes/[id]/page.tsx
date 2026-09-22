import { requireSession } from "@/lib/auth";
import { ToteDetail } from "@/components/tote-detail";

export default async function ToteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  return <ToteDetail toteId={id} session={session} />;
}
