import { BorderStyle } from "docx";

export const TOTAL_WIDTH = 10500; // dxa width for A4 page
export const HALF_WIDTH = 5250;
export const QUARTER_WIDTH = 2625;

export const solidBorder = {
  style: BorderStyle.SINGLE,
  size: 6, // 0.75 pt
  color: "000000",
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
};

export const cellMargins = {
  top: 100,
  bottom: 100,
  left: 120,
  right: 120,
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

export function formatOrdinalDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const day = d.getDate();
  const j = day % 10;
  const k = day % 100;
  let ord = "th";
  if (j === 1 && k !== 11) ord = "st";
  else if (j === 2 && k !== 12) ord = "nd";
  else if (j === 3 && k !== 13) ord = "rd";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}${ord} ${month} ${year}`;
}
