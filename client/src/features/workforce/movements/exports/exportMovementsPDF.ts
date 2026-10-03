import type { EmployeeMovement } from "../types";
import { MOVEMENT_TYPES } from "../constants";

export function exportMovementsPDF(movements: EmployeeMovement[], title = "Employee Movement & Personnel Actions Audit Report"): boolean {
  const total = movements.length;
  const promoCount = movements.filter((m) => m.movement_type === "promote").length;
  const transferCount = movements.filter((m) => m.movement_type === "transfer").length;
  const passProbCount = movements.filter((m) => m.movement_type === "pass_probation").length;
  const salaryCount = movements.filter((m) => m.movement_type === "salary_adjustment").length;

  const rows =
    movements.length > 0
      ? movements
          .map((m) => {
            const empName = m.employees ? `${m.employees.first_name} ${m.employees.last_name}` : "Unknown Employee";
            const dept = m.employees?.department || "—";
            const branch = m.employees?.branches?.name || "—";
            const typeConfig = MOVEMENT_TYPES[m.movement_type];
            const typeLabel = typeConfig?.label || m.movement_type;

            const prevSummary = Object.entries(m.previous_values || {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ") || "—";
            const newSummary = Object.entries(m.new_values || {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ") || "—";

            return `<tr>
              <td style="font-weight:700;color:#253C7D">${empName}<br/><span style="font-size:10px;color:#64748b">${dept} &bull; ${branch}</span></td>
              <td>
                <span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#f1f5f9;color:#1e293b;border:1px solid #cbd5e1">
                  ${typeLabel}
                </span>
              </td>
              <td style="font-weight:600">${m.title}<br/><span style="font-size:10px;color:#64748b">Effective: ${m.effective_date}</span></td>
              <td style="font-size:11px;color:#475569">${prevSummary}</td>
              <td style="font-size:11px;font-weight:600;color:#0f172a">${newSummary}</td>
              <td style="font-size:11px">${m.remarks || "—"}</td>
              <td style="font-size:10px;color:#64748b">${m.created_by_name || "HR Admin"}</td>
            </tr>`;
          })
          .join("")
      : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No movement records found.</td></tr>`;

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 16px; margin-bottom: 20px; }
      .title { font-size: 20px; font-weight: 800; color: #253C7D; margin: 0 0 4px 0; }
      .subtitle { font-size: 11px; color: #64748b; margin: 0; }
      .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
      .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
      .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; }
      .kpi-value { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: left; padding: 10px 8px; background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
      td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
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
        <p class="subtitle">Generated on ${new Date().toLocaleString()} &bull; HRM_OPS Personnel Lifecycle System</p>
      </div>
      <button class="no-print" onclick="window.print()" style="background:#253C7D;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">Print / Save PDF</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Total Movements</div><div class="kpi-value">${total}</div></div>
      <div class="kpi-card"><div class="kpi-label">Promotions</div><div class="kpi-value" style="color:#7c3aed">${promoCount}</div></div>
      <div class="kpi-card"><div class="kpi-label">Transfers</div><div class="kpi-value" style="color:#0284c7">${transferCount}</div></div>
      <div class="kpi-card"><div class="kpi-label">Passed Probation</div><div class="kpi-value" style="color:#059669">${passProbCount}</div></div>
      <div class="kpi-card"><div class="kpi-label">Salary Adjustments</div><div class="kpi-value" style="color:#0d9488">${salaryCount}</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Type</th>
          <th>Action Details</th>
          <th>Previous State</th>
          <th>New Assigned State</th>
          <th>Remarks</th>
          <th>Recorded By</th>
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
