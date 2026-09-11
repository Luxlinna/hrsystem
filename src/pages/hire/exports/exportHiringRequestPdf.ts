import type { HiringRequest } from "../types";
import { OPS_LOGO_BASE64 } from "./opsLogoBase64";
import { formatDateTime } from "../hireUtils";

export type ExportPdfMode = "full_requisition" | "job_description";

export interface RequisitionPdfOptions {
  mode?: ExportPdfMode;
  buLogo: string;
  businessUnit?: string;
  division?: string;
  jobTitle?: string;
  directReportsTo?: string;
  levelGrade?: string;
  typeOfPosition?: string;
  preparedDate?: string;
  workingDays?: string;
  workingTime?: string;
  headOfDeptName?: string;
  hrAdminName?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalizeWords(str: string): string {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const ACTION_VERB_REGEX =
  /^(assist|write|implement|build|integrate|support|perform|test|help|maintain|document|prepare|work|participate|communicate|demonstrate|understand|learn|ensure|report|fix|collaborate|troubleshoot|review|create|design|manage|lead|develop|coordinate|conduct|analyze|optimize|handle|provide|follow|execute|deliver|monitor|deploy|gain|allowance|currently|basic|familiarity|strong|ability)\b/i;

function isCategoryHeader(line: string): boolean {
  const clean = line.replace(/^[-*•\d.)\s]+/, "").trim();
  if (!clean) return false;
  if (clean.endsWith(":")) return true;
  if (
    /^(Mobile Application|Coding & Debugging|Testing & Quality|Testing & QA|Deployment &|Documentation|Team Collaboration|Web Development|Code Quality|Hard Skills|Soft Skills|Required|Preferred|Qualifications|Benefits|Technical Skills|Core Responsibilities)/i.test(
      clean
    )
  ) {
    return true;
  }
  // Short line without ending punctuation and not starting with an action verb
  if (clean.length < 48 && !clean.endsWith(".") && !ACTION_VERB_REGEX.test(clean)) {
    return true;
  }
  return false;
}

function formatSectionText(text?: string | null): string {
  if (!text || !text.trim()) {
    return "<div style=\"color: #94a3b8; font-style: italic; padding: 4px 0;\">None specified</div>";
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const htmlParts: string[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      htmlParts.push(
        `<ul style="margin: 3px 0 10px 20px; padding: 0; list-style-type: disc;">${currentList
          .map(
            (li) =>
              `<li style="margin-bottom: 4px; line-height: 1.5; color: #334155; font-size: 11.5px; text-align: justify;">${escapeHtml(
                li
              )}</li>`
          )
          .join("")}</ul>`
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a category/subheading
    if (isCategoryHeader(line)) {
      flushList();
      const cleanHeader = line.replace(/^[-*•\d.)\s]+/, "").replace(/:$/, "").trim();
      htmlParts.push(
        `<div style="font-weight: 800; margin-top: 10px; margin-bottom: 4px; color: #1e293b; font-size: 12px; padding-left: 2px;">${escapeHtml(
          cleanHeader
        )}</div>`
      );
      continue;
    }

    // Check if bullet point
    const isBullet = /^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line);
    if (isBullet) {
      const clean = line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
      currentList.push(clean);
      continue;
    }

    // Regular paragraph
    flushList();
    htmlParts.push(
      `<p style="margin: 0 0 8px 0; line-height: 1.55; color: #334155; font-size: 11.5px; text-align: justify;">${escapeHtml(
        line
      )}</p>`
    );
  }
  flushList();

  return htmlParts.join("");
}

export function exportHiringRequestPdf(r: HiringRequest, opts?: RequisitionPdfOptions): boolean {
  const mode: ExportPdfMode = opts?.mode || "full_requisition";

  const rawBu = r.branches?.name || r.business_unit || "OPS Solutions Co ., Ltd";
  const isOps = rawBu.toLowerCase().includes("ops");
  const buName = opts?.businessUnit || (isOps ? "OPS Solutions Co ., Ltd" : rawBu);

  // BU Logo
  const buLogo = opts?.buLogo || (isOps ? OPS_LOGO_BASE64 : "/logo-full.png");

  const division = opts?.division || r.department || (r.division ? `${r.department} / ${r.division}` : "IT and Development");
  const jobTitle = opts?.jobTitle || r.title || "Mobile Developer";

  // Clean duplicate "Reports to:" prefix
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

  const getStatusBadge = () => {
    switch (r.status) {
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
  };

  const statusBadge = getStatusBadge();

  const salaryStr =
    r.salary_min && r.salary_max
      ? `$${r.salary_min.toLocaleString()} – $${r.salary_max.toLocaleString()}`
      : r.salary_min
      ? `From $${r.salary_min.toLocaleString()}`
      : "Standard Budget Band";

  const recruiter = r.assigned_recruiter_name || r.hr_assigned_to_name || "bong Reasey";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(formTitle)} — ${escapeHtml(jobTitle)} (${escapeHtml(buName)})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 11.5px;
      line-height: 1.45;
    }
    .page-container {
      width: 100%;
      padding: 12mm 16mm;
      box-sizing: border-box;
    }
    .header-top-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      gap: 16px;
    }
    .header-logo-box {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
    }
    .header-logo-img {
      max-height: 95px;
      max-width: 320px;
      width: auto;
      height: auto;
      object-fit: contain;
      object-position: left center;
      display: block;
    }
    .header-title-box {
      flex: 1 1 auto;
      text-align: right;
    }
    .form-title {
      font-size: 20px;
      font-weight: 900;
      color: #253C7D;
      margin: 0;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .header-divider {
      height: 2.5px;
      background-color: #253C7D;
      width: 100%;
      margin: 6px 0 14px 0;
    }
    .meta-badges-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .req-badge {
      font-family: monospace;
      font-size: 12px;
      font-weight: 800;
      background: #eef2ff;
      color: #253C7D;
      border: 1px solid #c7d2fe;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .status-pill {
      font-size: 10.5px;
      font-weight: 800;
      padding: 2px 10px;
      border-radius: 9999px;
      background: ${statusBadge.bg};
      color: ${statusBadge.text};
      border: 1px solid ${statusBadge.border};
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #253C7D;
      margin: 14px 0 6px 0;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #253C7D;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .info-table td {
      border: 1px solid #94a3b8;
      padding: 6px 10px;
      font-size: 11.5px;
      vertical-align: middle;
      color: #0f172a;
    }
    .info-table .lbl {
      font-weight: 700;
      width: 25%;
      background-color: #f1f5f9;
      color: #1e293b;
    }
    .justification-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 3.5px solid #f59e0b;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 14px;
      font-size: 11.5px;
      line-height: 1.5;
      color: #334155;
    }
    .general-box {
      border: 1.5px solid #253C7D;
      border-radius: 4px;
      overflow: hidden;
      font-size: 11.5px;
      margin-bottom: 16px;
    }
    .box-header {
      padding: 7px 12px;
      font-weight: 800;
      font-size: 12.5px;
      background-color: #f1f5f9;
      color: #253C7D;
      border-bottom: 1px solid #94a3b8;
      border-top: 1px solid #94a3b8;
      letter-spacing: 0.2px;
    }
    .box-header:first-child {
      border-top: none;
    }
    .box-content {
      padding: 10px 14px;
      background-color: #ffffff;
      color: #334155;
      line-height: 1.55;
    }
    .workflow-box {
      border: 1.5px solid #253C7D;
      border-radius: 4px;
      margin-bottom: 16px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .workflow-grid {
      width: 100%;
      border-collapse: collapse;
    }
    .workflow-grid td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      width: 25%;
      vertical-align: top;
      background: #fafafa;
    }
    .wf-stage-num {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #253C7D;
      margin-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .wf-status-badge {
      font-size: 9.5px;
      font-weight: 800;
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .wf-officer-name {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }
    .wf-date {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 4px;
    }
    .approvals-container {
      margin-top: 20px;
      page-break-inside: avoid;
    }
    .approvals-flex {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }
    .approval-col {
      width: 46%;
      text-align: center;
    }
    .approval-title {
      font-weight: 800;
      font-size: 12px;
      color: #253C7D;
      margin-bottom: 44px;
    }
    .khmer-font {
      font-family: "Khmer OS Battambang", "Siemreap", "DaunPenh", "Khmer OS", sans-serif;
    }
    .sig-line {
      border-bottom: 1.5px solid #64748b;
      width: 85%;
      margin: 0 auto 8px auto;
    }
    .role-khmer {
      font-family: "Khmer OS Battambang", "Siemreap", "DaunPenh", "Khmer OS", sans-serif;
      font-size: 12px;
      font-weight: 700;
      color: #253C7D;
      margin-bottom: 2px;
    }
    .role-en {
      font-size: 11.5px;
      font-weight: 700;
      color: #1e293b;
    }
    .signee-name {
      font-size: 11.5px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
    }
    .sig-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 5px;
      font-weight: 600;
    }
    .footer-bar {
      margin-top: 16px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 9.5px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Header: Logo on Left & Title on Right on the Same Line -->
    <div class="header-top-row">
      <div class="header-logo-box">
        <img src="${buLogo}" alt="${escapeHtml(buName)}" class="header-logo-img" />
      </div>
      <div class="header-title-box">
        <h1 class="form-title">${escapeHtml(formTitle)}</h1>
      </div>
    </div>
    <div class="header-divider"></div>

    <!-- Requisition Meta Badges (in Full Requisition Mode) -->
    ${
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
        : ""
    }

    <!-- I. Position Information Table -->
    <div class="section-title">&nbsp;&nbsp;I.&nbsp;&nbsp;&nbsp;&nbsp;Position Information</div>
    <table class="info-table">
      <tr>
        <td class="lbl">Business Unit:</td>
        <td colspan="3" style="font-weight: 700; color: #0f172a;">${escapeHtml(buName)}</td>
      </tr>
      <tr>
        <td class="lbl">Division / Dept:</td>
        <td colspan="3">${escapeHtml(division)}</td>
      </tr>
      <tr>
        <td class="lbl">Job Title:</td>
        <td colspan="3" style="font-weight: 700; color: #253C7D;">
          ${escapeHtml(jobTitle)}
          ${r.headcount ? ` <span style="font-size: 10px; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">(${r.headcount} ${r.headcount > 1 ? "Openings" : "Opening"})</span>` : ""}
        </td>
      </tr>
      <tr>
        <td class="lbl">Direct Reports to:</td>
        <td colspan="3" style="font-weight: 600;">${escapeHtml(directReportsTo)}</td>
      </tr>
      <tr>
        <td class="lbl" style="width: 25%;">Level/Grade:</td>
        <td class="lbl" style="width: 37.5%;">Type of Position</td>
        <td class="lbl" style="width: 37.5%;" colspan="2">Prepared Date</td>
      </tr>
      <tr>
        <td style="font-weight: 600;">${escapeHtml(levelGrade)}</td>
        <td style="font-weight: 600;">${escapeHtml(typeOfPosition)}</td>
        <td colspan="2" style="font-weight: 600;">${escapeHtml(preparedDate)}</td>
      </tr>
      ${
        mode === "full_requisition"
          ? `<tr>
               <td class="lbl">Hiring Manager:</td>
               <td style="font-weight: 600;">${escapeHtml(r.hiring_manager_name || "—")}</td>
               <td class="lbl" style="width: 20%;">Assigned Recruiter:</td>
               <td style="font-weight: 600; color: #6b21a8;">${escapeHtml(recruiter)}</td>
             </tr>
             <tr>
               <td class="lbl">Salary Range:</td>
               <td style="font-weight: 600;">${escapeHtml(salaryStr)}</td>
               <td class="lbl">Requested By:</td>
               <td>${escapeHtml(r.requested_by_name || "—")}</td>
             </tr>`
          : ""
      }
      <tr>
        <td class="lbl">Working Days</td>
        <td colspan="3">${escapeHtml(workingDays)}</td>
      </tr>
      <tr>
        <td class="lbl">Working Time:</td>
        <td colspan="3">${escapeHtml(workingTime)}</td>
      </tr>
    </table>

    <!-- II. Business Justification (in Full Requisition Mode) -->
    ${
      mode === "full_requisition" && r.justification
        ? `<div class="section-title">&nbsp;&nbsp;II.&nbsp;&nbsp;&nbsp;&nbsp;Business Need &amp; Justification</div>
           <div class="justification-card">
             <strong style="color: #b45309; display: block; margin-bottom: 2px;">Business Need:</strong>
             ${escapeHtml(r.justification)}
           </div>`
        : ""
    }

    <!-- III. General Description / Job Specifications -->
    <div class="section-title">&nbsp;&nbsp;${mode === "full_requisition" && r.justification ? "III." : "II."}&nbsp;&nbsp;&nbsp;&nbsp;Job Description &amp; Specifications</div>
    <div class="general-box">
      <!-- 1. Job Summary -->
      <div class="box-header">Job Summary</div>
      <div class="box-content">
        ${jobSummaryHtml}
      </div>

      <!-- 2. Duties and Responsibilities -->
      <div class="box-header">Duties and Responsibilities</div>
      <div class="box-content">
        ${responsibilitiesHtml}
      </div>

      <!-- 3. Required Qualifications -->
      <div class="box-header">Required Qualifications</div>
      <div class="box-content">
        ${requirementsHtml}
      </div>

      <!-- 4. Preferred / Education Qualifications -->
      ${
        qualificationsHtml && qualificationsHtml !== "<div style=\"color: #94a3b8; font-style: italic; padding: 4px 0;\">None specified</div>"
          ? `<div class="box-header">Preferred Qualifications</div>
             <div class="box-content">${qualificationsHtml}</div>`
          : ""
      }
    </div>

    <!-- IV. Enterprise Governance & 4-Stage Approval Process (in Full Requisition Mode) -->
    ${
      mode === "full_requisition"
        ? `<div class="section-title">&nbsp;&nbsp;IV.&nbsp;&nbsp;&nbsp;&nbsp;Governance &amp; Multi-Stage Approval Process</div>
           <div class="workflow-box">
             <table class="workflow-grid">
               <tr>
                 <!-- Stage 1: BU CEO -->
                 <td>
                   <div class="wf-stage-num">Stage 1: BU CEO Endorsement</div>
                   ${
                     r.branch_approved_by
                       ? `<span class="wf-status-badge" style="background:#fef3c7;color:#92400e;">✓ ENDORSED</span>
                          <div class="wf-officer-name">${escapeHtml(r.branch_approved_by)}</div>
                          <div class="wf-date">${formatDateTime(r.branch_approved_at)}</div>`
                       : `<span class="wf-status-badge" style="background:#f1f5f9;color:#64748b;">PENDING</span>
                          <div class="wf-officer-name" style="color:#94a3b8;font-style:italic;">BU CEO / Director</div>
                          <div class="wf-date">Pending Endorsement</div>`
                   }
                 </td>

                 <!-- Stage 2: HR Manager -->
                 <td>
                   <div class="wf-stage-num">Stage 2: HR Manager Review</div>
                   ${
                     r.hr_reviewed_by
                       ? `<span class="wf-status-badge" style="background:#e0f2fe;color:#0369a1;">✓ REVIEWED</span>
                          <div class="wf-officer-name">${escapeHtml(r.hr_reviewed_by)}</div>
                          <div class="wf-date">${formatDateTime(r.hr_reviewed_at)}</div>`
                       : `<span class="wf-status-badge" style="background:#f1f5f9;color:#64748b;">PENDING</span>
                          <div class="wf-officer-name" style="color:#94a3b8;font-style:italic;">HR Manager</div>
                          <div class="wf-date">Pending Review</div>`
                   }
                 </td>

                 <!-- Stage 3: HR Admin Director -->
                 <td>
                   <div class="wf-stage-num">Stage 3: HR Admin Approval</div>
                   ${
                     r.hr_admin_approved_by
                       ? `<span class="wf-status-badge" style="background:#e0e7ff;color:#3730a3;">✓ APPROVED</span>
                          <div class="wf-officer-name">${escapeHtml(r.hr_admin_approved_by)}</div>
                          <div class="wf-date">${formatDateTime(r.hr_admin_approved_at)}</div>`
                       : `<span class="wf-status-badge" style="background:#f1f5f9;color:#64748b;">PENDING</span>
                          <div class="wf-officer-name" style="color:#94a3b8;font-style:italic;">HR Admin Director</div>
                          <div class="wf-date">Pending Approval</div>`
                   }
                 </td>

                 <!-- Stage 4: Chairwoman -->
                 <td>
                   <div class="wf-stage-num">Stage 4: Chairwoman Auth</div>
                   ${
                     r.chairman_approved_by
                       ? `<span class="wf-status-badge" style="background:#d1fae5;color:#065f46;">✓ AUTHORIZED</span>
                          <div class="wf-officer-name">${escapeHtml(r.chairman_approved_by)}</div>
                          <div class="wf-date">${formatDateTime(r.chairman_approved_at)}</div>`
                       : `<span class="wf-status-badge" style="background:#f1f5f9;color:#64748b;">PENDING</span>
                          <div class="wf-officer-name" style="color:#94a3b8;font-style:italic;">Chairwoman</div>
                          <div class="wf-date">Pending Authorization</div>`
                   }
                 </td>
               </tr>
             </table>
           </div>`
        : ""
    }

    <!-- Approvals (Signatures) -->
    <div class="approvals-container">
      <div class="section-title">&nbsp;&nbsp;${mode === "full_requisition" ? "V." : "I."}&nbsp;&nbsp;&nbsp;&nbsp;Approvals (Signatures)</div>
      <div class="approvals-flex">
        <!-- Left: Head of Department -->
        <div class="approval-col">
          <div class="approval-title">
            <span class="khmer-font">សុំដោយ</span>/Acknowledged by
          </div>
          <div class="sig-line"></div>
          <div class="role-khmer">ប្រធាននាយកដ្ឋាន</div>
          <div class="role-en">Head of Department</div>
          ${headOfDept ? `<div class="signee-name">(${escapeHtml(headOfDept)})</div>` : ""}
          <div class="sig-date">Date: ____/____/_____</div>
        </div>

        <!-- Right: HR and Administrative Division -->
        <div class="approval-col">
          <div class="approval-title">
            <span class="khmer-font">ទទួលស្គាល់ដោយ</span>/Acknowledged by
          </div>
          <div class="sig-line"></div>
          <div class="role-khmer">នាយក នាយកដ្ឋានធនធានមនុស្ស និងរដ្ឋបាល</div>
          <div class="role-en">HR and Administrative Division</div>
          ${hrAdmin ? `<div class="signee-name">(${escapeHtml(hrAdmin)})</div>` : ""}
          <div class="sig-date">Date: ____/____/_____</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-bar">
      <div>HRM_OPS Enterprise HRMS &middot; ${escapeHtml(buName)}</div>
      <div>Confidential Personnel Document &middot; Ref: ${escapeHtml(reqCode)} &middot; Printed: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
    </div>
  </div>
</body>
</html>`;

  // Print via a hidden iframe to eliminate the persistent "about:blank" tab left behind by window.open
  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // Fallback if cross-origin or blocked
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }
      }, 350);

      return true;
    }
  } catch {
    // Fallback if iframe creation fails
  }

  // Fallback: window.open with auto-close on afterprint
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
    return true;
  }
  return false;
}
