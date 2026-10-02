import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  BorderStyle,
} from "docx";
import type { OfferLetter } from "../../types";
import {
  TOTAL_WIDTH,
  NAVY_COLOR,
  TEXT_DARK,
  TEXT_MUTED,
  FONT_FAMILY,
} from "./offerLetterWordStyles";

export function buildOfferSalutationTable(offer: OfferLetter, buName: string): Table {
  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 28, color: NAVY_COLOR },
      top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            shading: { fill: "F8FAFC" },
            margins: { top: 90, bottom: 90, left: 140, right: 140 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 30 },
                children: [
                  new TextRun({ text: "To: ", bold: true, size: 21, color: TEXT_DARK, font: FONT_FAMILY }),
                  new TextRun({ text: offer.candidate_name, bold: true, size: 21, color: TEXT_DARK, font: FONT_FAMILY }),
                ],
              }),
              ...(offer.candidate_email
                ? [
                    new Paragraph({
                      spacing: { before: 0, after: 40 },
                      children: [
                        new TextRun({ text: `Email: ${offer.candidate_email}`, size: 18, color: TEXT_MUTED, font: FONT_FAMILY }),
                        new TextRun({ text: `  ·  Phone: ${offer.candidate_phone || "—"}`, size: 18, color: TEXT_MUTED, font: FONT_FAMILY }),
                      ],
                    }),
                  ]
                : []),
              new Paragraph({
                spacing: { before: 30, after: 0 },
                children: [
                  new TextRun({ text: "On behalf of ", size: 19, font: FONT_FAMILY }),
                  new TextRun({ text: buName, bold: true, size: 19, font: FONT_FAMILY }),
                  new TextRun({ text: ", we are delighted to formally offer you the position of ", size: 19, font: FONT_FAMILY }),
                  new TextRun({ text: offer.job_title, bold: true, color: NAVY_COLOR, size: 19, font: FONT_FAMILY }),
                  new TextRun({
                    text: ". We were thoroughly impressed with your professional background, qualifications, and interview assessments, and we believe you will make a valuable contribution to our team.",
                    size: 19,
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
