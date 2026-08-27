import type { PayrollRecord } from "./types";
import { toast } from "@/components/Toast";

export const initials = (first?: string, last?: string): string =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

export const getDeptColors = (isDark: boolean): string[] =>
  isDark
    ? ["#5B7FD1", "#38BDF8", "#34D399", "#FBBF24", "#A78BFA", "#F472B6", "#94A3B8"]
    : ["#253C7D", "#0284C7", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B"];

export const formatMonthLabel = (monthStr: string): string => {
  try {
    return new Date(`${monthStr}-01T00:00:00`).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return monthStr;
  }
};

export const printPayslip = (p: PayrollRecord): void => {
  const empName = p.employees ? `${p.employees.first_name} ${p.employees.last_name}` : "Employee";
  const gross = Number(p.base_salary) + Number(p.bonus);
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Payslip - ${empName} - ${p.month}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 40px; max-width: 650px; margin: 0 auto; color: #1e293b; }
    .header { border-bottom: 2px solid #253C7D; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 22px; font-weight: 800; color: #253C7D; margin: 0; }
    .subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
    .badge { background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 12px; font-size: 13px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .row.total { font-weight: 800; font-size: 16px; border-top: 2px solid #253C7D; border-bottom: none; margin-top: 12px; color: #253C7D; }
    .footer { font-size: 11px; color: #94a3b8; margin-top: 36px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">OFFICIAL PAYSLIP</h1>
      <p class="subtitle">HRM_OPS Enterprise HR & Payroll System</p>
    </div>
    <span class="badge">${p.status}</span>
  </div>

  <div class="grid">
    <div><strong>Employee:</strong> ${empName}</div>
    <div><strong>Pay Period:</strong> ${p.month}</div>
    <div><strong>Role:</strong> ${p.employees?.role || "Team Member"}</div>
    <div><strong>Department:</strong> ${p.employees?.department || "General"}</div>
  </div>

  <div class="row"><span>Base Salary</span><span>$${Number(p.base_salary).toLocaleString()}</span></div>
  <div class="row"><span>Bonuses & Allowances</span><span style="color: #10b981;">+$${Number(p.bonus).toLocaleString()}</span></div>
  <div class="row"><span>Gross Earnings</span><span>$${gross.toLocaleString()}</span></div>
  <div class="row"><span>Taxes & Deductions</span><span style="color: #e11d48;">-$${Number(p.deductions).toLocaleString()}</span></div>
  <div class="row total"><span>Net Take-Home Pay</span><span>$${Number(p.net_pay).toLocaleString()}</span></div>

  <div class="footer">
    Generated on ${new Date().toLocaleString()} · Confidential Financial Document · HRM_OPS
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.print();
    };
  }
};

export const exportToCSV = (
  filteredRecords: PayrollRecord[],
  periodMode: "month" | "all",
  selectedMonth: string
): void => {
  if (filteredRecords.length === 0) {
    toast("Export", "No records found to export", "warning");
    return;
  }

  const headers = ["Employee", "Department", "Role", "Month", "Base Salary", "Bonus", "Deductions", "Net Pay", "Status", "Notes"];
  const rows = filteredRecords.map((r) => [
    `"${r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown"}"`,
    `"${r.employees?.department || ""}"`,
    `"${r.employees?.role || ""}"`,
    r.month,
    r.base_salary,
    r.bonus,
    r.deductions,
    r.net_pay,
    r.status,
    `"${(r.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `payroll_export_${periodMode === "month" ? selectedMonth : "all"}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast("Export Complete", `Exported ${filteredRecords.length} records to CSV`, "success");
};
