import {
  resolveDocumentBranding,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
} from "@/services/formLogoService";
import type {
  InterviewResultRecommendation,
  InterviewerSlot,
  InterviewEvaluationExportData,
} from "./interviewEvaluationPdfTypes";
import { interviewEvaluationPdfStyles } from "./interviewEvaluationPdfStyles";
import {
  escapeHtml,
  formatOrdinalDate,
  renderInterviewerTd,
} from "./interviewEvaluationPdfHelpers";

export type {
  InterviewResultRecommendation,
  InterviewerSlot,
  InterviewEvaluationExportData,
};

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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>INTERVIEW RESULTS - ${escapeHtml(data.candidate.full_name)}</title>
  <style>
    ${interviewEvaluationPdfStyles}
  </style>
</head>
<body>
  <div class="page-container">
    <div class="company-header">
      <img src="${branding.logo}" class="company-logo" alt="Brand Logo" />
      <div class="company-info">
        <div class="company-name-kh">${escapeHtml(branding.companyKhmer || getOfficialCompanyNameKhmer())}</div>
        <div class="company-name-en">${escapeHtml(branding.companyName || getOfficialCompanyNameEnglish())}</div>
        <div>Building TK Roundabout No. 6, Floor 2nd, Office No. A2-06F, Street No. 289, 12, Sangkat Boeng Kak Ti Pir, Khan Tuol Kouk, Phnom Penh</div>
        <div>Phone: 095 224 424 &nbsp;|&nbsp; TIN: K005-902204561</div>
      </div>
    </div>

    <table class="results-table">
      <tr>
        <th colspan="4" class="table-title">INTERVIEW RESULTS</th>
      </tr>
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
      <tr>
        <th colspan="4" class="sub-section-header">1<sup>st</sup> Interview</th>
      </tr>
      <tr>
        ${renderInterviewerTd("Interviewer 1", firstSlots[0])}
        ${renderInterviewerTd("Interviewer 2", firstSlots[1])}
        ${renderInterviewerTd("Interviewer 3", firstSlots[2])}
        ${renderInterviewerTd("Interviewer 4", firstSlots[3])}
      </tr>
      <tr>
        <th colspan="4" class="sub-section-header">2<sup>nd</sup> Interview</th>
      </tr>
      <tr>
        ${renderInterviewerTd("Interviewer 1", secondSlots[0])}
        ${renderInterviewerTd("Interviewer 2", secondSlots[1])}
        ${renderInterviewerTd("Interviewer 3", secondSlots[2])}
        ${renderInterviewerTd("Interviewer 4", secondSlots[3])}
      </tr>
      <tr>
        <th colspan="4" class="sub-section-header">APPROVED BY</th>
      </tr>
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

    ${data.notes?.trim() || data.strengths?.trim() ? `
      <div style="margin-top: 10px; border: 1px solid #000; padding: 6px 8px; font-size: 9.5px; line-height: 1.4;">
        <div style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">Evaluation Notes & Remarks:</div>
        ${data.strengths ? `<div><strong>Strengths:</strong> ${escapeHtml(data.strengths)}</div>` : ""}
        ${data.concerns ? `<div><strong>Areas to Clarify:</strong> ${escapeHtml(data.concerns)}</div>` : ""}
        ${data.notes ? `<div><strong>Notes:</strong> ${escapeHtml(data.notes)}</div>` : ""}
      </div>
    ` : ""}
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
