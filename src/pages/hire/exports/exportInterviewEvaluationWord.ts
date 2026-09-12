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
  VerticalAlign,
  ImageRun,
} from "docx";
import type { InterviewEvaluationExportData, InterviewerSlot } from "./exportInterviewEvaluationPdf";
import {
  resolveDocumentBranding,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
} from "@/services/formLogoService";

function getLogoBuffer(logoBase64: string): Uint8Array | null {
  try {
    const raw = logoBase64;
    const base64Clean = raw.replace(/^data:image\/\w+;base64,/, "");
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

function formatOrdinalDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const day = d.getDate();
  const j = day % 10;
  const k = day % 100;
  let ord = "th";
  if (j === 1 && k !== 11) ord = "st";
  else if (j === 2 && k !== 12) ord = "nd";
  else if (j === 3 && k !== 13) ord = "rd";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}${ord} ${month} ${year}`;
}

export async function exportInterviewEvaluationWord(
  data: InterviewEvaluationExportData,
  isHrDivisionContext?: boolean
): Promise<boolean> {
  const TOTAL_WIDTH = 10500; // dxa width for A4 page
  const HALF_WIDTH = 5250;
  const QUARTER_WIDTH = 2625;

  const solidBorder = {
    style: BorderStyle.SINGLE,
    size: 6, // 0.75 pt
    color: "000000",
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
    top: 100,
    bottom: 100,
    left: 120,
    right: 120,
  };

  const rec = data.recommendation || "recommend_to_hire";
  const isRecommend = rec === "recommend_to_hire" || rec === "strong_hire" || rec === "advance";
  const isHold = rec === "hold";
  const isDoNotRecommend = rec === "do_not_recommend" || rec === "reject";
  const isAnotherPosition = rec === "available_another";

  const department = data.offerDepartment || data.candidate.job_postings?.department || "Business Development";
  const director = data.director || "Director";
  const position = data.officerPosition || data.candidate.job_postings?.title || "Officer Position";
  const probationSalary = data.probationSalary || (data.candidate.expected_salary ? `${data.candidate.expected_salary.toLocaleString()}$ (Net)` : "1,100$ (Net)");
  const afterProbationSalary = data.afterProbationSalary || (data.candidate.expected_salary ? `${data.candidate.expected_salary.toLocaleString()}$ (Net)` : "1,100$ (Net)");
  const onBoardDate = data.onBoardDate || formatOrdinalDate(data.date || new Date().toISOString());

  const defaultDateStr = formatOrdinalDate(data.date || new Date().toISOString());
  const firstSlots: InterviewerSlot[] = data.firstInterviewers && data.firstInterviewers.length > 0
    ? data.firstInterviewers
    : [
        {
          name: data.evaluatorName || "Mr. Chey Tola",
          position: data.responsibleRole || "BDDD",
          date: defaultDateStr || "24th Dec 25",
        },
        { name: "", position: "", date: "" },
        { name: "", position: "", date: "" },
        { name: "", position: "", date: "" },
      ];

  const secondSlots: InterviewerSlot[] = data.secondInterviewers && data.secondInterviewers.length > 0
    ? data.secondInterviewers
    : [
        {
          name: data.evaluatorName || "Mr. Chey Tola",
          position: data.responsibleRole || "BDDD",
          date: defaultDateStr || "24th Dec 25",
        },
        { name: "", position: "", date: "" },
        { name: "", position: "", date: "" },
        { name: "", position: "", date: "" },
      ];

  const employerName = data.approvedBy?.name || "Mrs. Pin Phiroum";
  const employerRole = data.approvedBy?.role || "Chairwoman";
  const employerCompany = data.approvedBy?.company || "UNI Holding";
  const approvalDate = data.approvedBy?.date || "........................";

  const businessUnit = (data.candidate.job_postings?.branches as any)?.name || department;
  const branding = resolveDocumentBranding({
    businessUnit,
    department,
    isHrDivisionContext,
  });

  // Company Header Table (Logo + Company text)
  const logoBuffer = getLogoBuffer(branding.logo);
  const logoRun = logoBuffer
    ? new ImageRun({
        data: logoBuffer,
        transformation: { width: 50, height: 50 },
        type: "png",
      })
    : new TextRun({ text: branding.isHrDivision ? "UNI" : "OPS", bold: true, size: 24, color: "253c7d" });

  const companyHeaderTable = new Table({
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

  // Helper to build 4 interviewer cells
  function buildInterviewerCells(titlePrefix: string, slots: InterviewerSlot[]) {
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
            children: [
              new TextRun({ text: `Name: ${name}`, size: 18 }),
            ],
          }),
          new Paragraph({
            spacing: { line: 240 },
            children: [
              new TextRun({ text: `Position: ${pos}`, size: 18 }),
            ],
          }),
          new Paragraph({
            spacing: { line: 240 },
            children: [
              new TextRun({ text: `Date: ${d}`, size: 18 }),
            ],
          }),
        ],
      });
    });
  }

  // Master Table
  const masterTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders,
    rows: [
      // Row 1: Title
      new TableRow({
        children: [
          new TableCell({
            width: { size: TOTAL_WIDTH, type: WidthType.DXA },
            columnSpan: 4,
            borders,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "INTERVIEW RESULTS",
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Row 2: Offer Details (left) and Department Hiring (right)
      new TableRow({
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
                children: [
                  new TextRun({ text: `Office Department: ${department}`, size: 19 }),
                ],
              }),
              ...(director
                ? [
                    new Paragraph({
                      spacing: { line: 280 },
                      children: [new TextRun({ text: director, size: 19 })],
                    }),
                  ]
                : []),
              new Paragraph({
                spacing: { line: 280 },
                children: [
                  new TextRun({ text: `Officer Position: ${position}`, size: 19 }),
                ],
              }),
              new Paragraph({
                spacing: { line: 280 },
                children: [
                  new TextRun({ text: `Probation: ${probationSalary}`, size: 19 }),
                ],
              }),
              new Paragraph({
                spacing: { line: 280 },
                children: [
                  new TextRun({ text: `After Probation: ${afterProbationSalary}`, size: 19 }),
                ],
              }),
              new Paragraph({
                spacing: { line: 280 },
                children: [
                  new TextRun({ text: `On-Board Date: ${onBoardDate}.`, size: 19 }),
                ],
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
                    text: isRecommend ? "☑  Recommend to Hire" : "☐  Recommend to Hire",
                    bold: isRecommend,
                    size: 19,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { line: 320 },
                children: [
                  new TextRun({
                    text: isHold ? "☑  Hold" : "☐  Hold",
                    bold: isHold,
                    size: 19,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { line: 320 },
                children: [
                  new TextRun({
                    text: isDoNotRecommend ? "☑  Do not recommend to hire" : "☐  Do not recommend to hire",
                    bold: isDoNotRecommend,
                    size: 19,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { line: 320 },
                children: [
                  new TextRun({
                    text: isAnotherPosition ? "☑  Available for Another Position" : "☐  Available for Another Position",
                    bold: isAnotherPosition,
                    size: 19,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Row 3: 1st Interview Header
      new TableRow({
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
                    text: "1st Interview",
                    bold: true,
                    size: 21,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Row 4: 1st Interview 4 Interviewers
      new TableRow({
        children: buildInterviewerCells("Interviewer", firstSlots),
      }),

      // Row 5: 2nd Interview Header
      new TableRow({
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
                    text: "2nd Interview",
                    bold: true,
                    size: 21,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Row 6: 2nd Interview 4 Interviewers
      new TableRow({
        children: buildInterviewerCells("Interviewer", secondSlots),
      }),

      // Row 7: APPROVED BY Header
      new TableRow({
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
      }),

      // Row 8: Employer Signature Box
      new TableRow({
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
                    text: `${employerName}          `,
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
                    text: `${employerRole}               `,
                    size: 19,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { line: 260 },
                children: [
                  new TextRun({
                    text: `${employerCompany}            `,
                    size: 19,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { line: 260 },
                children: [
                  new TextRun({
                    text: `Date: ${approvalDate}   `,
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 567, // ~10mm
              bottom: 567,
              left: 680, // ~12mm
              right: 680,
            },
          },
        },
        children: [
          companyHeaderTable,
          new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }),
          masterTable,
        ],
      },
    ],
  });

  try {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedName = (data.candidate.full_name || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `Interview_Results_${sanitizedName}_${data.candidate.candidate_code || "CAN"}.docx`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1500);
    return true;
  } catch (err) {
    console.error("Failed to generate Word document:", err);
    throw err;
  }
}
