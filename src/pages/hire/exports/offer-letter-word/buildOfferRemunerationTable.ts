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
  COL_SPAN3_WIDTH,
  NAVY_COLOR,
  TEXT_DARK,
  BG_LABEL,
  BG_HIGHLIGHT,
  FONT_FAMILY,
  infoTableBorders,
  innerGridBorder,
  cellMargins,
  formatCurrency,
} from "./offerLetterWordStyles";

export function buildOfferRemunerationTable(
  offer: OfferLetter,
  totalAllowances: number,
  totalPackage: number,
  isBasedOnQual: boolean
): Table {
  const baseSalaryDisplay = isBasedOnQual
    ? offer.base_salary > 0
      ? `${formatCurrency(offer.base_salary)} (Based on Qualification)`
      : "Based on Qualification"
    : formatCurrency(offer.base_salary);

  const remunerationRows = [
    // Row 1: Base Salary | Probation Period
    new TableRow({
      children: [
        new TableCell({
          width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
          shading: { fill: BG_LABEL },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [new Paragraph({ children: [new TextRun({ text: "Gross Base Monthly Salary:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
        }),
        new TableCell({
          width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [
            new Paragraph({
              children: [new TextRun({ text: baseSalaryDisplay, bold: true, color: "0284C7", size: 21, font: FONT_FAMILY })],
            }),
          ],
        }),
        new TableCell({
          width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
          shading: { fill: BG_LABEL },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [new Paragraph({ children: [new TextRun({ text: "Probation Period:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
        }),
        new TableCell({
          width: { size: COL_VAL_WIDTH, type: WidthType.DXA },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${offer.probation_months} Months ${offer.probation_salary ? `(${formatCurrency(offer.probation_salary)} during probation)` : ""}`,
                  bold: true,
                  size: 19,
                  color: TEXT_DARK,
                  font: FONT_FAMILY,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  // Optional Row: Monthly Allowances (if any)
  if (offer.allowances && offer.allowances.length > 0) {
    const allowanceParts: TextRun[] = [];
    offer.allowances.forEach((a, i) => {
      allowanceParts.push(
        new TextRun({ text: `${a.name}: `, bold: true, size: 18, font: FONT_FAMILY }),
        new TextRun({ text: `${formatCurrency(a.amount)}${i < offer.allowances.length - 1 ? "   ·   " : ""}`, size: 18, font: FONT_FAMILY })
      );
    });
    allowanceParts.push(
      new TextRun({ text: `   Total Allowances: ${formatCurrency(totalAllowances)}`, bold: true, color: NAVY_COLOR, size: 18, font: FONT_FAMILY })
    );

    remunerationRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
            shading: { fill: BG_LABEL },
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: [new TextRun({ text: "Monthly Allowances:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
          }),
          new TableCell({
            width: { size: COL_SPAN3_WIDTH, type: WidthType.DXA },
            columnSpan: 3,
            margins: cellMargins,
            borders: innerGridBorder,
            children: [new Paragraph({ children: allowanceParts })],
          }),
        ],
      })
    );
  }

  // Row: Total Monthly Package (Highlighted EEF2FF)
  remunerationRows.push(
    new TableRow({
      children: [
        new TableCell({
          width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
          shading: { fill: BG_HIGHLIGHT },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [new Paragraph({ children: [new TextRun({ text: "Total Monthly Package:", bold: true, size: 20, color: NAVY_COLOR, font: FONT_FAMILY })] })],
        }),
        new TableCell({
          width: { size: COL_SPAN3_WIDTH, type: WidthType.DXA },
          columnSpan: 3,
          shading: { fill: BG_HIGHLIGHT },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${formatCurrency(totalPackage)} / month`,
                  bold: true,
                  size: 23,
                  color: NAVY_COLOR,
                  font: FONT_FAMILY,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    // Row: Standard Benefits
    new TableRow({
      children: [
        new TableCell({
          width: { size: COL_LABEL_WIDTH, type: WidthType.DXA },
          shading: { fill: BG_LABEL },
          margins: cellMargins,
          borders: innerGridBorder,
          children: [new Paragraph({ children: [new TextRun({ text: "Standard Benefits:", bold: true, size: 19, color: "1E293B", font: FONT_FAMILY })] })],
        }),
        new TableCell({
          width: { size: COL_SPAN3_WIDTH, type: WidthType.DXA },
          columnSpan: 3,
          margins: cellMargins,
          borders: innerGridBorder,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    offer.benefits_summary ||
                    "Health & accident insurance coverage, 18 days annual paid leave, paid public holidays in accordance with Cambodia Labor Law, and annual performance evaluation.",
                  size: 18,
                  color: "334155",
                  font: FONT_FAMILY,
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: infoTableBorders,
    rows: remunerationRows,
  });
}
