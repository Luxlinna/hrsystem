import type { Employee } from "../types";
import { SINGLE_EMPLOYEE_PDF_STYLES } from "./single-pdf/singleEmployeePdfStyles";
import {
  renderPersonalSection,
  renderContactSection,
  renderEmploymentSection,
  renderPayrollSection,
  renderEmergencyAndFamilySection,
  renderEducationAndWorkSection,
} from "./single-pdf/singleEmployeePdfSections";
import { supabase } from "@/lib/supabase";

export async function exportSingleEmployeePDF(employee: Employee): Promise<boolean> {
  const fullName = employee.full_name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Employee";
  const empCode = employee.employee_code || employee.id.slice(0, 8);
  const position = employee.position || employee.role || "Staff";
  const department = employee.department || "—";
  const branchName = employee.branches?.name || employee.code_bu || "Headquarters";
  const siteName = employee.work_locations?.name || employee.working_location || "Main Office";
  const joinDate = employee.join_date || employee.start_date || "—";
  const status = (employee.status || "active").replace(/_/g, " ").toUpperCase();
  const salaryFreq = employee.tax_salary_frequency || employee.contract_rate_frequency || "Monthly";

  const isUuid = (val?: string | null) =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

  let managerName = "—";
  const managerTarget = employee.reports_to || (isUuid(employee.line_manager) ? employee.line_manager : null);
  if (managerTarget && isUuid(managerTarget)) {
    const { data: mgr } = await supabase
      .from("employees")
      .select("first_name, last_name, full_name")
      .eq("id", managerTarget)
      .maybeSingle();
    if (mgr) {
      managerName = mgr.full_name || `${mgr.first_name || ""} ${mgr.last_name || ""}`.trim() || "—";
    }
  } else if (employee.line_manager && !isUuid(employee.line_manager)) {
    managerName = employee.line_manager;
  }

  const getStatusColor = (st: string) => {
    switch (st.toLowerCase()) {
      case "active": return "#047857";
      case "onboarding": return "#b45309";
      case "on_leave": return "#4338ca";
      case "suspended": return "#be123c";
      default: return "#475569";
    }
  };

  const statusColor = getStatusColor(employee.status || "active");

  const bankAccountStr = employee.bank_accounts && employee.bank_accounts.length > 0
    ? employee.bank_accounts.map((b) => `${b.payment_method || "Bank"}: ${b.account_number || "—"}`).join(" | ")
    : employee.bank_name ? `${employee.bank_name}: ${employee.bank_account_number || "—"}` : "—";

  const idStr = employee.identifications && employee.identifications.length > 0
    ? employee.identifications.map((id) => `${id.identification_type || "ID"}: ${id.identification_number || "—"}`).join(" | ")
    : employee.national_id_number ? `National ID: ${employee.national_id_number}` : "—";

  const fullAddress = [
    employee.current_address,
    employee.permanent_city,
    employee.permanent_province,
    employee.permanent_country,
  ].filter(Boolean).join(", ") || employee.permanent_address || "—";

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Employee Profile — ${fullName} (${empCode})</title>
    <style>${SINGLE_EMPLOYEE_PDF_STYLES}</style>
  </head>
  <body>
    <div class="page-header">
      <div>
        <div class="company-title">HRM_OPS Enterprise</div>
        <div class="doc-type">Official Employee Profile Dossier</div>
      </div>
      <div class="meta-right">
        <div><strong>Document Code:</strong> EMP-PRF-${empCode}</div>
        <div><strong>Print Date:</strong> ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div>
      </div>
    </div>

    <div class="hero-card">
      <div class="avatar-box">
        ${employee.avatar_url ? `<img src="${employee.avatar_url}" alt="${fullName}" />` : fullName.slice(0, 2).toUpperCase()}
      </div>
      <div class="hero-info">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div class="hero-name">${fullName}</div>
            ${employee.kh_name ? `<div class="hero-khname">${employee.kh_name}</div>` : ""}
          </div>
          <div><span class="status-pill" style="background:${statusColor}">${status}</span></div>
        </div>
        <div class="hero-meta-grid">
          <div class="hero-meta-item"><strong>Employee ID</strong><span class="data-val-mono">${empCode}</span></div>
          <div class="hero-meta-item"><strong>Position</strong><span class="data-val">${position}</span></div>
          <div class="hero-meta-item"><strong>Department</strong><span class="data-val">${department}</span></div>
          <div class="hero-meta-item"><strong>Business Unit</strong><span class="data-val">${branchName}</span></div>
        </div>
      </div>
    </div>

    ${renderPersonalSection(employee, idStr)}
    ${renderContactSection(employee, fullAddress)}
    ${renderEmploymentSection(employee, branchName, siteName, department, position, joinDate, managerName)}
    ${renderPayrollSection(employee, salaryFreq, bankAccountStr)}
    ${renderEmergencyAndFamilySection(employee)}
    ${renderEducationAndWorkSection(employee)}

    <div class="signature-box">
      <div class="signature-col">
        <div class="signature-line"></div>
        <div class="signature-label">Employee Signature &amp; Date</div>
      </div>
      <div class="signature-col">
        <div class="signature-line"></div>
        <div class="signature-label">HR Operations Approval &amp; Date</div>
      </div>
    </div>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Employee Master Form Dossier</div>
      <div>Strictly Confidential &middot; Authorized Personnel Only</div>
    </div>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  }
  return true;
}
