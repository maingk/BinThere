import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { toteQrMatrix } from "@/lib/qr";
import { formatToteLabel } from "@/lib/totes";
import type { ToteRow } from "@/lib/database.types";

const PT_PER_INCH = 72;
const in2pt = (inches: number) => inches * PT_PER_INCH;

export interface SheetSpec {
  id: string;
  name: string;
  pageWidth: number;
  pageHeight: number;
  labelWidth: number;
  labelHeight: number;
  columns: number;
  rows: number;
  marginLeft: number;
  marginTop: number;
  gapX: number;
  gapY: number;
  /** Draw a hairline box around each label, for cutting by hand. */
  cutLines: boolean;
}

/**
 * Metrics follow Avery's published dimensions. Always run one test print on
 * plain paper and hold it against a label sheet before committing a sheet.
 */
export const SHEETS: SheetSpec[] = [
  {
    id: "avery-22806",
    name: 'Avery 22806 — 2" square, 12 per sheet',
    pageWidth: in2pt(8.5),
    pageHeight: in2pt(11),
    labelWidth: in2pt(2),
    labelHeight: in2pt(2),
    columns: 3,
    rows: 4,
    marginLeft: in2pt(0.75),
    marginTop: in2pt(0.5),
    gapX: in2pt(0.375),
    gapY: in2pt(0.5),
    cutLines: false,
  },
  {
    id: "avery-5163",
    name: 'Avery 5163 — 2" × 4", 10 per sheet',
    pageWidth: in2pt(8.5),
    pageHeight: in2pt(11),
    labelWidth: in2pt(4),
    labelHeight: in2pt(2),
    columns: 2,
    rows: 5,
    marginLeft: in2pt(0.15625),
    marginTop: in2pt(0.5),
    gapX: in2pt(0.1875),
    gapY: 0,
    cutLines: false,
  },
  {
    id: "plain",
    name: 'Plain paper — 2" squares with cut lines',
    pageWidth: in2pt(8.5),
    pageHeight: in2pt(11),
    labelWidth: in2pt(2),
    labelHeight: in2pt(2),
    columns: 3,
    rows: 4,
    marginLeft: in2pt(0.75),
    marginTop: in2pt(0.5),
    gapX: in2pt(0.375),
    gapY: in2pt(0.5),
    cutLines: true,
  },
];

export function findSheet(id: string | null | undefined): SheetSpec {
  return SHEETS.find((sheet) => sheet.id === id) ?? SHEETS[0];
}

export type LabelTote = Pick<ToteRow, "code" | "size_prefix" | "index_no" | "name">;

export interface LabelPdfOptions {
  totes: LabelTote[];
  origin: string;
  sheet: SheetSpec;
  /** Two per tote by default: one for the lid, one for the front. */
  copies?: number;
}

export async function buildLabelPdf({
  totes,
  origin,
  sheet,
  copies = 2,
}: LabelPdfOptions): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("ToteNotes labels");

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  const queue: LabelTote[] = [];
  for (const tote of totes) {
    for (let copy = 0; copy < copies; copy += 1) queue.push(tote);
  }

  const perPage = sheet.columns * sheet.rows;
  const pageCount = Math.max(1, Math.ceil(queue.length / perPage));

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const page = pdf.addPage([sheet.pageWidth, sheet.pageHeight]);
    const slice = queue.slice(pageIndex * perPage, (pageIndex + 1) * perPage);

    slice.forEach((tote, slot) => {
      const col = slot % sheet.columns;
      const row = Math.floor(slot / sheet.columns);

      const x = sheet.marginLeft + col * (sheet.labelWidth + sheet.gapX);
      // pdf-lib's origin is bottom-left; sheet metrics are measured from the top.
      const yTop =
        sheet.pageHeight -
        sheet.marginTop -
        row * (sheet.labelHeight + sheet.gapY);
      const y = yTop - sheet.labelHeight;

      if (sheet.cutLines) {
        page.drawRectangle({
          x,
          y,
          width: sheet.labelWidth,
          height: sheet.labelHeight,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 0.5,
        });
      }

      const padding = in2pt(0.12);
      const textBlock = in2pt(0.4);
      const qrSize = Math.min(
        sheet.labelHeight - padding * 2,
        sheet.labelWidth - padding * 2 - textBlock,
      );

      const matrix = toteQrMatrix(tote.code, origin);
      const cell = qrSize / matrix.size;
      const qrX = x + padding;
      const qrY = y + (sheet.labelHeight - qrSize) / 2;

      for (let r = 0; r < matrix.size; r += 1) {
        for (let c = 0; c < matrix.size; c += 1) {
          if (!matrix.isDark(r, c)) continue;
          page.drawRectangle({
            x: qrX + c * cell,
            // QR rows run top-down; PDF y runs bottom-up.
            y: qrY + (matrix.size - 1 - r) * cell,
            width: cell,
            height: cell,
            color: rgb(0, 0, 0),
          });
        }
      }

      const textX = qrX + qrSize + in2pt(0.08);
      const textWidth = x + sheet.labelWidth - padding - textX;
      const label = formatToteLabel(tote);
      let cursorY = y + sheet.labelHeight / 2 + in2pt(0.16);

      page.drawText(label ?? "NEW", {
        x: textX,
        y: cursorY,
        size: label ? 16 : 11,
        font: bold,
        color: rgb(0, 0, 0),
      });

      cursorY -= in2pt(0.2);
      page.drawText(tote.code, {
        x: textX,
        y: cursorY,
        size: 7,
        font: regular,
        color: rgb(0.45, 0.45, 0.45),
      });

      if (tote.name) {
        cursorY -= in2pt(0.16);
        page.drawText(truncate(tote.name, regular, 7, textWidth), {
          x: textX,
          y: cursorY,
          size: 7,
          font: regular,
          color: rgb(0.25, 0.25, 0.25),
        });
      }
    });
  }

  return pdf.save();
}

function truncate(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number,
): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let result = text;
  while (
    result.length > 1 &&
    font.widthOfTextAtSize(`${result}…`, size) > maxWidth
  ) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}
