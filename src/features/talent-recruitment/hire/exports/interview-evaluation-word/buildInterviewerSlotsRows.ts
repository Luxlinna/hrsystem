import {
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
} from "docx";
import type { InterviewerSlot } from "../exportInterviewEvaluationPdf";
import { TOTAL_WIDTH, QUARTER_WIDTH, borders, cellMargins } from "./evaluationWordStyles";

export function buildInterviewerCells(titlePrefix: string, slots: InterviewerSlot[]): TableCell[] {
  return [0, 1, 2, 3].map((idx) => {
    const slot = slots[idx];
    const name = slot?.name?.trim() ? slot.name : "....................";
    const pos = slot?.position?.trim() ? slot.position : "....................";
    const d = slot?.date?.trim() ? slot.date : "....................";

    return new TableCell({
      width: { size: QUARTER_WIDTH, type: WidthType.DXA },
      borders,
      margins: cellMargins,
      verticalAlign: VerticalAlign.TOP,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `${titlePrefix} ${idx + 1}`,
              bold: true,
              size: 20,
            }),
          ],
        }),
        // Space for signature
        new Paragraph({ children: [new TextRun({ text: "" })] }),
        new Paragraph({ children: [new TextRun({ text: "" })] }),
        new Paragraph({ children: [new TextRun({ text: "" })] }),
        new Paragraph({
          children: [
            new TextRun({
              text: "____________________________",
              size: 16,
              color: "666666",
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 50, line: 240 },
          children: [new TextRun({ text: `Name: ${name}`, size: 18 })],
        }),
        new Paragraph({
          spacing: { line: 240 },
          children: [new TextRun({ text: `Position: ${pos}`, size: 18 })],
        }),
        new Paragraph({
          spacing: { line: 240 },
          children: [new TextRun({ text: `Date: ${d}`, size: 18 })],
        }),
      ],
    });
  });
}

export function buildInterviewStageRows(stageTitle: string, slots: InterviewerSlot[]): TableRow[] {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: TOTAL_WIDTH, type: WidthType.DXA },
        columnSpan: 4,
        borders,
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: stageTitle,
                bold: true,
                size: 21,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const slotsRow = new TableRow({
    children: buildInterviewerCells("Interviewer", slots),
  });

  return [headerRow, slotsRow];
}
