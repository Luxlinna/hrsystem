import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  WidthType,
  VerticalAlign,
  AlignmentType,
  BorderStyle,
} from "docx";
import type { CandidateApproval } from "../../types";
import { TOTAL_WIDTH, borders, cellMargins } from "./candidateApprovalWordStyles";

export function buildCandidateSignatoriesSection(approval: CandidateApproval): (Paragraph | Table)[] {
  const sec3Heading = new Paragraph({
    spacing: { before: 140, after: 50 },
    children: [
      new TextRun({
        text: "III. FINAL APPROVAL",
        bold: true,
        size: 20,
        underline: {},
        font: "Inter",
      }),
    ],
  });

  const sigs = approval.signatories;
  const sigList = [
    { key: "ceo", role: "CEO (Business Unit)", data: sigs.ceo },
    { key: "hr_manager", role: "HR Manager (HR Division)", data: sigs.hr_manager },
    { key: "division_director", role: "HR Admin Director", data: sigs.division_director },
    { key: "chairwoman", role: "Chairwoman", data: sigs.chairwoman },
  ];

  const sec3Table = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    columnWidths: [2675, 2675, 2675, 2675],
    borders,
    rows: [
      new TableRow({
        children: sigList.map((s) => {
          const sig = s.data;
          const isSigned = sig.status === "approved";
          const signDate = sig.signed_at
            ? new Date(sig.signed_at).toLocaleDateString("en-GB")
            : "........................";

          return new TableCell({
            width: { size: 2675, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({
                spacing: { before: 20, after: 20 },
                children: [new TextRun({ text: "Comment:", bold: true, size: 17, underline: {} })],
              }),
              new Paragraph({
                spacing: { before: 20, after: 40 },
                children: [
                  new TextRun({
                    text: sig.comment || "....................................",
                    size: 16,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 40, after: 20 },
                children: [new TextRun({ text: "Checked by:", bold: true, size: 17, underline: {} })],
              }),
              new Paragraph({
                spacing: { before: 20, after: 40 },
                children: [
                  new TextRun({
                    text: isSigned
                      ? sig.checked_by || sig.assigned_name || "Signed"
                      : "....................................",
                    italics: isSigned,
                    color: isSigned ? "1E3A8A" : "666666",
                    bold: isSigned,
                    size: 17,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 30 },
                border: {
                  bottom: { style: BorderStyle.DASHED, size: 6, color: "999999" },
                },
                children: [],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 20, after: 10 },
                children: [
                  new TextRun({
                    text: sig.assigned_name || sig.checked_by || "—",
                    bold: true,
                    size: 18,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 20 },
                children: [
                  new TextRun({
                    text: sig.title || s.role,
                    size: 16,
                    color: "333333",
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 20, after: 20 },
                children: [
                  new TextRun({
                    text: `Date: ${signDate}`,
                    size: 16,
                  }),
                ],
              }),
            ],
          });
        }),
      }),
    ],
  });

  return [sec3Heading, sec3Table];
}
