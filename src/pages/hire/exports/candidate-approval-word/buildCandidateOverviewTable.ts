import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  VerticalAlign,
  ShadingType,
} from "docx";
import type { CandidateApproval } from "../../types";
import { TOTAL_WIDTH, borders, cellMargins } from "./candidateApprovalWordStyles";

function createOverviewRow(
  label1: string,
  val1: string,
  label2: string,
  val2: string,
  options?: { isVal1Bold?: boolean; isHighlightVal2?: boolean }
): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 2300, type: WidthType.DXA },
        borders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: label1, bold: true, size: 18 })] })],
      }),
      new TableCell({
        width: { size: 3050, type: WidthType.DXA },
        borders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ children: [new TextRun({ text: val1, bold: Boolean(options?.isVal1Bold), size: 18 })] })],
      }),
      new TableCell({
        width: { size: 2300, type: WidthType.DXA },
        borders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: label2, bold: true, size: 18 })] })],
      }),
      new TableCell({
        width: { size: 3050, type: WidthType.DXA },
        borders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER,
        shading: options?.isHighlightVal2 ? { fill: "E0F2FE", type: ShadingType.CLEAR } : undefined,
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: val2,
                bold: Boolean(options?.isHighlightVal2),
                color: options?.isHighlightVal2 ? "0369A1" : undefined,
                size: options?.isHighlightVal2 ? 19 : 18,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export function buildCandidateOverviewSection(approval: CandidateApproval): (Paragraph | Table)[] {
  const sec1Heading = new Paragraph({
    spacing: { before: 140, after: 50 },
    children: [
      new TextRun({
        text: "I. CANDIDATE & ROLE OVERVIEW",
        bold: true,
        size: 20, // 10pt
        underline: {},
        font: "Inter",
      }),
    ],
  });

  const sec1Table = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    columnWidths: [2300, 3050, 2300, 3050],
    borders,
    rows: [
      createOverviewRow("Candidate Name:", approval.candidate_name || "—", "Gender:", approval.gender || "Female", { isVal1Bold: true }),
      createOverviewRow("Position Applied for:", approval.position_applied || "—", "Business Unit:", approval.business_unit || "—"),
      createOverviewRow("Department:", approval.department || "—", "Hiring Manager:", approval.hiring_manager || "—"),
      createOverviewRow("Current Salary:", approval.current_salary || "$0", "Expectation Salary:", approval.expectation_salary || "$0", { isHighlightVal2: true }),
      createOverviewRow("Current Benefit:", approval.current_benefit || "—", "Notice Period:", approval.notice_period || "—"),
    ],
  });

  return [sec1Heading, sec1Table];
}
