import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { OfferLetter } from "../../types";
import {
  TOTAL_WIDTH,
  HALF_WIDTH,
  NAVY_COLOR,
  FONT_FAMILY,
  thinCardBorders,
  noBorder,
  noBorders,
} from "./offerLetterWordStyles";

export function buildOfferTermsTable(offer: OfferLetter, formattedExpiryDate: string): Table {
  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: thinCardBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            margins: { top: 90, bottom: 90, left: 130, right: 130 },
            borders: thinCardBorders,
            children: [
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({ text: "1. Probationary Period: ", bold: true, size: 18, font: FONT_FAMILY }),
                  new TextRun({
                    text: `Your employment is subject to a satisfactory probationary period of ${offer.probation_months} months. Prior to the end of this period, a performance appraisal will be conducted to confirm your ongoing employment status.`,
                    size: 18,
                    color: "334155",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({ text: "2. Compliance & Confidentiality: ", bold: true, size: 18, font: FONT_FAMILY }),
                  new TextRun({
                    text: "You will be required to adhere to all company policies, employee code of conduct, and maintain strict confidentiality regarding all proprietary information, client data, and business operations.",
                    size: 18,
                    color: "334155",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({ text: "3. Pre-Employment Requirements: ", bold: true, size: 18, font: FONT_FAMILY }),
                  new TextRun({
                    text: "This offer is conditional upon satisfactory submission of your national identification, verified educational credentials, and relevant reference checks prior to your start date.",
                    size: 18,
                    color: "334155",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: "4. Offer Validity: ", bold: true, size: 18, font: FONT_FAMILY }),
                  new TextRun({
                    text: "Please signify your acceptance of this offer by signing and returning this document no later than ",
                    size: 18,
                    color: "334155",
                    font: FONT_FAMILY,
                  }),
                  new TextRun({ text: formattedExpiryDate, bold: true, size: 18, color: NAVY_COLOR, font: FONT_FAMILY }),
                  new TextRun({ text: ".", size: 18, color: "334155", font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export function buildOfferFooterTable(buName: string, offerNumber?: string): Table {
  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: HALF_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            children: [
              new Paragraph({
                spacing: { before: 50, after: 0 },
                children: [
                  new TextRun({
                    text: `HRM_OPS Enterprise HRMS · ${buName}`,
                    size: 16,
                    color: "94A3B8",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: HALF_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 50, after: 0 },
                children: [
                  new TextRun({
                    text: `Confidential Employment Offer · Ref: ${offerNumber || "OFF-2026"} · Page 1 of 1`,
                    size: 16,
                    color: "94A3B8",
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
