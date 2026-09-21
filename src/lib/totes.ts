import type { ToteRow } from "@/lib/database.types";

/**
 * Sizes stocked at most US home-improvement stores. `value` is what gets
 * printed, so adding a size here is all it takes to support new stock.
 */
export const SIZE_PREFIXES = [
  { value: "5G", label: "5 gal — small" },
  { value: "12G", label: "12 gal" },
  { value: "17G", label: "17 gal" },
  { value: "27G", label: "27 gal" },
  { value: "45G", label: "45 gal — large" },
] as const;

export type SizePrefix = (typeof SIZE_PREFIXES)[number]["value"];

export const SIZE_VALUES = SIZE_PREFIXES.map((s) => s.value) as readonly string[];

/** Mirrors the database's totes_size_prefix_format constraint. */
export const SIZE_PREFIX_PATTERN = /^[0-9]{1,3}[A-Z]{1,2}$/;

export interface ToteLabelParts {
  size_prefix: string;
  index_no: number;
}

/**
 * The label printed on the sticker, e.g. "17G-01". This is the tote's
 * identity: what the QR encodes, what a person reads off the lid, and what
 * they type into the lookup box.
 */
export function formatToteLabel(tote: ToteLabelParts): string {
  return `${tote.size_prefix}-${String(tote.index_no).padStart(2, "0")}`;
}

/** Label plus name, for list rows and page headings. */
export function toteDisplayName(
  tote: ToteLabelParts & Pick<ToteRow, "name">,
): string {
  const label = formatToteLabel(tote);
  return tote.name ? `${label} · ${tote.name}` : label;
}

/**
 * Parses a label a person typed or that arrived in a URL. Forgiving about
 * punctuation and case, so "17G-01", "17g 1" and "17G1" all parse, matching
 * find_tote_by_label() in the database.
 */
export function parseToteLabel(input: string): ToteLabelParts | null {
  const cleaned = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const match = cleaned.match(/^([0-9]{1,3}[A-Z]{1,2})([0-9]{1,3})$/);
  if (!match) return null;

  const index_no = Number(match[2]);
  if (!Number.isInteger(index_no) || index_no < 1 || index_no > 999) return null;

  return { size_prefix: match[1], index_no };
}

/**
 * Absolute URL encoded into a tote's QR label. The household slug scopes the
 * label, because "17G-01" is only unique within one household.
 */
export function toteScanUrl(
  householdSlug: string,
  tote: ToteLabelParts,
  origin: string,
): string {
  return `${origin.replace(/\/$/, "")}/t/${householdSlug}/${formatToteLabel(tote)}`;
}

export function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
