import type { EmployeeMovement } from "../types";
import { MOVEMENT_TYPES } from "../constants";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  } catch {
    return d;
  }
};

const formatSupervisor = (sup?: string | null) => {
  if (!sup || sup === "—") return "—";
  let s = String(sup).trim();
  if (s.toLowerCase() === "pisey pin") return "Pin Pisey";
  if (s.toLowerCase() === "senglong te") return "Te Senglong";
  if (s.toLowerCase() === "chem khoeurn") return "Khoeurn Chem";
  return s;
};

export function exportMovementsPDF(movements: EmployeeMovement[], title = "Employee Change Statuses Report"): boolean {
  const total = movements.length;

  const rows =
    movements.length > 0
      ? movements
          .map((m, idx) => {
            const emp = m.employees;
            const typeConfig = MOVEMENT_TYPES[m.movement_type];
            const fullName = formatKhmerFullName(emp);
            const empCode = (emp as any)?.employee_code || (emp as any)?.biometric_user_id || (emp as any)?.candidate_code || "—";
            const division = m.new_values?.division || (emp as any)?.division || "—";
            const department = (m.new_values?.department || emp?.department || "—").toUpperCase();
            const position = m.new_values?.position || m.new_values?.role || (emp as any)?.position || emp?.role || "—";
            const buName = m.new_values?.bu || m.new_values?.branch_name || (emp as any)?.bu_full_name || emp?.branches?.name || (emp as any)?.company || "—";
            const site = m.new_values?.site || (emp as any)?.work_locations?.name || (emp as any)?.site || "—";
            const contractType = (m.new_values?.contract_type || (emp as any)?.contract_type || "—").toUpperCase();
            
            const contractStart = formatDate((emp as any)?.contract_start_date || (emp as any)?.contract_effective_date || (emp as any)?.join_date || (emp as any)?.start_date || m.effective_date);
            const contractEnd = (emp as any)?.contract_end_date ? formatDate((emp as any)?.contract_end_date) : "Ongoing";
            const contractDate = `${contractStart} - ${contractEnd}`;

            const employeeLevel = m.new_values?.employee_level || (emp as any)?.employee_level || (emp as any)?.level || "—";
            const employeeType = m.new_values?.employment_type || (emp as any)?.employment_type || "Full Time";
            const supervisor = formatSupervisor(m.new_values?.supervisor || m.new_values?.target_reports_to || (emp as any)?.line_manager || (emp as any)?.reports_to);

            const salVal = m.new_values?.salary ?? m.new_values?.new_salary ?? (emp as any)?.contract_rate ?? (emp as any)?.basic_salary;
            const salFreq = m.new_values?.contract_rate_frequency || (emp as any)?.tax_salary_frequency || "Monthly";
            const salary = salVal !== null && salVal !== undefined && !isNaN(Number(salVal)) ? `$${Number(salVal).toFixed(2)} (${salFreq})` : "—";

            const salAfterVal = m.new_values?.salary_after_contract ?? (emp as any)?.contract_rate_after;
            const salAfterFreq = m.new_values?.contract_rate_after_frequency || (emp as any)?.contract_rate_after_frequency || "Monthly";
            const salaryAfterProbation = salAfterVal !== null && salAfterVal !== undefined && !isNaN(Number(salAfterVal)) && Number(salAfterVal) > 0 ? `$${Number(salAfterVal).toFixed(2)} (${salAfterFreq})` : "—";

            return `<tr>
              <td style="text-align:center;color:#64748b;font-weight:600">${idx + 1}</td>
              <td style="white-space:nowrap">${formatDate(m.effective_date)}</td>
              <td><span style="display:inline-block;padding:2px 5px;border-radius:3px;font-size:9.5px;font-weight:600;background:#eff6ff;color:#1d4ed8">${typeConfig?.label || m.movement_type}</span></td>
              <td style="font-family:monospace;font-size:9.5px">${empCode}</td>
              <td style="font-weight:700;color:#253C7D">${fullName}</td>
              <td>${division}</td>
              <td style="font-weight:600">${department}</td>
              <td>${position}</td>
              <td>${buName}</td>
              <td>${site}</td>
              <td><strong>${contractType}</strong></td>
              <td style="white-space:nowrap;font-size:9.5px">${contractDate}</td>
              <td>${employeeLevel}</td>
              <td>${employeeType}</td>
              <td>${supervisor}</td>
              <td style="white-space:nowrap">${salary}</td>
              <td style="white-space:nowrap">${salaryAfterProbation}</td>
              <td style="font-size:9.5px">${m.remarks || "—"}</td>
              <td><span style="display:inline-block;padding:2px 5px;border-radius:2px;font-size:9.5px;font-weight:600;background:#2ecc71;color:#fff">Recorded</span></td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="19" style="text-align:center;padding:24px;color:#64748b;">No records found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: landscape; margin: 8mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 12px; color: #1e293b; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 10px; margin-bottom: 12px; }
      .title { font-size: 16px; font-weight: 800; color: #253C7D; margin: 0 0 4px 0; }
      .subtitle { font-size: 10.5px; color: #64748b; margin: 0; }
      table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
      th { text-align: left; padding: 6px 4px; background: #f8fafc; color: #475569; font-size: 9px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; white-space: nowrap; }
      td { padding: 5px 4px; border-bottom: 1px solid #e2e8f0; vertical-align: top; word-break: break-word; }
      @media print {
        body { padding: 0; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <h1 class="title">${title}</h1>
        <p class="subtitle">Generated on ${new Date().toLocaleString()} &bull; Total Records: ${total}</p>
      </div>
      <button class="no-print" onclick="window.print()" style="background:#253C7D;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:600;font-size:11px;">Print / Save PDF</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>No</th>
          <th>Effective date</th>
          <th>Status Type</th>
          <th>Employee Code</th>
          <th>Employee Name</th>
          <th>Division</th>
          <th>Department</th>
          <th>Position</th>
          <th>Business Unit</th>
          <th>Site</th>
          <th>Contract Type</th>
          <th>Contract Date</th>
          <th>Employee Level</th>
          <th>Employee Type</th>
          <th>Supervisor</th>
          <th>Salary</th>
          <th>Salary After Probation</th>
          <th>Remark</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </body>
  </html>`;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate the print-ready PDF.");
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}
