import type { Candidate } from "../types";
import {
  resolveDocumentBranding,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
} from "@/services/formLogoService";

export type InterviewResultRecommendation =
  | "recommend_to_hire"
  | "hold"
  | "do_not_recommend"
  | "available_another"
  | "strong_hire"
  | "advance"
  | "reject";

export interface InterviewerSlot {
  name: string;
  position: string;
  date: string;
  signature?: string | null;
}

export interface InterviewEvaluationExportData {
  candidate: Candidate;
  stageKey?: string;
  stageTitle?: string;
  stageSubtitle?: string;
  stageBadge?: string;
  responsibleRole?: string;
  evaluatorName?: string;
  date?: string;
  overallScore?: number;
  recommendation?: InterviewResultRecommendation;
  competencies?: Record<string, number>;
  strengths?: string;
  concerns?: string;
  notes?: string;
  panelMembers?: Array<{ name: string; role?: string }>;
  interviewType?: string;
  interviewDuration?: number | string;

  // Exact UNI "INTERVIEW RESULTS" fields
  offerDepartment?: string;
  director?: string;
  officerPosition?: string;
  probationSalary?: string;
  afterProbationSalary?: string;
  onBoardDate?: string;
  firstInterviewers?: InterviewerSlot[];
  secondInterviewers?: InterviewerSlot[];
  approvedBy?: {
    employerTitle?: string;
    name?: string;
    role?: string;
    company?: string;
    date?: string;
  };
}

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function renderInterviewerTd(title: string, slot?: InterviewerSlot): string {
  const name = slot?.name?.trim() ? escapeHtml(slot.name) : "....................";
  const pos = slot?.position?.trim() ? escapeHtml(slot.position) : "....................";
  const date = slot?.date?.trim() ? escapeHtml(slot.date) : "....................";

  return `
    <td style="width: 25%; border: 1px solid #000; vertical-align: top; padding: 6px 6px;">
      <div style="text-align: center; font-weight: bold; font-size: 11px; margin-bottom: 45px;">${escapeHtml(title)}</div>
      <div style="border-top: 1px solid #000; padding-top: 4px; font-size: 10px; line-height: 1.45;">
        <div>Name: ${name}</div>
        <div>Position: ${pos}</div>
        <div>Date: ${date}</div>
      </div>
    </td>
  `;
}

export function buildInterviewEvaluationHtml(
  data: InterviewEvaluationExportData,
  isHrDivisionContext?: boolean
): string {
  const rec = data.recommendation || "recommend_to_hire";
  const isRecommend = rec === "recommend_to_hire" || rec === "strong_hire" || rec === "advance";
  const isHold = rec === "hold";
  const isDoNotRecommend = rec === "do_not_recommend" || rec === "reject";
  const isAnotherPosition = rec === "available_another";

  const department = data.offerDepartment || data.candidate.job_postings?.department || "Business Development";
  const businessUnit = (data.candidate.job_postings?.branches as any)?.name || department;
  const branding = resolveDocumentBranding({
    businessUnit,
    department,
    isHrDivisionContext,
  });

  const director = data.director || "Director";
  const position = data.officerPosition || data.candidate.job_postings?.title || "Officer Position";
  const probationSalary = data.probationSalary || (data.candidate.expected_salary ? `${data.candidate.expected_salary.toLocaleString()}$ (Net)` : "1,100$ (Net)");
  const afterProbationSalary = data.afterProbationSalary || (data.candidate.expected_salary ? `${data.candidate.expected_salary.toLocaleString()}$ (Net)` : "1,100$ (Net)");
  const onBoardDate = data.onBoardDate || formatOrdinalDate(data.date || new Date().toISOString());

  // Default first interviewers (Slot 1 default from evaluatorName)
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>INTERVIEW RESULTS - ${escapeHtml(data.candidate.full_name)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }
    body {
      font-family: 'Times New Roman', Times, serif, Arial, sans-serif;
      font-size: 11px;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .page-container {
      width: 100%;
      max-width: 188mm;
      margin: 0 auto;
    }
    .company-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .company-logo {
      width: 48px;
      height: 48px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .company-info {
      font-size: 8.5px;
      line-height: 1.3;
      color: #111;
    }
    .company-name-kh {
      font-family: 'Kantumruy Pro', sans-serif;
      font-size: 11px;
      font-weight: bold;
    }
    .company-name-en {
      font-weight: bold;
      font-size: 10px;
    }

    /* Master Results Table */
    .results-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
    }
    .results-table th, .results-table td {
      border: 1px solid #000;
      vertical-align: top;
      padding: 5px 8px;
    }
    .table-title {
      text-align: center;
      font-weight: bold;
      font-size: 13.5px;
      letter-spacing: 0.5px;
      padding: 6px !important;
      text-transform: uppercase;
      background-color: #fff;
      border: 1px solid #000;
    }
    .sub-section-header {
      text-align: center;
      font-weight: bold;
      font-size: 12px;
      padding: 4.5px !important;
      background-color: #fff;
      border: 1px solid #000;
    }
    .check-box {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid #000;
      margin-right: 6px;
      vertical-align: middle;
      text-align: center;
      line-height: 11px;
      font-size: 10px;
      font-weight: bold;
    }
    .approval-container {
      height: 155px;
      position: relative;
      padding: 10px 14px !important;
      border: 1px solid #000;
    }
    .approval-box {
      float: right;
      width: 230px;
      text-align: center;
      margin-right: 15px;
    }
    .employer-title {
      font-weight: bold;
      font-size: 12px;
      margin-bottom: 50px;
    }
    .employer-sign-line {
      border-top: 1px solid #000;
      padding-top: 4px;
      font-size: 11px;
      line-height: 1.35;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Top Branding with BU / HR Division Logo -->
    <div class="company-header">
      <img src="${branding.logo}" class="company-logo" alt="Brand Logo" />
      <div class="company-info">
        <div class="company-name-kh">${escapeHtml(branding.companyKhmer || getOfficialCompanyNameKhmer())}</div>
        <div class="company-name-en">${escapeHtml(branding.companyName || getOfficialCompanyNameEnglish())}</div>
        <div>Building TK Roundabout No. 6, Floor 2nd, Office No. A2-06F, Street No. 289, 12, Sangkat Boeng Kak Ti Pir, Khan Tuol Kouk, Phnom Penh</div>
        <div>Phone: 095 224 424 &nbsp;|&nbsp; TIN: K005-902204561</div>
      </div>
    </div>

    <!-- Master INTERVIEW RESULTS Table -->
    <table class="results-table">
      <!-- Title -->
      <tr>
        <th colspan="4" class="table-title">INTERVIEW RESULTS</th>
      </tr>

      <!-- Offer Details & Department Hiring (2 columns across 4 columns) -->
      <tr>
        <td colspan="2" style="width: 50%; border: 1px solid #000; padding: 8px 10px;">
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 11.5px;">Offer Details (For Successful Applicants Only)</div>
          <div style="line-height: 1.65; font-size: 10.5px;">
            <div>Office Department: ${escapeHtml(department)}</div>
            ${director ? `<div>${escapeHtml(director)}</div>` : ""}
            <div>Officer Position: ${escapeHtml(position)}</div>
            <div>Probation: ${escapeHtml(probationSalary)}</div>
            <div>After Probation: ${escapeHtml(afterProbationSalary)}</div>
            <div>On-Board Date: ${escapeHtml(onBoardDate)}.</div>
          </div>
        </td>
        <td colspan="2" style="width: 50%; border: 1px solid #000; padding: 8px 10px;">
          <div style="font-weight: bold; margin-bottom: 10px; font-size: 11.5px;">Department Hiring</div>
          <div style="line-height: 2.1; font-size: 10.5px;">
            <div><span class="check-box">${isRecommend ? "✓" : ""}</span> Recommend to Hire</div>
            <div><span class="check-box">${isHold ? "✓" : ""}</span> Hold</div>
            <div><span class="check-box">${isDoNotRecommend ? "✓" : ""}</span> Do not recommend to hire</div>
            <div><span class="check-box">${isAnotherPosition ? "✓" : ""}</span> Available for Another Position</div>
          </div>
        </td>
      </tr>

      <!-- 1st Interview Header -->
      <tr>
        <th colspan="4" class="sub-section-header">1<sup>st</sup> Interview</th>
      </tr>

      <!-- 1st Interview 4 Interviewers -->
      <tr>
        ${renderInterviewerTd("Interviewer 1", firstSlots[0])}
        ${renderInterviewerTd("Interviewer 2", firstSlots[1])}
        ${renderInterviewerTd("Interviewer 3", firstSlots[2])}
        ${renderInterviewerTd("Interviewer 4", firstSlots[3])}
      </tr>

      <!-- 2nd Interview Header -->
      <tr>
        <th colspan="4" class="sub-section-header">2<sup>nd</sup> Interview</th>
      </tr>

      <!-- 2nd Interview 4 Interviewers -->
      <tr>
        ${renderInterviewerTd("Interviewer 1", secondSlots[0])}
        ${renderInterviewerTd("Interviewer 2", secondSlots[1])}
        ${renderInterviewerTd("Interviewer 3", secondSlots[2])}
        ${renderInterviewerTd("Interviewer 4", secondSlots[3])}
      </tr>

      <!-- APPROVED BY Header -->
      <tr>
        <th colspan="4" class="sub-section-header">APPROVED BY</th>
      </tr>

      <!-- Employer Approval Box -->
      <tr>
        <td colspan="4" class="approval-container">
          <div class="approval-box">
            <div class="employer-title">Employer</div>
            <div class="employer-sign-line">
              <div style="font-weight: bold; font-size: 11.5px;">${escapeHtml(employerName)}</div>
              <div>${escapeHtml(employerRole)}</div>
              <div>${escapeHtml(employerCompany)}</div>
              <div style="margin-top: 4px;">Date: ${escapeHtml(approvalDate)}</div>
            </div>
          </div>
        </td>
      </tr>
    </table>

    ${
      data.notes?.trim() || data.strengths?.trim()
        ? `
      <div style="margin-top: 10px; border: 1px solid #000; padding: 6px 8px; font-size: 9.5px; line-height: 1.4;">
        <div style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">Evaluation Notes & Remarks:</div>
        ${data.strengths ? `<div><strong>Strengths:</strong> ${escapeHtml(data.strengths)}</div>` : ""}
        ${data.concerns ? `<div><strong>Areas to Clarify:</strong> ${escapeHtml(data.concerns)}</div>` : ""}
        ${data.notes ? `<div><strong>Notes:</strong> ${escapeHtml(data.notes)}</div>` : ""}
      </div>
    `
        : ""
    }
  </div>
</body>
</html>`;
}

export function exportInterviewEvaluationPdf(
  data: InterviewEvaluationExportData,
  isHrDivisionContext?: boolean
): boolean {
  if (!data) return false;
  try {
    const baseHtml = buildInterviewEvaluationHtml(data, isHrDivisionContext);
    const autoPrintScript = `
      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            try {
              window.focus();
              window.print();
            } catch {}
          }, 350);
        });
      </script>
    `;
    const printableHtml = baseHtml.replace("</body>", `${autoPrintScript}</body>`);
    const blob = new Blob([printableHtml], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
      return true;
    }
  } catch (err) {
    console.warn("Interview evaluation PDF export failed:", err);
  }
  return false;
}
