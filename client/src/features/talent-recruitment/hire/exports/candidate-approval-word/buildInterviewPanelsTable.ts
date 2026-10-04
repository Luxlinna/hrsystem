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

export function buildInterviewPanelsSection(approval: CandidateApproval): (Paragraph | Table)[] {
  const panels = approval.interview_panels && approval.interview_panels.length > 0
    ? approval.interview_panels
    : [
        {
          name: approval.hiring_manager || "Hiring Manager",
          date_time: "11 Sep 2026 3:00PM",
          position: "Hiring Manager",
          signature: "Signed",
        },
      ];

  const panelsHeading = new Paragraph({
    spacing: { before: 100, after: 40 },
    children: [
      new TextRun({
        text: "Interview Panels",
        bold: true,
        size: 18,
        font: "Inter",
      }),
    ],
  });

  const panelsTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    columnWidths: [3500, 2500, 2500, 2200],
    borders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3500, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Interview Panel", bold: true, size: 17 })] })],
          }),
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Date Time", bold: true, size: 17 })] })],
          }),
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Position", bold: true, size: 17 })] })],
          }),
          new TableCell({
            width: { size: 2200, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Signature", bold: true, size: 17 })] })],
          }),
        ],
      }),
      ...panels.map(
        (p) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 3500, type: WidthType.DXA },
                borders,
                margins: cellMargins,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ children: [new TextRun({ text: p.name || "—", size: 17 })] })],
              }),
              new TableCell({
                width: { size: 2500, type: WidthType.DXA },
                borders,
                margins: cellMargins,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.date_time || "—", size: 17 })] })],
              }),
              new TableCell({
                width: { size: 2500, type: WidthType.DXA },
                borders,
                margins: cellMargins,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: p.position || "—", size: 17 })] })],
              }),
              new TableCell({
                width: { size: 2200, type: WidthType.DXA },
                borders,
                margins: cellMargins,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: p.signature || "Verified", italics: true, color: "1E3A8A", size: 17 })],
                  }),
                ],
              }),
            ],
          })
      ),
    ],
  });

  return [panelsHeading, panelsTable];
}
