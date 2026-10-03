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
} from "docx";
import type { InterviewEvaluationExportData, InterviewerSlot } from "./exportInterviewEvaluationPdf";
import { resolveDocumentBranding } from "@/services/formLogoService";
import { TOTAL_WIDTH, borders, formatOrdinalDate } from "./interview-evaluation-word/evaluationWordStyles";
import { buildEvaluationHeaderTable } from "./interview-evaluation-word/buildEvaluationHeaderTable";
import { buildOfferAndRecommendationRow } from "./interview-evaluation-word/buildOfferAndRecommendationRow";
import { buildInterviewStageRows } from "./interview-evaluation-word/buildInterviewerSlotsRows";
import { buildApprovalSignatureRows } from "./interview-evaluation-word/buildApprovalSignatureRow";

export async function exportInterviewEvaluationWord(
  data: InterviewEvaluationExportData,
  isHrDivisionContext?: boolean
): Promise<boolean> {
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
        { name: data.evaluatorName || "", position: data.responsibleRole || "BDDD", date: defaultDateStr || "24th Dec 25" },
        { name: "", position: "", date: "" },
        { name: "", position: "", date: "" },
        { name: "", position: "", date: "" },
      ];

  const secondSlots: InterviewerSlot[] = data.secondInterviewers && data.secondInterviewers.length > 0
    ? data.secondInterviewers
    : [
        { name: data.evaluatorName || "", position: data.responsibleRole || "BDDD", date: defaultDateStr || "24th Dec 25" },
        { name: "", position: "", date: "" },
        { name: "", position: "", date: "" },
        { name: "", position: "", date: "" },
      ];

  const employerName = data.approvedBy?.name || "";
  const employerRole = data.approvedBy?.role || "Chairwoman";
  const employerCompany = data.approvedBy?.company || "UNI Holding";
  const approvalDate = data.approvedBy?.date || "........................";

  const businessUnit = (data.candidate.job_postings?.branches as any)?.name || department;
  const branding = resolveDocumentBranding({
    businessUnit,
    department,
    isHrDivisionContext,
  });

  const companyHeaderTable = buildEvaluationHeaderTable(branding);

  // Master Table
  const titleRow = new TableRow({
    children: [
      new TableCell({
        width: { size: TOTAL_WIDTH, type: WidthType.DXA },
        columnSpan: 4,
        borders,
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        verticalAlign: "center" as any,
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
  });

  const offerRow = buildOfferAndRecommendationRow({
    department,
    director,
    position,
    probationSalary,
    afterProbationSalary,
    onBoardDate,
    isRecommend,
    isHold,
    isDoNotRecommend,
    isAnotherPosition,
  });

  const firstStageRows = buildInterviewStageRows("1st Interview", firstSlots);
  const secondStageRows = buildInterviewStageRows("2nd Interview", secondSlots);
  const approvalRows = buildApprovalSignatureRows({
    employerName,
    employerRole,
    employerCompany,
    approvalDate,
  });

  const masterTable = new Table({
    width: { size: TOTAL_WIDTH, type: WidthType.DXA },
    borders,
    rows: [
      titleRow,
      offerRow,
      ...firstStageRows,
      ...secondStageRows,
      ...approvalRows,
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
