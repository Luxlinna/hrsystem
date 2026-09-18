import type { HiringRequest } from "../types";
import { resolveDocumentBranding } from "@/services/formLogoService";
import {
  type ExportPdfMode,
  type RequisitionPdfOptions,
  escapeHtml,
  capitalizeWords,
  formatSectionText,
} from "./hiring-request-pdf/pdfFormatHelpers";
import { getPdfPrintStyles } from "./hiring-request-pdf/pdfPrintStyles";
import {
  renderPositionInfoTable,
  renderJobDescriptionBox,
  renderApprovalsSection,
} from "./hiring-request-pdf/renderPdfSections";
import { renderGovernanceWorkflow } from "./hiring-request-pdf/renderGovernanceWorkflow";
import { printHtmlDocument } from "./hiring-request-pdf/printIframeHelper";

export type { ExportPdfMode, RequisitionPdfOptions };

function getStatusBadgeConfig(status?: string) {
  switch (status) {
    case "approved":
      return { label: "Fully Approved & Job Live", bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" };
    case "rejected":
      return { label: "Rejected", bg: "#fee2e2", text: "#991b1b", border: "#fecaca" };
    case "fulfilled":
      return { label: "Position Filled", bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" };
    case "pending_chairman_review":
      return { label: "Stage 4: Chairwoman Review", bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff" };
    case "pending_hr_admin_review":
      return { label: "Stage 3: HR Admin Review", bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe" };
    case "pending_hr_review":
      return { label: "Stage 2: HR Manager Review", bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" };
    default:
      return { label: "Stage 1: Branch Endorsement", bg: "#fef3c7", text: "#92400e", border: "#fde68a" };
  }
}

export function exportHiringRequestPdf(r: HiringRequest, opts?: RequisitionPdfOptions): boolean {
  const mode: ExportPdfMode = opts?.mode || "full_requisition";

  const branding = resolveDocumentBranding({
    businessUnit: opts?.businessUnit || r.branches?.name || r.business_unit,
    department: r.department,
    division: r.division || opts?.division,
    customLogo: opts?.buLogo,
    isHrDivisionContext: opts?.isHrDivisionContext,
  });

  const rawBu = r.branches?.name || r.business_unit || "OPS Solutions Co ., Ltd";
  const isOps = rawBu.toLowerCase().includes("ops");
  const buName = opts?.businessUnit || (branding.isHrDivision ? branding.companyName : (isOps ? "OPS Solutions Co ., Ltd" : rawBu));
  const buLogo = branding.logo;

  const division = opts?.division || r.department || (r.division ? `${r.department} / ${r.division}` : "IT and Development");
  const jobTitle = opts?.jobTitle || r.title || "Mobile Developer";

  const rawDirectReports = opts?.directReportsTo || r.jd_reporting_line || r.hiring_manager_name || "IT Project Manager";
  const directReportsTo = rawDirectReports.replace(/^reports\s+to:?\s*/i, "").trim() || "IT Project Manager";

  const levelGrade = opts?.levelGrade || "G1";
  const rawType = opts?.typeOfPosition || r.employment_type || (r.position_type === "replacement" ? "Replacement" : "Internship");
  const typeOfPosition = capitalizeWords(rawType);

  const preparedDate =
    opts?.preparedDate ||
    (r.created_at
      ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "11 September 2026");

  const workingDays = opts?.workingDays || "Monday to Saturday Half";
  const workingTime = opts?.workingTime || "8:00 am – 5:00 pm";

  const headOfDept = opts?.headOfDeptName || r.hiring_manager_name || r.branch_approved_by;
  const hrAdmin = opts?.hrAdminName || r.hr_admin_approved_by || r.hr_reviewed_by;

  const jobSummaryHtml = formatSectionText(r.jd_summary || r.job_description || r.justification);
  const responsibilitiesHtml = formatSectionText(r.jd_responsibilities);
  const requirementsHtml = formatSectionText(r.jd_requirements);
  const qualificationsHtml = formatSectionText(r.jd_qualifications);

  const reqCode = r.requisition_id || "REQ-DRAFT";
  const formTitle = mode === "full_requisition" ? "Personnel Requisition Form" : "Job Description Form";
  const statusBadge = getStatusBadgeConfig(r.status);

  const salaryStr =
    r.salary_min && r.salary_max
      ? `$${r.salary_min.toLocaleString()} – $${r.salary_max.toLocaleString()}`
      : r.salary_min
      ? `From $${r.salary_min.toLocaleString()}`
      : "Standard Budget Band";

  const recruiter = r.assigned_recruiter_name || r.hr_assigned_to_name || "bong Reasey";

  const metaBadgesHtml =
    mode === "full_requisition"
      ? `<div class="meta-badges-row">
           <div style="display: flex; align-items: center; gap: 8px;">
             <span class="req-badge">${escapeHtml(reqCode)}</span>
             <span class="status-pill">${escapeHtml(statusBadge.label)}</span>
             <span style="font-size: 10.5px; font-weight: 700; color: #475569; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">PRIORITY: ${(r.urgency || "medium").toUpperCase()}</span>
           </div>
           <div style="font-size: 11px; color: #64748b;">
             <strong>Prepared Date:</strong> ${escapeHtml(preparedDate)}
           </div>
         </div>`
      : "";

  const justificationHtml =
    mode === "full_requisition" && r.justification
      ? `<div class="section-title">&nbsp;&nbsp;II.&nbsp;&nbsp;&nbsp;&nbsp;Business Need &amp; Justification</div>
         <div class="justification-card">
           <strong style="color: #b45309; display: block; margin-bottom: 2px;">Business Need:</strong>
           ${escapeHtml(r.justification)}
         </div>`
      : "";

  const jdSectionNum = mode === "full_requisition" && r.justification ? "III." : "II.";
  const approvalsSectionNum = mode === "full_requisition" ? "V." : "I.";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(formTitle)} — ${escapeHtml(jobTitle)} (${escapeHtml(buName)})</title>
  <style>${getPdfPrintStyles(statusBadge)}</style>
</head>
<body>
  <table class="print-page-layout">
    <thead>
      <tr><td><div class="page-header-spacer"></div></td></tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="page-container">
            <div class="header-top-row">
              <div class="header-logo-box">
                <img src="${buLogo}" alt="${escapeHtml(buName)}" class="header-logo-img" />
              </div>
              <div class="header-title-box">
                <h1 class="form-title">${escapeHtml(formTitle)}</h1>
              </div>
            </div>
            <div class="header-divider"></div>

            ${metaBadgesHtml}

            ${renderPositionInfoTable({
              mode,
              buName,
              division,
              jobTitle,
              headcount: r.headcount,
              directReportsTo,
              levelGrade,
              typeOfPosition,
              preparedDate,
              workingDays,
              workingTime,
              hiringManagerName: r.hiring_manager_name,
              recruiter,
              salaryStr,
              requestedByName: r.requested_by_name,
            })}

            ${justificationHtml}

            ${renderJobDescriptionBox(jdSectionNum, jobSummaryHtml, responsibilitiesHtml, requirementsHtml, qualificationsHtml)}

            ${mode === "full_requisition" ? renderGovernanceWorkflow(r) : ""}

            ${renderApprovalsSection(approvalsSectionNum, headOfDept, hrAdmin)}

            <div class="footer-bar">
              <div>HRM_OPS Enterprise HRMS &middot; ${escapeHtml(buName)}</div>
              <div>Confidential Personnel Document &middot; Ref: ${escapeHtml(reqCode)} &middot; Printed: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr><td><div class="page-footer-spacer"></div></td></tr>
    </tfoot>
  </table>
</body>
</html>`;

  return printHtmlDocument(html);
}
