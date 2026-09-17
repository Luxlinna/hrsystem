import type { Employee, LeaveFormData, LeaveTypeBalanceStats } from "../types";
import { LEAVE_TYPE_CONFIG } from "../constants";

interface ExportLeaveSlipOptions {
  form: LeaveFormData;
  employee: Employee | null;
  approverName?: string;
  stats?: LeaveTypeBalanceStats;
  requestedDays: number;
}

export function exportLeaveApplicationSlip({
  form,
  employee,
  approverName = "Direct Line Manager / HR",
  stats,
  requestedDays,
}: ExportLeaveSlipOptions): boolean {
  if (!employee) return false;

  const empName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Employee";
  const empCode = employee.employee_code || employee.employee_id || employee.biometric_user_id || "—";
  const typeCfg = LEAVE_TYPE_CONFIG[form.leave_type] || LEAVE_TYPE_CONFIG.annual;
  const printDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const balanceVal = stats ? `${stats.balance} days` : "—";
  const usedVal = stats ? `${stats.used} days` : "—";
  const availVal = stats ? `${stats.available} days` : "—";
  const remainingAfter = stats ? `${Math.max(0, stats.available - requestedDays)} days` : "—";

  const printWindow = window.open("", "_blank", "width=900,height=750");
  if (!printWindow) return false;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Leave Application - ${empName} (${typeCfg.code || "LEAVE"})</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #fff;
      font-size: 12px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #253C7D;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 900;
      color: #253C7D;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .badge-pill {
      display: inline-block;
      padding: 4px 10px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #253C7D;
      margin: 18px 0 8px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.data-table td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    table.data-table td.label-cell {
      background: #f8fafc;
      font-weight: 700;
      color: #475569;
      width: 28%;
    }
    .stats-box-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .stat-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      background: #f8fafc;
      text-align: center;
    }
    .stat-num {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .stat-lbl {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-top: 2px;
    }
    .text-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 10px 12px;
      min-height: 48px;
      margin-bottom: 14px;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 36px;
    }
    .sign-box {
      border-top: 1px dashed #94a3b8;
      padding-top: 8px;
      text-align: center;
    }
    .sign-title {
      font-weight: 700;
      font-size: 11px;
      color: #1e293b;
    }
    .sign-sub {
      font-size: 9px;
      color: #64748b;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-title">Workforce Management System</div>
      <div class="doc-subtitle">Official Employee Leave Application Form</div>
    </div>
    <div style="text-align: right;">
      <span class="badge-pill">${typeCfg.code || "LEAVE"} - ${typeCfg.label}</span>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Date: ${printDate}</div>
    </div>
  </div>

  <div class="section-title">1. Employee Details</div>
  <table class="data-table">
    <tr>
      <td class="label-cell">Employee Full Name</td>
      <td style="font-weight: 800;">${empName}</td>
      <td class="label-cell">Employee ID / Code</td>
      <td style="font-weight: 800;">${empCode}</td>
    </tr>
    <tr>
      <td class="label-cell">Position / Role</td>
      <td>${employee.role || "Staff"}</td>
      <td class="label-cell">Department</td>
      <td>${employee.department || "General"}</td>
    </tr>
    <tr>
      <td class="label-cell">Business Unit (BU)</td>
      <td>${employee.branches?.name || "Main Branch"}</td>
      <td class="label-cell">Assigned Approver</td>
      <td>${approverName}</td>
    </tr>
  </table>

  <div class="section-title">2. Leave Type &amp; Period</div>
  <table class="data-table">
    <tr>
      <td class="label-cell">Leave Type Category</td>
      <td colspan="3"><strong>${typeCfg.label} (${typeCfg.code})</strong></td>
    </tr>
    ${
      form.category_law
        ? `<tr>
      <td class="label-cell">Labour Law Classification</td>
      <td colspan="3"><span style="color: #253C7D; font-weight: 700;">${form.category_law}</span></td>
    </tr>`
        : ""
    }
    <tr>
      <td class="label-cell">From Date</td>
      <td><strong>${form.start_date || "—"}</strong></td>
      <td class="label-cell">To Date</td>
      <td><strong>${form.end_date || "—"}</strong></td>
    </tr>
    <tr>
      <td class="label-cell">Total Days Requested</td>
      <td colspan="3" style="font-size: 13px; font-weight: 800; color: #253C7D;">
        ${requestedDays} Day(s)
      </td>
    </tr>
  </table>

  <div class="section-title">3. Leave Balance &amp; Entitlement Status</div>
  <div class="stats-box-grid">
    <div class="stat-card">
      <div class="stat-num">${balanceVal}</div>
      <div class="stat-lbl">Entitlement Balance</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color: #d97706;">${usedVal}</div>
      <div class="stat-lbl">Days Used</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color: #059669;">${availVal}</div>
      <div class="stat-lbl">Days Available</div>
    </div>
    <div class="stat-card">
      <div class="stat-num" style="color: #253C7D;">${remainingAfter}</div>
      <div class="stat-lbl">Balance After Leave</div>
    </div>
  </div>

  <div class="section-title">4. Reason &amp; Remarks</div>
  <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 2px;">REASON FOR LEAVE:</div>
  <div class="text-box">${form.reason ? form.reason.replace(/\n/g, "<br/>") : "—"}</div>

  ${
    form.remark
      ? `<div style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 2px;">ADDITIONAL REMARK:</div>
  <div class="text-box">${form.remark.replace(/\n/g, "<br/>")}</div>`
      : ""
  }

  <div class="signature-grid">
    <div class="sign-box">
      <br/><br/>
      <div class="sign-title">${empName}</div>
      <div class="sign-sub">Applicant Employee Signature</div>
    </div>
    <div class="sign-box">
      <br/><br/>
      <div class="sign-title">${approverName}</div>
      <div class="sign-sub">Line Manager Review &amp; Recommendation</div>
    </div>
    <div class="sign-box">
      <br/><br/>
      <div class="sign-title">Super Admin / HR Department</div>
      <div class="sign-sub">Official HR Authorization</div>
    </div>
  </div>

  <div style="margin-top: 24px; text-align: center;" class="no-print">
    <button onclick="window.print()" style="padding: 8px 18px; background: #253C7D; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
      🖨️ Print / Save PDF
    </button>
  </div>
  <script>
    window.onload = function() {
      // automatically trigger print dialog for quick user experience
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}
