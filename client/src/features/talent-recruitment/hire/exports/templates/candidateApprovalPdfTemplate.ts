import type { CandidateApproval } from "../../types";
import {
  resolveDocumentBranding,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
} from "@/services/formLogoService";
import { candidateApprovalPdfStyles } from "./candidateApprovalPdfStyles";
import { renderSignatoryBox } from "./candidateApprovalPdfSignatoryBox";

export function buildCandidateApprovalHtml(
  approval: CandidateApproval,
  isHrDivisionContext?: boolean
): string {
  const panelsHtml =
    approval.interview_panels && approval.interview_panels.length > 0
      ? approval.interview_panels
          .map(
            (p) => `
      <tr>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10px;">${p.name || "—"}</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10px; text-align: center;">${p.date_time || "—"}</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10px; text-align: center;">${p.position || "—"}</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10px; text-align: center; font-style: italic; color: #1e3a8a;">
          ${p.signature || "Verified"}
        </td>
      </tr>
    `
          )
          .join("")
      : `
      <tr>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10px;">${approval.hiring_manager || "Hiring Manager"}</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10px; text-align: center;">11 Sep 2026 3:00PM</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10px; text-align: center;">Hiring Manager</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10px; text-align: center; font-style: italic; color: #1e3a8a;">Signed</td>
      </tr>
    `;

  const sigs = approval.signatories;

  // When exported at HR Division: MUST WORK WITH UNI LOGO (NO OPS), even if candidate was from OPS
  const branding = resolveDocumentBranding({
    businessUnit: approval.business_unit,
    department: approval.department,
    isHrDivisionContext,
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Candidate Approval Form - ${approval.form_number}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${candidateApprovalPdfStyles}
  </style>
</head>
<body>
  <div class="caf-page">
    <!-- Header Block -->
    <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px;">
      <div style="display: flex; align-items: flex-start; gap: 10px; max-width: 82%;">
        <div style="width: 52px; height: 52px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          <img src="${branding.logo}" style="width: 48px; height: 48px; object-fit: contain;" alt="Brand Logo" />
        </div>
        <div style="font-size: 8.5px; line-height: 1.3; color: #111;">
          <div style="font-family: 'Kantumruy Pro', sans-serif; font-size: 10.5px; font-weight: bold; color: #111;">
            ${branding.companyKhmer || getOfficialCompanyNameKhmer()}
          </div>
          <div style="font-weight: bold; font-size: 9.5px; margin-bottom: 1px;">
            ${branding.companyName || getOfficialCompanyNameEnglish()}
          </div>
          <div style="font-family: 'Kantumruy Pro', sans-serif; font-size: 7.5px; color: #222;">
            ផ្ទះលេខ TK Roundabout លេខ 6 ជាន់ទី 2 ការិយាល័យលេខ A2-06F, ផ្លូវលេខ 289, 12 សង្កាត់ បឹងកក់ទី 2, ខណ្ឌទួលគោក, ភ្នំពេញ, កម្ពុជា
          </div>
          <div style="font-size: 7.5px; color: #222;">
            Building TK Roundabout No. 6, Floor 2nd, Office No. A2-06F, Street No. 289, 12, Sangkat Boeng Kak Ti Pir, Khan Tuol Kouk, Phnom Penh, Cambodia.
          </div>
          <div style="font-size: 7.5px; font-weight: 600; color: #111; margin-top: 1px;">
            លេខទូរស័ព្ទ/Phone: 095 224 424 &nbsp;&nbsp;|&nbsp;&nbsp; លេខអត្តសញ្ញាណកម្មសារពើពន្ធ/TIN: K005-902204561
          </div>
        </div>
      </div>
    </div>

    <!-- Title & Form Number -->
    <div style="position: relative; text-align: center; border-bottom: 2px solid #111; padding-bottom: 3px; margin-bottom: 6px;">
      <div style="font-size: 14px; font-weight: bold; text-decoration: underline; letter-spacing: 0.3px; display: inline-block;">
        Candidate Approval Form
      </div>
      <div style="position: absolute; right: 0; bottom: 3px; font-size: 9.5px; font-weight: 700; white-space: nowrap;">
        Rec: ${approval.form_number}
      </div>
    </div>

    <!-- SECTION I -->
    <div class="sec-header">I. CANDIDATE & ROLE OVERVIEW</div>
    <table class="caf-table">
      <tr>
        <td class="label-cell">Candidate Name:</td>
        <td class="value-cell" style="font-weight: 600;">${approval.candidate_name}</td>
        <td class="label-cell">Gender:</td>
        <td class="value-cell">${approval.gender || "Female"}</td>
      </tr>
      <tr>
        <td class="label-cell">Position Applied for:</td>
        <td class="value-cell" style="font-weight: 600;">${approval.position_applied}</td>
        <td class="label-cell">Business Unit:</td>
        <td class="value-cell" style="font-weight: 600;">${approval.business_unit || "—"}</td>
      </tr>
      <tr>
        <td class="label-cell">Department:</td>
        <td class="value-cell">${approval.department || "—"}</td>
        <td class="label-cell">Hiring Manager:</td>
        <td class="value-cell">${approval.hiring_manager || "—"}</td>
      </tr>
      <tr>
        <td class="label-cell">Current Salary:</td>
        <td class="value-cell">${approval.current_salary || "—"}</td>
        <td class="label-cell">Expectation Salary:</td>
        <td class="value-cell" style="background-color: #0284c7; color: #fff; font-weight: bold;">${approval.expectation_salary || "—"}</td>
      </tr>
      <tr>
        <td class="label-cell">Current Benefit:</td>
        <td class="value-cell">${approval.current_benefit || "—"}</td>
        <td class="label-cell">Notice Period:</td>
        <td class="value-cell">${approval.notice_period || "1 Month"}</td>
      </tr>
    </table>

    <!-- SECTION II -->
    <div class="sec-header">II. Candidate Evaluation Summary</div>
    <table class="caf-table">
      <thead>
        <tr style="background-color: #f3f4f6; text-align: center;">
          <th style="width: 25%; font-size: 9.5px; padding: 3px; border: 1px solid #111; text-decoration: underline;">Education and Skill</th>
          <th style="width: 25%; font-size: 9.5px; padding: 3px; border: 1px solid #111; text-decoration: underline;">Work Experience</th>
          <th style="width: 25%; font-size: 9.5px; padding: 3px; border: 1px solid #111; text-decoration: underline;">Strengths</th>
          <th style="width: 25%; font-size: 9.5px; padding: 3px; border: 1px solid #111; text-decoration: underline;">Improvement</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="vertical-align: top; height: 95px; font-size: 9px; line-height: 1.3; padding: 5px;">${approval.education_and_skill || "—"}</td>
          <td style="vertical-align: top; height: 95px; font-size: 9px; line-height: 1.3; padding: 5px;">${approval.work_experience || "—"}</td>
          <td style="vertical-align: top; height: 95px; font-size: 9px; line-height: 1.3; padding: 5px;">${approval.strengths || "—"}</td>
          <td style="vertical-align: top; height: 95px; font-size: 9px; line-height: 1.3; padding: 5px;">${approval.improvement || "—"}</td>
        </tr>
        <tr>
          <td colspan="4" style="border: 1px solid #111; padding: 5px 6px;">
            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 2px; font-size: 10px;">Overall Assessment:</div>
            <div style="font-size: 9px; line-height: 1.3; color: #111;">
              ${approval.overall_assessment || "Candidate has demonstrated high competencies and is recommended for employment."}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Interview Panels Subtable -->
    <div style="font-weight: bold; font-size: 10px; margin-top: 4px; margin-bottom: 2px;">Interview Panels</div>
    <table class="caf-table" style="margin-bottom: 6px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="width: 32%; text-align: center; border: 1px solid #111; padding: 2.5px; font-size: 9.5px;">Interview Panels</th>
          <th style="width: 28%; text-align: center; border: 1px solid #111; padding: 2.5px; font-size: 9.5px;">Date Time</th>
          <th style="width: 22%; text-align: center; border: 1px solid #111; padding: 2.5px; font-size: 9.5px;">Position</th>
          <th style="width: 18%; text-align: center; border: 1px solid #111; padding: 2.5px; font-size: 9.5px;">Signature</th>
        </tr>
      </thead>
      <tbody>
        ${panelsHtml}
      </tbody>
    </table>

    <!-- SECTION III -->
    <div class="sec-header">III. Final Approval</div>
    <div style="display: flex; border: 1px solid #111; min-height: 125px;">
      ${renderSignatoryBox("CEO (Business Unit)", sigs?.ceo?.assigned_name || "CEO (Business Unit)", sigs?.ceo)}
      ${renderSignatoryBox("HR Manager (HR Division)", sigs?.hr_manager?.assigned_name || "", sigs?.hr_manager)}
      ${renderSignatoryBox("HR Admin Director", sigs?.division_director?.assigned_name || "", sigs?.division_director)}
      ${renderSignatoryBox("Chairwoman", sigs?.chairwoman?.assigned_name || "", sigs?.chairwoman)}
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>
  `;
}
