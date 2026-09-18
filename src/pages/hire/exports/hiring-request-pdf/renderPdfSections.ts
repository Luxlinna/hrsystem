import { escapeHtml, type ExportPdfMode } from "./pdfFormatHelpers";

export interface PositionInfoOptions {
  mode: ExportPdfMode;
  buName: string;
  division: string;
  jobTitle: string;
  headcount?: number;
  directReportsTo: string;
  levelGrade: string;
  typeOfPosition: string;
  preparedDate: string;
  workingDays: string;
  workingTime: string;
  hiringManagerName?: string;
  recruiter: string;
  salaryStr: string;
  requestedByName?: string;
}

export function renderPositionInfoTable(opt: PositionInfoOptions): string {
  const openingsBadge = opt.headcount
    ? ` <span style="font-size: 10px; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">(${opt.headcount} ${opt.headcount > 1 ? "Openings" : "Opening"})</span>`
    : "";

  return `
    <div class="section-title">&nbsp;&nbsp;I.&nbsp;&nbsp;&nbsp;&nbsp;Position Information</div>
    <table class="info-table">
      <tr>
        <td class="lbl">Business Unit:</td>
        <td colspan="3" style="font-weight: 700; color: #0f172a;">${escapeHtml(opt.buName)}</td>
      </tr>
      <tr>
        <td class="lbl">Division / Dept:</td>
        <td colspan="3">${escapeHtml(opt.division)}</td>
      </tr>
      <tr>
        <td class="lbl">Job Title:</td>
        <td colspan="3" style="font-weight: 700; color: #253C7D;">
          ${escapeHtml(opt.jobTitle)}${openingsBadge}
        </td>
      </tr>
      <tr>
        <td class="lbl">Direct Reports to:</td>
        <td colspan="3" style="font-weight: 600;">${escapeHtml(opt.directReportsTo)}</td>
      </tr>
      <tr>
        <td class="lbl" style="width: 25%;">Level/Grade:</td>
        <td class="lbl" style="width: 37.5%;">Type of Position</td>
        <td class="lbl" style="width: 37.5%;" colspan="2">Prepared Date</td>
      </tr>
      <tr>
        <td style="font-weight: 600;">${escapeHtml(opt.levelGrade)}</td>
        <td style="font-weight: 600;">${escapeHtml(opt.typeOfPosition)}</td>
        <td colspan="2" style="font-weight: 600;">${escapeHtml(opt.preparedDate)}</td>
      </tr>
      ${
        opt.mode === "full_requisition"
          ? `<tr>
               <td class="lbl">Hiring Manager:</td>
               <td style="font-weight: 600;">${escapeHtml(opt.hiringManagerName || "—")}</td>
               <td class="lbl" style="width: 20%;">Assigned Recruiter:</td>
               <td style="font-weight: 600; color: #6b21a8;">${escapeHtml(opt.recruiter)}</td>
             </tr>
             <tr>
               <td class="lbl">Salary Range:</td>
               <td style="font-weight: 600;">${escapeHtml(opt.salaryStr)}</td>
               <td class="lbl">Requested By:</td>
               <td>${escapeHtml(opt.requestedByName || "—")}</td>
             </tr>`
          : ""
      }
      <tr>
        <td class="lbl">Working Days</td>
        <td colspan="3">${escapeHtml(opt.workingDays)}</td>
      </tr>
      <tr>
        <td class="lbl">Working Time:</td>
        <td colspan="3">${escapeHtml(opt.workingTime)}</td>
      </tr>
    </table>
  `;
}

export function renderJobDescriptionBox(
  sectionNum: string,
  summaryHtml: string,
  responsibilitiesHtml: string,
  requirementsHtml: string,
  qualificationsHtml: string
): string {
  const preferredHtml =
    qualificationsHtml && qualificationsHtml !== "<div style=\"color: #94a3b8; font-style: italic; padding: 4px 0;\">None specified</div>"
      ? `<div class="box-header">Preferred Qualifications</div>
         <div class="box-content">${qualificationsHtml}</div>`
      : "";

  return `
    <div class="section-title">&nbsp;&nbsp;${sectionNum}&nbsp;&nbsp;&nbsp;&nbsp;Job Description &amp; Specifications</div>
    <div class="general-box">
      <div class="box-header">Job Summary</div>
      <div class="box-content">${summaryHtml}</div>
      <div class="box-header">Duties and Responsibilities</div>
      <div class="box-content">${responsibilitiesHtml}</div>
      <div class="box-header">Required Qualifications</div>
      <div class="box-content">${requirementsHtml}</div>
      ${preferredHtml}
    </div>
  `;
}

export function renderApprovalsSection(
  sectionNum: string,
  headOfDept?: string,
  hrAdmin?: string
): string {
  return `
    <div class="approvals-container">
      <div class="section-title">&nbsp;&nbsp;${sectionNum}&nbsp;&nbsp;&nbsp;&nbsp;Approvals (Signatures)</div>
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
  `;
}
