import type { EmploymentContract } from "../types/contractTypes";
import {
  getOfficialFormLogo,
  getOfficialCompanyNameKhmer,
  getOfficialCompanyNameEnglish,
} from "@/services/formLogoService";
import { formatContractDateTime } from "../constants/contractWorkflowConfig";

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
    @page {
      size: A4 portrait;
      margin: 0mm !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #f1f5f9;
      color: #1e293b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12.5px;
      line-height: 1.6;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #fff;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15);
    }
    .contract-page {
      background: #fff;
      max-width: 820px;
      margin: 24px auto;
      padding: 16mm 18mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border-radius: 4px;
      box-sizing: border-box;
    }
    .header {
      border-bottom: 2px solid #253C7D;
      padding-bottom: 12px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo {
      width: 54px;
      height: 54px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .company-khmer {
      font-family: 'Kantumruy Pro', sans-serif;
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.25;
    }
    .company-title {
      font-size: 15px;
      font-weight: 900;
      color: #253C7D;
      letter-spacing: -0.01em;
      line-height: 1.25;
    }
    .company-sub {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      margin-top: 2px;
    }
    .badge { font-size: 11px; font-weight: 800; background: #EEF2FF; color: #3730A3; border: 1px solid #C7D2FE; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase; }
    .doc-title { text-align: center; font-size: 17px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 18px 0 6px; letter-spacing: 0.04em; }
    .doc-ref { text-align: center; font-size: 11px; color: #64748b; font-weight: 700; margin-bottom: 20px; }
    .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; color: #1e293b; background: #f8fafc; border-left: 3px solid #253C7D; padding: 5px 10px; margin: 16px 0 10px; }
    .table-details { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
    .table-details td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    .table-details td.label { width: 28%; font-weight: 700; color: #475569; }
    .table-details td.val { width: 72%; font-weight: 600; color: #0f172a; }
    .sigs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; page-break-inside: avoid; }
    .sig-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; min-height: 64px; display: flex; flex-direction: column; justify-content: space-between; }
    .sig-role { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #64748b; }
    .sig-name { font-size: 11.5px; font-weight: 800; color: #0f172a; }
    .sig-meta { font-size: 9.5px; color: #059669; font-weight: 600; }
    .sig-pending { font-size: 9.5px; color: #94a3b8; font-style: italic; }
    @media print {
      .no-print { display: none !important; }
      html, body { background: #fff !important; }
      .contract-page {
        margin: 0 !important;
        padding: 14mm 16mm !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
    }
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
        <div class="sig-name">${escapeHtml(c.hr_director_name || "Phat Seign")}</div>
        <div class="${c.hr_director_approved_at ? "sig-meta" : "sig-pending"}">${c.hr_director_approved_at ? `✓ Approved on: ${formatContractDateTime(c.hr_director_approved_at)}` : "Awaiting Director Approval"}</div>
      </div>
      <div class="sig-box">
        <div class="sig-role">Step 4: Chairwoman Authorization</div>
        <div class="sig-name">${escapeHtml(c.chairwoman_name || "Mrs. Pin Phiroum")}</div>
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

    // 1. Primary: open blank window and write HTML directly for instant rendering
    const printWindow = window.open("", "_blank");
    if (printWindow && printWindow.document) {
      printWindow.document.open();
      printWindow.document.write(printableHtml);
      printWindow.document.close();
      printWindow.focus();
      return true;
    }

    // 2. Fallback: Blob URL
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
