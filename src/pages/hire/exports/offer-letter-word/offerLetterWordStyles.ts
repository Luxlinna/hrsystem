import { BorderStyle, Paragraph, TextRun } from "docx";

export const TOTAL_WIDTH = 10000;
export const HALF_WIDTH = 5000;
export const COL_LABEL_WIDTH = 2800;
export const COL_VAL_WIDTH = 2200;
export const COL_SPAN3_WIDTH = 7200;

// Exact Brand Colors from PDF
export const NAVY_COLOR = "253C7D"; // #253C7D - Primary Brand Navy
export const TEXT_DARK = "0F172A"; // #0F172A - Deep charcoal body text
export const TEXT_MUTED = "475569"; // #475569 - Secondary text
export const TEXT_LIGHT_MUTED = "64748B"; // #64748B
export const BORDER_COLOR = "CBD5E1"; // #CBD5E1 - Cell grid border
export const BG_LABEL = "F1F5F9"; // #F1F5F9 - Label background
export const BG_HIGHLIGHT = "EEF2FF"; // #EEF2FF - Total package highlight
export const FONT_FAMILY = "Calibri";

export const outerNavyBorder = {
  style: BorderStyle.SINGLE,
  size: 12, // 1.5 pt solid navy
  color: NAVY_COLOR,
};

export const innerBorderSpec = {
  style: BorderStyle.SINGLE,
  size: 4, // 0.5 pt solid slate
  color: BORDER_COLOR,
};

export const innerGridBorder = {
  top: innerBorderSpec,
  bottom: innerBorderSpec,
  left: innerBorderSpec,
  right: innerBorderSpec,
};

export const infoTableBorders = {
  top: outerNavyBorder,
  bottom: outerNavyBorder,
  left: outerNavyBorder,
  right: outerNavyBorder,
  insideHorizontal: innerBorderSpec,
  insideVertical: innerBorderSpec,
};

export const thinCardBorders = {
  top: innerBorderSpec,
  bottom: innerBorderSpec,
  left: innerBorderSpec,
  right: innerBorderSpec,
};

export const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: "auto",
};

export const noBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
  insideHorizontal: noBorder,
  insideVertical: noBorder,
};

export const cellMargins = {
  top: 80,
  bottom: 80,
  left: 110,
  right: 110,
};

export function getLogoBuffer(logoBase64: string): Uint8Array | null {
  try {
    const base64Clean = logoBase64.replace(/^data:image\/\w+;base64,/, "");
    const binary = atob(base64Clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

export function formatCurrency(val?: number | null): string {
  if (val === null || val === undefined) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

export function createSectionHeading(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 140, after: 50 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 22,
        color: NAVY_COLOR,
        font: FONT_FAMILY,
      }),
    ],
  });
}
