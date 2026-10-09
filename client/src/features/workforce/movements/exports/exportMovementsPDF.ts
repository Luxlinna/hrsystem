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

export function exportMovementsPDF(movements: EmployeeMovement[], title = "Employee Change Statuses Report"): boolean {
  const total = movements.length;

  const rows =
    movements.length > 0
      ? movements
          .map((m, idx) => {
            const emp = m.employees;
            const typeConfig = MOVEMENT_TYPES[m.movement_type];
            const fullName = formatKhmerFullName(emp);
            const buName = emp?.branches?.name || (emp as any)?.bu_full_name || (emp as any)?.company || "—";
            const employeeCode = (emp as any)?.employee_code || (emp as any)?.candidate_code || (emp as any)?.id?.slice(0, 8) || m.employee_id?.slice(0, 8) || "—";
            const position = m.new_values?.role || m.new_values?.designation || emp?.role || (emp as any)?.position || "—";
            const empType = (m.new_values?.employment_type || (emp as any)?.employment_type || "Full Time");
            const division = m.new_values?.division || (emp as any)?.division || "—";
            const department = (m.new_values?.department || emp?.department || "—").toUpperCase();
            const site = (emp as any)?.work_locations?.name || (emp as any)?.site || "—";
            const joiningDate = formatDate((emp as any)?.join_date || (emp as any)?.start_date);
            const contractType = (m.new_values?.contract_type || (emp as any)?.contract_type || "—").toUpperCase();
            const contractStart = formatDate((emp as any)?.contract_start_date || (emp as any)?.start_date || m.effective_date);
            const contractEnd = (emp as any)?.contract_end_date ? formatDate((emp as any)?.contract_end_date) : "Ongoing";
            const contractPeriod = `${contractStart} - ${contractEnd}`;
            const rateVal = (emp as any)?.contract_rate ?? (emp as any)?.basic_salary ?? "0";
            const rateFreq = (emp as any)?.tax_salary_frequency || "Monthly";
            const rateStruct = (emp as any)?.payroll_structure === "Standard Monthly" ? "Gross" : ((emp as any)?.payroll_structure || "Gross");
            const rate = `${rateVal} USD<br/><span style="font-size:9px;color:#64748b">${rateFreq} &bull; ${rateStruct}</span>`;

            return `<tr>
              <td style="text-align:center;color:#64748b;font-weight:600">${idx + 1}</td>
              <td style="white-space:nowrap">${formatDate(m.effective_date)}</td>
              <td><span style="display:inline-block;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;background:#eff6ff;color:#1d4ed8">${typeConfig?.label || m.movement_type}</span></td>
              <td style="font-weight:700;color:#253C7D">${fullName}<br/><span style="font-size:9px;color:#64748b">${buName} ${employeeCode}</span></td>
              <td>${position}<br/><span style="font-size:9px;color:#64748b">${empType}</span></td>
              <td>${division}</td>
              <td style="font-weight:600">${department}<br/><span style="font-size:9px;color:#64748b">${site}</span></td>
              <td style="white-space:nowrap">${joiningDate}</td>
              <td><strong>${contractType}</strong><br/><span style="font-size:9px;color:#64748b">${contractPeriod}</span></td>
              <td>${rate}</td>
              <td><span style="display:inline-block;padding:2px 6px;border-radius:2px;font-size:10px;font-weight:600;background:#2ecc71;color:#fff">Recorded</span></td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="11" style="text-align:center;padding:24px;color:#64748b;">No records found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 12px; margin-bottom: 16px; }
      .title { font-size: 18px; font-weight: 800; color: #253C7D; margin: 0 0 4px 0; }
      .subtitle { font-size: 11px; color: #64748b; margin: 0; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th { text-align: left; padding: 8px 6px; background: #f8fafc; color: #475569; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
      td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
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
          <th>No.</th>
          <th>Effective Date</th>
          <th>Status Type</th>
          <th>Employee</th>
          <th>Position</th>
          <th>Division</th>
          <th>Department</th>
          <th>Joining Date</th>
          <th>Contract</th>
          <th>Rate</th>
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
