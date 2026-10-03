import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  ImageRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
} from "docx";
import {
  TOTAL_WIDTH,
  HALF_WIDTH,
  NAVY_COLOR,
  TEXT_DARK,
  TEXT_MUTED,
  FONT_FAMILY,
  noBorder,
  noBorders,
} from "./offerLetterWordStyles";

export function buildOfferHeaderTopTable(buName: string, logoBytes: Uint8Array | null): Table {
  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Left: Clean Logo box
          new TableCell({
            width: { size: 4500, type: WidthType.DXA },
            borders: noBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: logoBytes
                  ? [
                      new ImageRun({
                        data: logoBytes,
                        transformation: { width: 68, height: 68 },
                        type: "png",
                      }),
                    ]
                  : [
                      new TextRun({
                        text: buName,
                        bold: true,
                        size: 24,
                        color: NAVY_COLOR,
                        font: FONT_FAMILY,
                      }),
                    ],
              }),
            ],
          }),
          // Right: Official Offer Title
          new TableCell({
            width: { size: 5500, type: WidthType.DXA },
            borders: noBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: "OFFICIAL OFFER OF EMPLOYMENT",
                    bold: true,
                    size: 26, // 13pt
                    color: NAVY_COLOR,
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

export function buildOfferHeaderDividerTable(): Table {
  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 20, color: NAVY_COLOR },
              bottom: noBorder,
              left: noBorder,
              right: noBorder,
            },
            children: [new Paragraph({ spacing: { before: 0, after: 60 }, children: [] })],
          }),
        ],
      }),
    ],
  });
}

export function buildOfferMetaTable(formattedOfferDate: string, offerNumber?: string): Table {
  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: HALF_WIDTH, type: WidthType.DXA },
            borders: noBorders,
            children: [
              new Paragraph({
                spacing: { before: 0, after: 80 },
                children: [
                  new TextRun({ text: "Date: ", bold: true, size: 20, color: TEXT_MUTED, font: FONT_FAMILY }),
                  new TextRun({ text: formattedOfferDate, size: 20, color: TEXT_DARK, font: FONT_FAMILY }),
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
                spacing: { before: 0, after: 80 },
                children: [
                  new TextRun({ text: "Offer Ref: ", bold: true, size: 20, color: TEXT_MUTED, font: FONT_FAMILY }),
                  new TextRun({
                    text: ` ${offerNumber || "OFF-2026"} `,
                    bold: true,
                    size: 20,
                    color: NAVY_COLOR,
                    font: "Consolas",
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
