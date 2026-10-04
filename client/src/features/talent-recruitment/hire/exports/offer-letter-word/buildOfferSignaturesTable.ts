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
  NAVY_COLOR,
  TEXT_DARK,
  TEXT_MUTED,
  TEXT_LIGHT_MUTED,
  FONT_FAMILY,
  thinCardBorders,
  noBorders,
} from "./offerLetterWordStyles";

export function buildOfferSignaturesTable(
  offer: OfferLetter,
  buName: string,
  formattedOfferDate: string
): Table {
  const employerSignatory = offer.issued_by || offer.management_approved_by || "Head of Human Resources";
  const CARD_WIDTH = 4800;
  const GAP_WIDTH = 400;

  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Card 1: Authorized Employer Signatory
          new TableCell({
            width: { size: CARD_WIDTH, type: WidthType.DXA },
            borders: thinCardBorders,
            shading: { fill: "FAFAFA" },
            margins: { top: 110, bottom: 110, left: 130, right: 130 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 140 },
                children: [
                  new TextRun({
                    text: "AUTHORIZED EMPLOYER SIGNATURE",
                    bold: true,
                    size: 19,
                    color: NAVY_COLOR,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 200, after: 40 },
                children: [
                  new TextRun({
                    text: "__________________________________________",
                    color: TEXT_MUTED,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15 },
                children: [new TextRun({ text: employerSignatory, bold: true, size: 19, color: TEXT_DARK, font: FONT_FAMILY })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15 },
                children: [new TextRun({ text: `For & on behalf of ${buName}`, size: 17, color: TEXT_LIGHT_MUTED, font: FONT_FAMILY })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: `Date: ${formattedOfferDate}`, size: 17, color: TEXT_LIGHT_MUTED, font: FONT_FAMILY })],
              }),
            ],
          }),
          // Spacer
          new TableCell({
            width: { size: GAP_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            children: [new Paragraph({ children: [] })],
          }),
          // Card 2: Candidate Acceptance Acknowledgment
          new TableCell({
            width: { size: CARD_WIDTH, type: WidthType.DXA },
            borders: thinCardBorders,
            shading: { fill: "FAFAFA" },
            margins: { top: 110, bottom: 110, left: 130, right: 130 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 140 },
                children: [
                  new TextRun({
                    text: "CANDIDATE ACCEPTANCE ACKNOWLEDGMENT",
                    bold: true,
                    size: 19,
                    color: NAVY_COLOR,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 200, after: 40 },
                children: [
                  new TextRun({
                    text: "__________________________________________",
                    color: TEXT_MUTED,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15 },
                children: [new TextRun({ text: offer.candidate_name, bold: true, size: 19, color: TEXT_DARK, font: FONT_FAMILY })],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15 },
                children: [
                  new TextRun({
                    text: "I accept the offer on the terms and conditions outlined above.",
                    size: 17,
                    color: TEXT_LIGHT_MUTED,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: "Signature & Date: _________________________", size: 17, color: TEXT_LIGHT_MUTED, font: FONT_FAMILY })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
