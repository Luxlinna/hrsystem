import type { DisciplinaryRecord } from "../types";
import { TYPE_CONFIG } from "../constants";

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function generateWarningLetterHtml(record: DisciplinaryRecord): string {
  const emp = record.employees;
  const warningTypeKey = record.warning_type || record.type;
  const warningConfig = TYPE_CONFIG[warningTypeKey] || TYPE_CONFIG.written_warning;
  const warningLabel = warningConfig?.label || (warningTypeKey ? warningTypeKey.replace(/_/g, " ").toUpperCase() : "OFFICIAL WARNING");

  const empName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "Employee";
  const empId = emp?.employee_id ? emp.employee_id.trim() : "";
  const empRole = emp?.role || "Staff";
  const empDept = emp?.department || "General";
  const empBranch = record.branches?.name || "Corporate Office";

  const dateIssued = formatDate(record.warning_date || record.incident_date || record.created_at);
  const incidentDate = formatDate(record.incident_date || record.warning_date);
  const followUpDate = record.follow_up_date ? formatDate(record.follow_up_date) : "To be determined";
  const actionToTake = record.action_to_take || record.action_taken || "Adhere strictly to company policies and avoid repeat infractions.";
  const employeePromise = record.employee_promise || null;
  const remark = record.remark || record.notes || null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Formal Warning Letter - ${escapeHtml(empName)}${empId ? ` (${escapeHtml(empId)})` : ""}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #f1f5f9;
      line-height: 1.5;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .top-banner {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
    .top-banner .title {
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .top-banner .badge {
      background: #dc2626;
      color: #ffffff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .top-banner .actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-print {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .btn-print:hover {
      background: #1d4ed8;
    }
    .btn-close {
      background: #334155;
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-close:hover {
      background: #475569;
    }

    .page-container {
      max-width: 800px;
      margin: 24px auto;
      background: #ffffff;
      padding: 44px 52px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      border-radius: 8px;
    }

    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 18px;
      margin-bottom: 22px;
    }
    .company-title {
      font-size: 19px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .company-sub {
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-top: 2px;
      font-weight: 700;
    }
    .ref-block {
      text-align: right;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .ref-block strong {
      color: #0f172a;
    }

    .notice-header {
      text-align: center;
      margin-bottom: 22px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .notice-header h1 {
      font-size: 16px;
      font-weight: 900;
      color: #991b1b;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .notice-header .sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
      font-weight: 600;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
      padding: 14px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 22px;
    }
    .info-row {
      display: flex;
      flex-direction: column;
    }
    .info-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.04em;
    }
    .info-val {
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 1px;
    }

    .section {
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #334155;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-box {
      padding: 12px 14px;
      border-radius: 6px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      font-size: 12px;
      color: #1e293b;
      white-space: pre-wrap;
      line-height: 1.55;
    }
    .section-box.action {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
      font-weight: 600;
    }
    .section-box.promise {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
      font-style: italic;
    }

    .warning-consequence {
      margin-top: 20px;
      padding: 10px 14px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      font-size: 11px;
      color: #92400e;
      line-height: 1.45;
    }

    .signatures-block {
      margin-top: 32px;
      padding-top: 18px;
      border-top: 1px dashed #cbd5e1;
    }
    .ack-text {
      font-size: 10.5px;
      color: #64748b;
      margin-bottom: 24px;
      font-style: italic;
      line-height: 1.45;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-top: 16px;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      padding-top: 6px;
      margin-top: 45px;
      text-align: center;
    }
    .sig-name {
      font-weight: 700;
      font-size: 11.5px;
      color: #0f172a;
    }
    .sig-role {
      font-size: 10px;
      color: #64748b;
    }
    .sig-date {
      font-size: 9.5px;
      color: #94a3b8;
      margin-top: 3px;
    }

    /* PRINT RULES: Remove browser-injected header (date/title) and footer (URL/page #) */
    @page {
      size: A4 portrait;
      margin: 0 !important;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        font-size: 10.5pt !important;
      }
      .no-print, .top-banner {
        display: none !important;
      }
      .page-container {
        margin: 0 !important;
        padding: 14mm 18mm !important;
        box-shadow: none !important;
        max-width: 100% !important;
        border-radius: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="top-banner no-print">
    <div class="title">
      <span>Formal Warning Letter &bull; <strong>${escapeHtml(empName)}</strong>${empId ? ` (${escapeHtml(empId)})` : ""}</span>
      <span class="badge">${escapeHtml(warningLabel)}</span>
    </div>
    <div class="actions">
      <button class="btn-print" onclick="window.print()">
        <span>🖨️ Print / Save as PDF</span>
      </button>
      <button class="btn-close" onclick="window.close()">
        <span>✕ Close</span>
      </button>
    </div>
  </div>

  <div class="page-container">
    <!-- Header / Letterhead -->
    <div class="letterhead">
      <div>
        <div class="company-title">${escapeHtml(empBranch)}</div>
        <div class="company-sub">Human Resources Department &bull; Disciplinary Governance</div>
      </div>
      <div class="ref-block">
        <div><strong>Doc Ref:</strong> WRN-${escapeHtml(record.id.slice(0, 8).toUpperCase())}</div>
        <div><strong>Date Issued:</strong> ${escapeHtml(dateIssued)}</div>
        <div><strong>Status:</strong> ${escapeHtml(record.status.toUpperCase())}</div>
      </div>
    </div>

    <!-- Notice Title -->
    <div class="notice-header">
      <h1>${escapeHtml(warningLabel)}</h1>
      <div class="sub">Official Notification of Disciplinary Action &amp; Corrective Measures</div>
    </div>

    <!-- Employee Information Grid -->
    <div class="info-grid">
      <div class="info-row">
        <span class="info-label">Employee Name</span>
        <span class="info-val">${escapeHtml(empName)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Employee ID</span>
        <span class="info-val">${escapeHtml(empId || "—")}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Department &amp; Position</span>
        <span class="info-val">${escapeHtml(empDept)} &bull; ${escapeHtml(empRole)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Branch / Division</span>
        <span class="info-val">${escapeHtml(empBranch)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Incident / Warning Date</span>
        <span class="info-val">${escapeHtml(incidentDate)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Follow-up Review Date</span>
        <span class="info-val">${escapeHtml(followUpDate)}</span>
      </div>
    </div>

    <!-- Reason / Infraction Description -->
    <div class="section">
      <div class="section-title">
        <span>1. Warning Subject &amp; Details of Infraction</span>
      </div>
      <div class="section-box">
<strong>Subject: ${escapeHtml(record.title)}</strong>

${escapeHtml(record.description || "No detailed description provided.")}
      </div>
    </div>

    <!-- Corrective Action Required -->
    <div class="section">
      <div class="section-title">
        <span>2. Corrective Action Required / Rectification Plan</span>
      </div>
      <div class="section-box action">
${escapeHtml(actionToTake)}
      </div>
    </div>

    <!-- Employee Commitment / Promise -->
    ${
      employeePromise
        ? `
    <div class="section">
      <div class="section-title">
        <span>3. Employee Statement &amp; Commitment</span>
      </div>
      <div class="section-box promise">
"${escapeHtml(employeePromise)}"
      </div>
    </div>
    `
        : ""
    }

    <!-- Remarks / Notes -->
    ${
      remark
        ? `
    <div class="section">
      <div class="section-title">
        <span>${employeePromise ? "4" : "3"}. Management Remarks &amp; Notes</span>
      </div>
      <div class="section-box">
${escapeHtml(remark)}
      </div>
    </div>
    `
        : ""
    }

    <!-- Warning Consequence Notice -->
    <div class="warning-consequence">
      <strong>Important Notice:</strong> This document serves as a formal warning record under company disciplinary policy. Failure to demonstrate immediate and sustained improvement or any recurrence of similar infractions may result in escalating disciplinary actions, up to and including formal suspension or termination of employment.
    </div>

    <!-- Signatures -->
    <div class="signatures-block">
      <div class="ack-text">
        <strong>Acknowledgment of Receipt:</strong> By signing below, the employee acknowledges receipt of this formal warning notice and understands the required corrective measures. Signing acknowledges receipt and does not necessarily indicate agreement.
      </div>

      <div class="signatures-grid">
        <div>
          <div class="sig-line">
            <div class="sig-name">${escapeHtml(empName)}</div>
            <div class="sig-role">Employee Signature</div>
            <div class="sig-date">Date: __________________</div>
          </div>
        </div>

        <div>
          <div class="sig-line">
            <div class="sig-name">${escapeHtml(record.created_by || "Direct Supervisor")}</div>
            <div class="sig-role">Issuing Supervisor / Manager</div>
            <div class="sig-date">Date: __________________</div>
          </div>
        </div>

        <div>
          <div class="sig-line">
            <div class="sig-name">Human Resources</div>
            <div class="sig-role">HR Representative / Division</div>
            <div class="sig-date">Date: __________________</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function exportWarningLetterPdf(record: DisciplinaryRecord): boolean {
  if (!record) return false;
  try {
    const baseHtml = generateWarningLetterHtml(record);
    const autoPrintScript = `
      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            try {
              window.focus();
              window.print();
            } catch (e) {
              console.error(e);
            }
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
    console.warn("Failed to open PDF window:", err);
  }
  return false;
}
