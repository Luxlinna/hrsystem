import type { CandidateApproval } from "../types";

export function exportCandidateApprovalPdf(approval: CandidateApproval) {
  const printWindow = document.createElement("iframe");
  printWindow.style.position = "fixed";
  printWindow.style.right = "0";
  printWindow.style.bottom = "0";
  printWindow.style.width = "0";
  printWindow.style.height = "0";
  printWindow.style.border = "0";
  document.body.appendChild(printWindow);

  const doc = printWindow.contentWindow?.document;
  if (!doc) return;

  const panelsHtml =
    approval.interview_panels && approval.interview_panels.length > 0
      ? approval.interview_panels
          .map(
            (p) => `
      <tr>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px;">${p.name || "—"}</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px; text-align: center;">${p.date_time || "—"}</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px; text-align: center;">${p.position || "—"}</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px; text-align: center; font-style: italic; color: #1e3a8a;">
          ${p.signature || "Verified"}
        </td>
      </tr>
    `
          )
          .join("")
      : `
      <tr>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px;">Ms. Meas Chhengseang</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px; text-align: center;">04th-June-2026 3:00PM</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px; text-align: center;">CEO</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px; text-align: center; font-style: italic; color: #1e3a8a;">Signed</td>
      </tr>
      <tr>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px;">Mr. Sun Reasey</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px; text-align: center;">04th-June-2026 3:00PM</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px; text-align: center;">HR Recruiter</td>
        <td style="border: 1px solid #111; padding: 4px 6px; font-size: 10.5px; text-align: center; font-style: italic; color: #1e3a8a;">Signed</td>
      </tr>
    `;

  const sigs = approval.signatories;

  const renderSignatoryBox = (
    title: string,
    assignedName: string,
    sigData?: {
      comment?: string | null;
      checked_by?: string | null;
      status: string;
      signed_at?: string | null;
    }
  ) => {
    const isApproved = sigData?.status === "approved";
    const comment = sigData?.comment || "";
    const dateStr = sigData?.signed_at
      ? new Date(sigData.signed_at).toLocaleDateString("en-GB")
      : "____/_____/_____";

    return `
      <div style="flex: 1; border-right: 1px solid #111; padding: 6px 8px; display: flex; flex-direction: column; justify-content: space-between; font-size: 10.5px;">
        <div>
          <div style="font-weight: bold; text-decoration: underline; margin-bottom: 3px;">Comment:</div>
          <div style="min-height: 44px; font-size: 10px; color: ${comment ? "#111" : "#777"}; line-height: 1.3;">
            ${comment || "…………………………………"}
          </div>
          <div style="margin-top: 6px; font-weight: bold; text-decoration: underline;">Checked by:</div>
          <div style="min-height: 28px; display: flex; align-items: flex-end; padding-bottom: 2px;">
            <div style="width: 100%; border-bottom: 1px dashed #444; font-family: 'Segoe Script', cursive, sans-serif; font-size: 12px; color: #1e3a8a;">
              ${isApproved ? (sigData?.checked_by || assignedName) : "&nbsp;"}
            </div>
          </div>
        </div>
        <div style="margin-top: 14px; text-align: center;">
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">${assignedName}</div>
          <div style="font-size: 10px; color: #222; margin-bottom: 6px;">${title}</div>
          <div style="font-size: 10px; font-weight: bold;">Date: <span style="font-weight: normal;">${dateStr}</span></div>
        </div>
      </div>
    `;
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Candidate Approval Form - ${approval.form_number}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Inter', 'Kantumruy Pro', sans-serif;
      color: #111;
      margin: 0;
      padding: 0;
      background: #fff;
      font-size: 11px;
      line-height: 1.35;
    }
    .caf-page {
      width: 100%;
      max-width: 194mm;
      margin: 0 auto;
    }
    .caf-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .caf-table td, .caf-table th {
      border: 1px solid #111;
      padding: 4px 7px;
    }
    .label-cell {
      font-weight: bold;
      background-color: #fafafa;
      width: 22%;
      font-size: 10.5px;
    }
    .value-cell {
      width: 28%;
      font-size: 10.5px;
    }
    .sec-header {
      font-size: 11.5px;
      font-weight: bold;
      margin-top: 6px;
      margin-bottom: 4px;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="caf-page">
    <!-- Header Block -->
    <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;">
      <div style="display: flex; align-items: flex-start; gap: 12px; max-width: 82%;">
        <div style="width: 52px; height: 52px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10C35 10 25 22 25 36C25 46 31 54 40 58C30 63 20 74 20 88H32C32 76 40 68 50 68C60 68 68 76 68 88H80C80 74 70 63 60 58C69 54 75 46 75 36C75 22 65 10 50 10Z" fill="#1e3a8a"/>
            <circle cx="50" cy="36" r="16" fill="#e11d48"/>
          </svg>
        </div>
        <div style="font-size: 9px; line-height: 1.35; color: #111;">
          <div style="font-family: 'Kantumruy Pro', sans-serif; font-size: 11px; font-weight: bold; color: #111;">
            យូនីក ណូបិល អ៊ិនវេសម៉ិន ឯ.ក
          </div>
          <div style="font-weight: bold; font-size: 10px; margin-bottom: 1px;">
            Unique Noble Investment Co. Ltd.
          </div>
          <div style="font-family: 'Kantumruy Pro', sans-serif; font-size: 8px; color: #222;">
            ផ្ទះលេខ TK Roundabout លេខ 6 ជាន់ទី 2 ការិយាល័យលេខ A2-06F, ផ្លូវលេខ 289, 12 សង្កាត់ បឹងកក់ទី 2, ខណ្ឌទួលគោក, ភ្នំពេញ, កម្ពុជា
          </div>
          <div style="font-size: 8px; color: #222;">
            Building TK Roundabout No. 6, Floor 2nd, Office No. A2-06F, Street No. 289, 12, Sangkat Boeng Kak Ti Pir, Khan Tuol Kouk, Phnom Penh, Cambodia.
          </div>
          <div style="font-size: 8px; font-weight: 600; color: #111; margin-top: 1px;">
            លេខទូរស័ព្ទ/Phone: 095 224 424 &nbsp;&nbsp;|&nbsp;&nbsp; លេខអត្តសញ្ញាណកម្មសារពើពន្ធ/TIN: K005-902204561
          </div>
        </div>
      </div>
    </div>

    <!-- Title & Form Number -->
    <div style="display: flex; align-items: baseline; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 4px; margin-bottom: 8px;">
      <div style="font-size: 14.5px; font-weight: bold; text-decoration: underline; letter-spacing: 0.3px; margin: 0 auto 0 80px;">
        Candidate Approval Form
      </div>
      <div style="font-size: 10px; font-weight: 700; white-space: nowrap;">
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
        <td class="value-cell">${approval.business_unit || "Unique Noble Investment Co. Ltd."}</td>
      </tr>
      <tr>
        <td class="label-cell">Department:</td>
        <td class="value-cell">${approval.department || "Operations"}</td>
        <td class="label-cell">Hiring Manager:</td>
        <td class="value-cell">${approval.hiring_manager || "—"}</td>
      </tr>
      <tr>
        <td class="label-cell">Current Salary:</td>
        <td class="value-cell">${approval.current_salary || "$1,200"}</td>
        <td class="label-cell">Expectation Salary:</td>
        <td class="value-cell" style="background-color: #0284c7; color: #fff; font-weight: bold;">${approval.expectation_salary || "$1,500"}</td>
      </tr>
      <tr>
        <td class="label-cell">Current Benefit:</td>
        <td class="value-cell">${approval.current_benefit || "Standard benefits"}</td>
        <td class="label-cell">Notice Period:</td>
        <td class="value-cell">${approval.notice_period || "1 Month"}</td>
      </tr>
    </table>

    <!-- SECTION II -->
    <div class="sec-header">II. Candidate Evaluation Summary</div>
    <table class="caf-table">
      <thead>
        <tr style="background-color: #f3f4f6; text-align: center;">
          <th style="width: 25%; font-size: 10px; padding: 4px; border: 1px solid #111; text-decoration: underline;">Education and Skill</th>
          <th style="width: 25%; font-size: 10px; padding: 4px; border: 1px solid #111; text-decoration: underline;">Work Experience</th>
          <th style="width: 25%; font-size: 10px; padding: 4px; border: 1px solid #111; text-decoration: underline;">Strengths</th>
          <th style="width: 25%; font-size: 10px; padding: 4px; border: 1px solid #111; text-decoration: underline;">Improvement</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="vertical-align: top; height: 110px; font-size: 9.5px; line-height: 1.35; padding: 6px;">${approval.education_and_skill || "—"}</td>
          <td style="vertical-align: top; height: 110px; font-size: 9.5px; line-height: 1.35; padding: 6px;">${approval.work_experience || "—"}</td>
          <td style="vertical-align: top; height: 110px; font-size: 9.5px; line-height: 1.35; padding: 6px;">${approval.strengths || "—"}</td>
          <td style="vertical-align: top; height: 110px; font-size: 9.5px; line-height: 1.35; padding: 6px;">${approval.improvement || "—"}</td>
        </tr>
        <tr>
          <td colspan="4" style="border: 1px solid #111; padding: 6px 8px;">
            <div style="font-weight: bold; text-decoration: underline; margin-bottom: 3px; font-size: 10.5px;">Overall Assessment:</div>
            <div style="font-size: 9.5px; line-height: 1.35; color: #111;">
              ${approval.overall_assessment || "Candidate has demonstrated high competencies and is recommended for employment."}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Interview Panels Subtable -->
    <div style="font-weight: bold; font-size: 10.5px; margin-top: 5px; margin-bottom: 3px;">Interview Panels</div>
    <table class="caf-table" style="margin-bottom: 8px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="width: 32%; text-align: center; border: 1px solid #111; padding: 3px; font-size: 10px;">Interview Panels</th>
          <th style="width: 28%; text-align: center; border: 1px solid #111; padding: 3px; font-size: 10px;">Date Time</th>
          <th style="width: 22%; text-align: center; border: 1px solid #111; padding: 3px; font-size: 10px;">Position</th>
          <th style="width: 18%; text-align: center; border: 1px solid #111; padding: 3px; font-size: 10px;">Signature</th>
        </tr>
      </thead>
      <tbody>
        ${panelsHtml}
      </tbody>
    </table>

    <!-- SECTION III -->
    <div class="sec-header">III. Final Approval</div>
    <div style="display: flex; border: 1px solid #111; min-height: 135px;">
      ${renderSignatoryBox("CEO/Division Director", sigs?.ceo?.assigned_name || "CEO/Division Director", sigs?.ceo)}
      ${renderSignatoryBox("HR and Admin Manager", sigs?.hr_manager?.assigned_name || "Ms.Chea TiengChanvathna", sigs?.hr_manager)}
      ${renderSignatoryBox("HR&Admin Division Director", sigs?.division_director?.assigned_name || "Mr. Chey Tola", sigs?.division_director)}
      ${renderSignatoryBox("Chairwoman", sigs?.chairwoman?.assigned_name || "Mrs.Pin Phiroum", sigs?.chairwoman)}
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

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      document.body.removeChild(printWindow);
    } catch {
      // Ignored
    }
  }, 10000);
}
