import type { ToteRow } from "@/lib/database.types";

/** Size prefixes used on printed labels, smallest first. */
export const SIZE_PREFIXES = [
  { value: "XS", label: "XS — shoebox" },
  { value: "S", label: "S — small" },
  { value: "M", label: "M — medium" },
  { value: "L", label: "L — large" },
  { value: "XL", label: "XL — extra large" },
] as const;

export type SizePrefix = (typeof SIZE_PREFIXES)[number]["value"];

export const SIZE_VALUES = SIZE_PREFIXES.map((s) => s.value) as readonly string[];

/** "L-14" — the label a person reads off the tote. */
export function formatToteLabel(
  tote: Pick<ToteRow, "size_prefix" | "index_no">,
): string | null {
  if (!tote.size_prefix || tote.index_no == null) return null;
  return `${tote.size_prefix}-${String(tote.index_no).padStart(2, "0")}`;
}

/** Label plus name, falling back sensibly for half-filled totes. */
export function toteDisplayName(
  tote: Pick<ToteRow, "size_prefix" | "index_no" | "name" | "code">,
): string {
  const label = formatToteLabel(tote);
  if (label && tote.name) return `${label} · ${tote.name}`;
  return label ?? tote.name ?? tote.code;
}

/** Absolute URL encoded into a tote's QR label. */
export function toteScanUrl(code: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/t/${code}`;
}

export function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
