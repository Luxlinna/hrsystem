import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  VerticalAlign,
  ShadingType,
  AlignmentType,
} from "docx";
import type { CandidateApproval } from "../../types";
import { TOTAL_WIDTH, borders, cellMargins } from "./candidateApprovalWordStyles";

export function buildCandidateEvaluationSection(approval: CandidateApproval): (Paragraph | Table)[] {
  const sec2Heading = new Paragraph({
    spacing: { before: 140, after: 50 },
    children: [
      new TextRun({
        text: "II. CANDIDATE EVALUATION SUMMARY",
        bold: true,
        size: 20,
        underline: {},
        font: "Inter",
      }),
    ],
  });

  const sec2SummaryTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    columnWidths: [2675, 2675, 2675, 2675],
    borders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2675, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Education and Skill", bold: true, size: 18, underline: {} })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2675, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Work Experience", bold: true, size: 18, underline: {} })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2675, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Strengths", bold: true, size: 18, underline: {} })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2675, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Improvement", bold: true, size: 18, underline: {} })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2675, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.TOP,
            children: [new Paragraph({ children: [new TextRun({ text: approval.education_and_skill || "Bachelor Degree", size: 17 })] })],
          }),
          new TableCell({
            width: { size: 2675, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.TOP,
            children: [new Paragraph({ children: [new TextRun({ text: approval.work_experience || "", size: 17 })] })],
          }),
          new TableCell({
            width: { size: 2675, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.TOP,
            children: [new Paragraph({ children: [new TextRun({ text: approval.strengths || "", size: 17 })] })],
          }),
          new TableCell({
            width: { size: 2675, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.TOP,
            children: [new Paragraph({ children: [new TextRun({ text: approval.improvement || "Can further expand depth in company-specific proprietary tools.", size: 17 })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Overall Assessment: ", bold: true, size: 18, underline: {} }),
                  new TextRun({ text: approval.overall_assessment || "Candidate performed exceptionally well across all interview stages.", size: 17 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return [sec2Heading, sec2SummaryTable];
}
