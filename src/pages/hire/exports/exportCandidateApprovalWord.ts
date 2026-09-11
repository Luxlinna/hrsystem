import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  ImageRun,
} from "docx";
import type { CandidateApproval } from "../types";
import { UNI_LOGO_BASE64 } from "./templates/uniLogoBase64";

function getLogoBuffer(): Uint8Array | null {
  try {
    const base64Clean = UNI_LOGO_BASE64.replace(/^data:image\/\w+;base64,/, "");
    const binary = atob(base64Clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

export async function exportCandidateApprovalWord(approval: CandidateApproval): Promise<boolean> {
  // A4 Page printable width with 10mm (567 dxa) margins: ~10,700 dxa
  const TOTAL_WIDTH = 10700;

  const solidBorder = {
    style: BorderStyle.SINGLE,
    size: 4, // 0.5 pt
    color: "111111",
  };

  const borders = {
    top: solidBorder,
    bottom: solidBorder,
    left: solidBorder,
    right: solidBorder,
  };

  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: "auto",
  };

  const noBorders = {
    top: noBorder,
    bottom: noBorder,
    left: noBorder,
    right: noBorder,
  };

  const cellMargins = {
    top: 70,    // ~3.5 pt
    bottom: 70,
    left: 90,   // ~4.5 pt
    right: 90,
  };

  const logoBytes = getLogoBuffer();

  // 1. Company Header Table (Logo + Company Details) - strictly borderless
  const headerTable = new Table({
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
                    text: "យូនីក ណូបិល អ៊ិនវេសម៉ិន ឯ.ក",
                    bold: true,
                    size: 21, // 10.5pt
                    font: "Kantumruy Pro",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15, line: 240 },
                children: [
                  new TextRun({
                    text: "Unique Noble Investment Co. Ltd.",
                    bold: true,
                    size: 19, // 9.5pt
                    font: "Inter",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 0, after: 15, line: 220 },
                children: [
                  new TextRun({
                    text: "ផ្ទះលេខ TK Roundabout លេខ 6 ជាន់ទី 2 ការិយាល័យលេខ A2-06F, ផ្លូវលេខ 289, 12 សង្កាត់ បឹងកក់ទី 2, ខណ្ឌទួលគោក, ភ្នំពេញ, កម្ពុជា",
                    size: 15, // 7.5pt
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

  // 2. Title Bar: Mathematically centered title with right-aligned Rec number and solid bottom underline
  const titleBottomBorder = {
    top: noBorder,
    left: noBorder,
    right: noBorder,
    bottom: { style: BorderStyle.SINGLE, size: 12, color: "111111" },
  };

  const titleTable = new Table({
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
                    size: 28, // 14pt
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
                    size: 19, // 9.5pt
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

  // 3. Section I: Candidate & Role Overview
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
      // Row 1
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2300, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Candidate Name:", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 3050, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: approval.candidate_name || "—", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 2300, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Gender:", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 3050, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: approval.gender || "Female", size: 18 })] })],
          }),
        ],
      }),
      // Row 2
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2300, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Position Applied for:", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 3050, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: approval.position_applied || "—", size: 18 })] })],
          }),
          new TableCell({
            width: { size: 2300, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Business Unit:", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 3050, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: approval.business_unit || "—", size: 18 })] })],
          }),
        ],
      }),
      // Row 3
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2300, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Department:", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 3050, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: approval.department || "—", size: 18 })] })],
          }),
          new TableCell({
            width: { size: 2300, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Hiring Manager:", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 3050, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: approval.hiring_manager || "—", size: 18 })] })],
          }),
        ],
      }),
      // Row 4
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2300, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Current Salary:", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 3050, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: approval.current_salary || "$0", size: 18 })] })],
          }),
          new TableCell({
            width: { size: 2300, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Expectation Salary:", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 3050, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "E0F2FE", type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: approval.expectation_salary || "$0",
                    bold: true,
                    color: "0369A1",
                    size: 19,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Row 5
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2300, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Current Benefit:", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 3050, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: approval.current_benefit || "—", size: 18 })] })],
          }),
          new TableCell({
            width: { size: 2300, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "Notice Period:", bold: true, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 3050, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: approval.notice_period || "—", size: 18 })] })],
          }),
        ],
      }),
    ],
  });

  // 4. Section II: Candidate Evaluation Summary
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
      // Table Column Headers
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
      // Evaluation Content Row
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
            children: [new Paragraph({ children: [new TextRun({ text: approval.work_experience || "3+ years", size: 17 })] })],
          }),
          new TableCell({
            width: { size: 2675, type: WidthType.DXA },
            borders,
            margins: cellMargins,
            verticalAlign: VerticalAlign.TOP,
            children: [new Paragraph({ children: [new TextRun({ text: approval.strengths || "High accountability, rapid learner, strong communication clarity.", size: 17 })] })],
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
      // Overall Assessment spanning full width
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

  // 5. Interview Panels Table
  const panels = approval.interview_panels && approval.interview_panels.length > 0
    ? approval.interview_panels
    : [
        { name: "Ms. Meas Chhengseang", date_time: "11 Sep 2026 3:00PM", position: "CEO", signature: "Signed" },
        { name: "Mr. Sun Reasey", date_time: "11 Sep 2026 3:00PM", position: "HR Recruiter", signature: "Signed" },
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

  // 6. Section III: Final Approval (4 signatories)
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
                    text: isSigned ? (sig.checked_by || sig.assigned_name || "Signed") : "....................................",
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

  // Construct Document with 10mm margins on A4
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 567, // ~10mm
              right: 567,
              bottom: 567,
              left: 567,
            },
          },
        },
        children: [
          headerTable,
          titleTable,
          sec1Heading,
          sec1Table,
          sec2Heading,
          sec2SummaryTable,
          panelsHeading,
          panelsTable,
          sec3Heading,
          sec3Table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${approval.form_number || "CAF"}_Candidate_Approval.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return true;
}
