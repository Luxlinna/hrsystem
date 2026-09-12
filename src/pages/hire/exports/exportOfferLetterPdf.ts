import type { OfferLetter } from "../types";
import { generateOfferLetterHtml, escapeHtml } from "./offerLetterHtmlTemplate";

export { generateOfferLetterHtml };

export function exportOfferLetterPdf(
  offer: OfferLetter,
  buLogoCustom?: string,
  isHrDivisionContext?: boolean
): boolean {
  if (!offer) return false;
  try {
    const baseHtml = generateOfferLetterHtml(offer, buLogoCustom, isHrDivisionContext);
    const autoPrintScript = `
      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            try {
              window.focus();
              window.print();
            } catch {}
          }, 350);
        });
      </script>
    `;
    const printableHtml = baseHtml.replace("</body>", `${autoPrintScript}</body>`);
    const blob = new Blob([printableHtml], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
      return true;
    }
  } catch (err) {
    console.warn("PDF export window failed:", err);
  }
  return false;
}

export function previewOfferLetterHtml(
  offer: OfferLetter,
  buLogoCustom?: string,
  isHrDivisionContext?: boolean
): boolean {
  if (!offer) return false;
  try {
    const baseHtml = generateOfferLetterHtml(offer, buLogoCustom, isHrDivisionContext);

    const banner = `
    <div class="no-print" style="position: sticky; top: 0; z-index: 99999; background: #1e293b; color: #ffffff; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-weight: 800; font-size: 13.5px; color: #f8fafc; letter-spacing: -0.01em;">
          Formal Offer &amp; Acceptance Record — ${escapeHtml(offer.offer_number || "OFF-RECORD")}
        </span>
        <span style="background: #059669; color: white; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
          ${escapeHtml(offer.status || "Active")}
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 7px 16px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
          <span>🖨️ Print / Save as PDF</span>
        </button>
        <button onclick="window.close()" style="background: #475569; color: white; border: none; padding: 7px 14px; border-radius: 8px; font-weight: 600; font-size: 12px; cursor: pointer;">
          <span>✕ Close Tab</span>
        </button>
      </div>
    </div>
  `;

    const previewHtml = baseHtml.replace("<body>", `<body>${banner}`);
    const blob = new Blob([previewHtml], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);

    const previewWindow = window.open(blobUrl, "_blank");
    if (previewWindow) {
      previewWindow.focus();
      return true;
    }
  } catch (err) {
    console.warn("previewOfferLetterHtml encountered an issue:", err);
  }

  return false;
}
