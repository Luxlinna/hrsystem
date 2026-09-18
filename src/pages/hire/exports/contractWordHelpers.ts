import {
  Paragraph,
  TextRun,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

export function clean(text?: string | null): string {
  return text?.trim() || "—";
}

export function getLogoBuffer(logoBase64: string): Uint8Array | null {
  try {
    const base64Clean = logoBase64.replace(/^data:image\/\w+;base64,/, "");
    const binary = atob(base64Clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function cell(text: string, isLabel = false, widthDxa = 5000): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    shading: isLabel ? { fill: "F8FAFC" } : undefined,
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: isLabel,
            font: "Calibri",
            size: 20, // 10pt
            color: isLabel ? "475569" : "0F172A",
          }),
        ],
      }),
    ],
  });
}

export function row(label: string, value: string): TableRow {
  return new TableRow({
    children: [cell(label, true, 2800), cell(value, false, 7200)],
  });
}

export function sectionHeader(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        font: "Calibri",
        size: 22, // 11pt
        color: "253C7D",
      }),
    ],
  });
}
