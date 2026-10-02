import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  ImageRun,
  WidthType,
  VerticalAlign,
} from "docx";
import {
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
  type FormBrandingResult,
} from "@/services/formLogoService";
import { TOTAL_WIDTH, noBorders, getLogoBuffer } from "./evaluationWordStyles";

export function buildEvaluationHeaderTable(branding: FormBrandingResult): Table {
  const logoBuffer = getLogoBuffer(branding.logo);
  const logoRun = logoBuffer
    ? new ImageRun({
        data: logoBuffer,
        transformation: { width: 50, height: 50 },
        type: "png",
      })
    : new TextRun({ text: branding.isHrDivision ? "UNI" : "OPS", bold: true, size: 24, color: "253c7d" });

  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1400, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: noBorders,
            children: [new Paragraph({ children: [logoRun] })],
          }),
          new TableCell({
            width: { size: TOTAL_WIDTH - 1400, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: noBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: branding.companyKhmer || getOfficialCompanyNameKhmer(),
                    bold: true,
                    size: 20,
                    font: "Kantumruy Pro",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: branding.companyName || getOfficialCompanyNameEnglish(),
                    bold: true,
                    size: 19,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Building TK Roundabout No. 6, Floor 2nd, Office No. A2-06F, Street No. 289, 12, Sangkat Boeng Kak Ti Pir, Khan Tuol Kouk, Phnom Penh",
                    size: 15,
                    color: "444444",
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Phone: 095 224 424   |   TIN: K005-902204561",
                    size: 15,
                    color: "444444",
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
