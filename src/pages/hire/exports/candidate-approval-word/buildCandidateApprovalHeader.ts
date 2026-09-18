import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  ImageRun,
  WidthType,
  VerticalAlign,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { CandidateApproval } from "../../types";
import {
  resolveDocumentBranding,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
} from "@/services/formLogoService";
import {
  TOTAL_WIDTH,
  noBorders,
  noBorder,
  getLogoBuffer,
} from "./candidateApprovalWordStyles";

export function buildCandidateApprovalHeaderTable(
  approval: CandidateApproval,
  isHrDivisionContext?: boolean
): Table {
  const branding = resolveDocumentBranding({
    businessUnit: approval.business_unit,
    department: approval.department,
    isHrDivisionContext,
  });

  const logoBytes = getLogoBuffer(branding.logo);

  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    columnWidths: [1200, 9500],
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1200, type: WidthType.DXA },
            borders: noBorders,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 0, bottom: 0, left: 0, right: 100 },
            children: logoBytes
              ? [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: logoBytes,
                        transformation: { width: 48, height: 48 },
                        type: "png",
                      }),
                    ],
                  }),
                ]
              : [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 9500, type: WidthType.DXA },
            borders: noBorders,
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 0, bottom: 0, left: 60, right: 0 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 15, line: 240 },
                children: [
                  new TextRun({
                    text: branding.companyKhmer || getOfficialCompanyNameKhmer(),
                    bold: true,
                    size: 21,
                    font: "Kantumruy Pro",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15, line: 240 },
                children: [
                  new TextRun({
                    text: branding.companyName || getOfficialCompanyNameEnglish(),
                    bold: true,
                    size: 19,
                    font: "Inter",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15, line: 220 },
                children: [
                  new TextRun({
                    text: "ផ្ទះលេខ TK Roundabout លេខ 6 ជាន់ទី 2 ការិយាល័យលេខ A2-06F, ផ្លូវលេខ 289, 12 សង្កាត់ បឹងកក់ទី 2, ខណ្ឌទួលគោក, ភ្នំពេញ, កម្ពុជា",
                    size: 15,
                    font: "Kantumruy Pro",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15, line: 220 },
                children: [
                  new TextRun({
                    text: "Building TK Roundabout No. 6, Floor 2nd, Office No. A2-06F, Street No. 289, 12, Sangkat Boeng Kak Ti Pir, Khan Tuol Kouk, Phnom Penh, Cambodia.",
                    size: 15,
                    font: "Inter",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 30, line: 220 },
                children: [
                  new TextRun({
                    text: "លេខទូរស័ព្ទ/Phone: 095 224 424   |   លេខអត្តសញ្ញាណកម្មសារពើពន្ធ/TIN: K005-902204561",
                    bold: true,
                    size: 15,
                    font: "Inter",
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

export function buildCandidateApprovalTitleTable(approval: CandidateApproval): Table {
  const titleBottomBorder = {
    top: noBorder,
    left: noBorder,
    right: noBorder,
    bottom: { style: BorderStyle.SINGLE, size: 12, color: "111111" },
  };

  return new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    columnWidths: [2700, 5300, 2700],
    borders: titleBottomBorder,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2700, type: WidthType.DXA },
            borders: titleBottomBorder,
            margins: { top: 40, bottom: 40, left: 0, right: 0 },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 5300, type: WidthType.DXA },
            borders: titleBottomBorder,
            margins: { top: 40, bottom: 40, left: 0, right: 0 },
            verticalAlign: VerticalAlign.BOTTOM,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 20 },
                children: [
                  new TextRun({
                    text: "Candidate Approval Form",
                    bold: true,
                    size: 28,
                    underline: {},
                    font: "Inter",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2700, type: WidthType.DXA },
            borders: titleBottomBorder,
            margins: { top: 40, bottom: 40, left: 0, right: 0 },
            verticalAlign: VerticalAlign.BOTTOM,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 20 },
                children: [
                  new TextRun({
                    text: `Rec: ${approval.form_number || "CAF-2026-..."}`,
                    bold: true,
                    size: 19,
                    font: "Inter",
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
