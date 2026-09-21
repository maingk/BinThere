import QRCode from "qrcode";

import { toteScanUrl, type ToteLabelParts } from "@/lib/totes";

/** PNG data URL, for showing a tote's code on screen. */
export async function toteQrDataUrl(
  householdSlug: string,
  tote: ToteLabelParts,
  origin: string,
): Promise<string> {
  return QRCode.toDataURL(toteScanUrl(householdSlug, tote, origin), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
  });
}

/**
 * Module matrix for the printed label. pdf-lib has no QR support, so the
 * PDF draws the modules itself as vector squares — crisp at any size.
 */
export function toteQrMatrix(
  householdSlug: string,
  tote: ToteLabelParts,
  origin: string,
) {
  const qr = QRCode.create(toteScanUrl(householdSlug, tote, origin), {
    errorCorrectionLevel: "M",
  });
  const size = qr.modules.size;
  const data = qr.modules.data;
  return {
    size,
    isDark: (row: number, col: number) => data[row * size + col] === 1,
  };
}
