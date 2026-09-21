import QRCode from "qrcode";

import { toteScanUrl } from "@/lib/totes";

/** PNG data URL, for showing a tote's code on screen. */
export async function toteQrDataUrl(
  code: string,
  origin: string,
): Promise<string> {
  return QRCode.toDataURL(toteScanUrl(code, origin), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
  });
}

/**
 * Module matrix for the printed label. pdf-lib has no QR support, so the
 * PDF draws the modules itself as vector squares — crisp at any size.
 */
export function toteQrMatrix(code: string, origin: string) {
  const qr = QRCode.create(toteScanUrl(code, origin), {
    errorCorrectionLevel: "M",
  });
  const size = qr.modules.size;
  const data = qr.modules.data;
  return {
    size,
    isDark: (row: number, col: number) => data[row * size + col] === 1,
  };
}
