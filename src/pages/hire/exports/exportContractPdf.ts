import type { EmploymentContract } from "../types/contractTypes";
import {
  getOfficialFormLogo,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
} from "@/services/formLogoService";
import { formatContractDateTime } from "../constants/contractWorkflowConfig";
import { contractPdfStyles } from "./contractPdfStyles";

function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateContractHtml(c: EmploymentContract): string {
  const logo = getOfficialFormLogo();
  const companyKhmer = getOfficialCompanyNameKhmer();
  const companyEnglish = getOfficialCompanyNameEnglish();

  const contractTypeLabel =
    c.contract_type === "permanent"
      ? "Permanent Employment Contract"
      : c.contract_type === "fixed_term"
      ? "Fixed-Term Employment Contract"
      : "Probationary Employment Contract";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>&nbsp;</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    ${contractPdfStyles}
  </style>
</head>
<body>
  <div class="no-print">
    <div style="font-weight: 700; font-size: 13px;">
      📄 ${escapeHtml(c.contract_number)} — ${escapeHtml(c.candidate_name)}
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:6px 16px; border-radius:8px; font-weight:700; font-size:12px; cursor:pointer;">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" style="background:#475569; color:#fff; border:none; padding:6px 14px; border-radius:8px; font-weight:600; font-size:12px; cursor:pointer;">
        ✕ Close
      </button>
    </div>
  </div>

  <div class="contract-page">
    <div class="header">
      <div class="header-brand">
        <img src="${logo}" class="header-logo" alt="UNI Logo" />
        <div>
          <div class="company-khmer">${escapeHtml(companyKhmer)}</div>
          <div class="company-title">${escapeHtml(companyEnglish)}</div>
          <div class="company-sub">Human Resources Management Division &bull; Employment Governance</div>
        </div>
      </div>
      <div style="text-align: right;">
        <span class="badge">Official Contract</span>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Effective: ${escapeHtml(c.start_date || "")}</div>
        <div style="font-size: 9.5px; color: #94a3b8; margin-top: 1px;">Generated: ${formatContractDateTime(c.created_at)}</div>
      </div>
    </div>

    <div class="doc-title">${escapeHtml(contractTypeLabel)}</div>
    <div class="doc-ref">Contract Reference: ${escapeHtml(c.contract_number)} • Linked Offer: ${escapeHtml(c.offer_reference || "N/A")}</div>

    <div class="section-title">1. Contracting Parties</div>
    <table class="table-details">
      <tr>
        <td class="label">The Employer:</td>
        <td class="val"><strong>${escapeHtml(companyEnglish)}</strong> (HR Division, Corporate HQ)</td>
      </tr>
      <tr>
        <td class="label">The Employee:</td>
        <td class="val"><strong>${escapeHtml(c.candidate_name)}</strong> ${c.candidate_email ? `(${escapeHtml(c.candidate_email)})` : ""}</td>
      </tr>
    </table>

    <div class="section-title">2. Position &amp; Appointment Details</div>
    <table class="table-details">
      <tr>
        <td class="label">Position Title:</td>
        <td class="val">${escapeHtml(c.position_title)}</td>
      </tr>
      <tr>
        <td class="label">Department:</td>
        <td class="val">${escapeHtml(c.department || "Operations")}</td>
      </tr>
      <tr>
        <td class="label">Contract Commencement:</td>
        <td class="val">${escapeHtml(c.start_date)}</td>
      </tr>
      <tr>
        <td class="label">Probationary Period:</td>
        <td class="val">${c.probation_months} Months from commencement date</td>
      </tr>
    </table>

    <div class="section-title">3. Remuneration &amp; Employment Terms</div>
    <table class="table-details">
      <tr>
        <td class="label">Monthly Base Salary:</td>
        <td class="val"><strong style="color:#0f172a; font-size:13px;">$${c.monthly_salary} ${escapeHtml(c.currency)}</strong> / month (gross)</td>
      </tr>
      <tr>
        <td class="label">Compliance Status:</td>
        <td class="val">All pre-boarding compliance documents verified and authenticated.</td>
      </tr>
    </table>

    <div class="section-title">4. Stakeholder Governance &amp; Execution Audit Trail</div>
    <div class="sigs-grid">
      <div class="sig-box">
        <div class="sig-role">Step 1: Contract Draft (Initiator)</div>
        <div class="sig-name">${escapeHtml(c.created_by_name || "HR Recruiter")}</div>
        <div class="sig-meta">✓ Drafted on: ${formatContractDateTime(c.created_at)}</div>
      </div>
      <div class="sig-box">
        <div class="sig-role">Step 2: HR Division Review</div>
        <div class="sig-name">${escapeHtml(c.hr_reviewer_name || "HR Specialist")}</div>
        <div class="${c.hr_reviewed_at ? "sig-meta" : "sig-pending"}">${c.hr_reviewed_at ? `✓ Endorsed on: ${formatContractDateTime(c.hr_reviewed_at)}` : "Awaiting HR Review"}</div>
      </div>
      <div class="sig-box">
        <div class="sig-role">Step 3: HR Admin Director Approval</div>
        <div class="sig-name">${escapeHtml(c.hr_director_name || "HR Admin Director")}</div>
        <div class="${c.hr_director_approved_at ? "sig-meta" : "sig-pending"}">${c.hr_director_approved_at ? `✓ Approved on: ${formatContractDateTime(c.hr_director_approved_at)}` : "Awaiting Director Approval"}</div>
      </div>
      <div class="sig-box">
        <div class="sig-role">Step 4: Chairwoman Authorization</div>
        <div class="sig-name">${escapeHtml(c.chairwoman_name || "Chairwoman")}</div>
        <div class="${c.chairwoman_approved_at ? "sig-meta" : "sig-pending"}">${c.chairwoman_approved_at ? `✓ Authorized on: ${formatContractDateTime(c.chairwoman_approved_at)}` : "Awaiting Chairwoman Approval"}</div>
      </div>
      <div class="sig-box">
        <div class="sig-role">Step 5: Contract Issuance</div>
        <div class="sig-name">${escapeHtml(c.issued_by_name || "HR Division")}</div>
        <div class="${c.issued_at ? "sig-meta" : "sig-pending"}">${c.issued_at ? `✓ Issued on: ${formatContractDateTime(c.issued_at)}` : "Pending Contract Issuance"}</div>
      </div>
      <div class="sig-box">
        <div class="sig-role">Step 6: Employee Acceptance</div>
        <div class="sig-name">${escapeHtml(c.candidate_name)}</div>
        <div class="${c.signed_at ? "sig-meta" : "sig-pending"}">${c.signed_at ? `✓ Countersigned on: ${formatContractDateTime(c.signed_at)}` : "Awaiting signature / on file"}</div>
      </div>
    </div>
    ${c.completed_at ? `
    <div style="margin-top: 10px; font-size: 10.5px; color: #059669; font-weight: 700; text-align: right;">
      ✓ Step 7: Final Contract Verified &amp; Archived on ${formatContractDateTime(c.completed_at)}
    </div>` : ""}
  </div>
</body>
</html>`;
}

export function exportContractPdf(contract: EmploymentContract): boolean {
  if (!contract) return false;
  try {
    const baseHtml = generateContractHtml(contract);
    const autoPrintScript = `
      <script>
        function triggerPrint() {
          try {
            document.title = "";
            window.focus();
            window.print();
          } catch (e) {}
        }
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setTimeout(triggerPrint, 350);
        } else {
          window.addEventListener('DOMContentLoaded', () => setTimeout(triggerPrint, 350));
        }
      </script>
    `;
    const printableHtml = baseHtml.replace("</body>", `${autoPrintScript}</body>`);

    const printWindow = window.open("", "_blank");
    if (printWindow && printWindow.document) {
      printWindow.document.open();
      printWindow.document.write(printableHtml);
      printWindow.document.close();
      printWindow.focus();
      return true;
    }

    const blob = new Blob([printableHtml], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const fallbackWindow = window.open(blobUrl, "_blank");
    if (fallbackWindow) {
      fallbackWindow.focus();
      return true;
    }
  } catch (err) {
    console.warn("Contract PDF export failed:", err);
  }
  return false;
}
