import {
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
} from "docx";
import { TOTAL_WIDTH, borders } from "./evaluationWordStyles";

export interface ApprovalSignatureOptions {
  employerName: string;
  employerRole: string;
  employerCompany: string;
  approvalDate: string;
}

export function buildApprovalSignatureRows(opt: ApprovalSignatureOptions): TableRow[] {
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
                text: "APPROVED BY",
                bold: true,
                size: 21,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const signatureRow = new TableRow({
    children: [
      new TableCell({
        width: { size: TOTAL_WIDTH, type: WidthType.DXA },
        columnSpan: 4,
        borders,
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        verticalAlign: VerticalAlign.TOP,
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 100, after: 800 },
            children: [
              new TextRun({
                text: "Employer               ",
                bold: true,
                size: 21,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: "____________________________________",
                size: 16,
                color: "666666",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 80, line: 260 },
            children: [
              new TextRun({
                text: `${opt.employerName}          `,
                bold: true,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: 260 },
            children: [
              new TextRun({
                text: `${opt.employerRole}               `,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: 260 },
            children: [
              new TextRun({
                text: `${opt.employerCompany}            `,
                size: 19,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { line: 260 },
            children: [
              new TextRun({
                text: `Date: ${opt.approvalDate}   `,
                size: 18,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  return [headerRow, signatureRow];
}
