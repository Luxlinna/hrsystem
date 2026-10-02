import {
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  VerticalAlign,
} from "docx";
import { HALF_WIDTH, borders, cellMargins } from "./evaluationWordStyles";

export interface OfferAndRecommendationOptions {
  department: string;
  director?: string;
  position: string;
  probationSalary: string;
  afterProbationSalary: string;
  onBoardDate: string;
  isRecommend: boolean;
  isHold: boolean;
  isDoNotRecommend: boolean;
  isAnotherPosition: boolean;
}

export function buildOfferAndRecommendationRow(opt: OfferAndRecommendationOptions): TableRow {
  return new TableRow({
    children: [
      // Left: Offer Details
      new TableCell({
        width: { size: HALF_WIDTH, type: WidthType.DXA },
        columnSpan: 2,
        borders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Offer Details (For Successful Applicants Only)",
                bold: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            spacing: { line: 280 },
            children: [new TextRun({ text: `Office Department: ${opt.department}`, size: 19 })],
          }),
          ...(opt.director
            ? [
                new Paragraph({
                  spacing: { line: 280 },
                  children: [new TextRun({ text: opt.director, size: 19 })],
                }),
              ]
            : []),
          new Paragraph({
            spacing: { line: 280 },
            children: [new TextRun({ text: `Officer Position: ${opt.position}`, size: 19 })],
          }),
          new Paragraph({
            spacing: { line: 280 },
            children: [new TextRun({ text: `Probation: ${opt.probationSalary}`, size: 19 })],
          }),
          new Paragraph({
            spacing: { line: 280 },
            children: [new TextRun({ text: `After Probation: ${opt.afterProbationSalary}`, size: 19 })],
          }),
          new Paragraph({
            spacing: { line: 280 },
            children: [new TextRun({ text: `On-Board Date: ${opt.onBoardDate}.`, size: 19 })],
          }),
        ],
      }),

      // Right: Department Hiring
      new TableCell({
        width: { size: HALF_WIDTH, type: WidthType.DXA },
        columnSpan: 2,
        borders,
        margins: cellMargins,
        verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: "Department Hiring",
                bold: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            spacing: { line: 320 },
            children: [
              new TextRun({
                text: opt.isRecommend ? "☑  Recommend to Hire" : "☐  Recommend to Hire",
                bold: opt.isRecommend,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            spacing: { line: 320 },
            children: [
              new TextRun({
                text: opt.isHold ? "☑  Hold" : "☐  Hold",
                bold: opt.isHold,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            spacing: { line: 320 },
            children: [
              new TextRun({
                text: opt.isDoNotRecommend ? "☑  Do not recommend to hire" : "☐  Do not recommend to hire",
                bold: opt.isDoNotRecommend,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            spacing: { line: 320 },
            children: [
              new TextRun({
                text: opt.isAnotherPosition ? "☑  Available for Another Position" : "☐  Available for Another Position",
                bold: opt.isAnotherPosition,
                size: 19,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
