import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
} from "docx";
import type { OfferLetter } from "../../types";
import {
  TOTAL_WIDTH,
  COL_LABEL_WIDTH,
  COL_VAL_WIDTH,
  NAVY_COLOR,
  TEXT_DARK,
  BG_LABEL,
  FONT_FAMILY,
  infoTableBorders,
  innerGridBorder,
  cellMargins,
} from "./offerLetterWordStyles";

export function buildOfferPositionTable(
  offer: OfferLetter,
  buName: string,
  formattedStartDate: string
): Table {
  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: infoTableBorders,
    rows: [
      // Row 1: Position Title | Business Unit
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Position Title:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: offer.job_title, bold: true, size: 19, color: NAVY_COLOR, font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Business Unit:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: buName, size: 19, color: TEXT_DARK, font: FONT_FAMILY })] })],
          }),
        ],
      }),
      // Row 2: Department | Reports To
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Department / Division:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${offer.department || "—"}${offer.division ? ` / ${offer.division}` : ""}`,
                    size: 19,
                    color: TEXT_DARK,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Reports Directly To:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [
              new Paragraph({
                children: [new TextRun({ text: offer.reporting_to || "Department Manager", bold: true, size: 19, color: TEXT_DARK, font: FONT_FAMILY })],
              }),
            ],
          }),
        ],
      }),
      // Row 3: Employment Type | Commencement Date
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Employment Type:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: offer.employment_type || "Full Time", size: 19, color: TEXT_DARK, font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Commencement Date:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [
              new Paragraph({
                children: [new TextRun({ text: formattedStartDate, bold: true, color: "059669", size: 19, font: FONT_FAMILY })],
              }),
            ],
          }),
        ],
      }),
      // Row 4: Working Schedule | Working Hours
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Working Schedule:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: offer.working_days || "Monday to Saturday Half", size: 19, color: TEXT_DARK, font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Working Hours:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: offer.working_time || "8:00 am – 5:00 pm", size: 19, color: TEXT_DARK, font: FONT_FAMILY })] })],
          }),
        ],
      }),
    ],
  });
}
