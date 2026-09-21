import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";

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

/** QR spec requires a 4-module quiet zone; without it scanners often fail. */
const QUIET_MODULES = 4;

interface TextLine {
  text: string;
  size: number;
  font: PDFFont;
  color: ReturnType<typeof rgb>;
  /** Extra space above this line. */
  leadBefore: number;
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

      const padding = in2pt(0.08);
      const innerW = sheet.labelWidth - padding * 2;
      const innerH = sheet.labelHeight - padding * 2;

      /*
       * Wide stock (2x4) reads best with the QR beside the text; square stock
       * has no room for a text column, so the text stacks underneath.
       */
      const sideBySide = sheet.labelWidth / sheet.labelHeight >= 1.5;

      const label = formatToteLabel(tote);
      const titleSize = label ? (sideBySide ? 26 : 14) : sideBySide ? 13 : 7.5;

      const lines: TextLine[] = [
        {
          text: label ?? "SCAN TO SET UP",
          size: titleSize,
          font: bold,
          color: rgb(0, 0, 0),
          leadBefore: 0,
        },
      ];

      if (tote.name) {
        lines.push({
          text: tote.name,
          size: sideBySide ? 9 : 7,
          font: regular,
          color: rgb(0.25, 0.25, 0.25),
          leadBefore: in2pt(0.045),
        });
      }

      lines.push({
        text: tote.code,
        size: 6.5,
        font: regular,
        color: rgb(0.55, 0.55, 0.55),
        leadBefore: in2pt(0.035),
      });

      const textHeight = lines.reduce(
        (total, line) => total + line.leadBefore + line.size,
        0,
      );
      const textGap = in2pt(0.06);

      // The QR takes whatever the text block leaves behind.
      const qrBox = sideBySide
        ? innerH
        : Math.max(in2pt(0.6), Math.min(innerW, innerH - textHeight - textGap));

      const qrX = sideBySide ? x + padding : x + (sheet.labelWidth - qrBox) / 2;
      const qrY = sideBySide
        ? y + (sheet.labelHeight - qrBox) / 2
        : y + sheet.labelHeight - padding - qrBox;

      drawQr(page, tote.code, origin, qrX, qrY, qrBox);

      const textLeft = sideBySide ? qrX + qrBox + in2pt(0.12) : x + padding;
      const textWidth = sideBySide
        ? x + sheet.labelWidth - padding - textLeft
        : innerW;

      // Start at the top of the text block and walk down by baseline.
      let cursorY = sideBySide
        ? y + (sheet.labelHeight + textHeight) / 2
        : qrY - textGap;

      for (const line of lines) {
        cursorY -= line.leadBefore + line.size;
        const text = truncate(line.text, line.font, line.size, textWidth);
        const lineX = sideBySide
          ? textLeft
          : x +
            (sheet.labelWidth - line.font.widthOfTextAtSize(text, line.size)) /
              2;
        page.drawText(text, {
          x: lineX,
          y: cursorY,
          size: line.size,
          font: line.font,
          color: line.color,
        });
      }
    });
  }

  return pdf.save();
}

/** Draws the QR, quiet zone included, fitted to a `box` square at (x, y). */
function drawQr(
  page: PDFPage,
  code: string,
  origin: string,
  x: number,
  y: number,
  box: number,
) {
  const matrix = toteQrMatrix(code, origin);
  const cell = box / (matrix.size + QUIET_MODULES * 2);
  const offset = QUIET_MODULES * cell;

  // A white backing guarantees the quiet zone even on tinted label stock.
  page.drawRectangle({
    x,
    y,
    width: box,
    height: box,
    color: rgb(1, 1, 1),
  });

  for (let r = 0; r < matrix.size; r += 1) {
    for (let c = 0; c < matrix.size; c += 1) {
      if (!matrix.isDark(r, c)) continue;
      page.drawRectangle({
        x: x + offset + c * cell,
        // QR rows run top-down; PDF y runs bottom-up.
        y: y + offset + (matrix.size - 1 - r) * cell,
        width: cell,
        height: cell,
        color: rgb(0, 0, 0),
      });
    }
  }
}

function truncate(
  text: string,
  font: PDFFont,
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
