import { BorderStyle } from "docx";

export const TOTAL_WIDTH = 10700;

export const solidBorder = {
  style: BorderStyle.SINGLE,
  size: 4, // 0.5 pt
  color: "111111",
};

export const borders = {
  top: solidBorder,
  bottom: solidBorder,
  left: solidBorder,
  right: solidBorder,
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
  top: 70, // ~3.5 pt
  bottom: 70,
  left: 90, // ~4.5 pt
  right: 90,
};

export function getLogoBuffer(logoBase64: string): Uint8Array | null {
  try {
    const raw = logoBase64;
    const base64Clean = raw.replace(/^data:image\/\w+;base64,/, "");
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
