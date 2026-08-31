import type { Task } from "../types";
import { STATUS_CONFIG } from "../constants";

export const exportTasksPDF = (tasks: Task[], title = "Task & Field Work Report") => {
  if (tasks.length === 0) return;
  const headers = ["Title", "Assignee", "Department", "Priority", "Status", "Due Date", "Outside Work"];
  const rows = tasks
    .map(
      (t) =>
        `<tr>
          <td style="font-weight:600">${t.title}</td>
          <td>${t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unassigned"}</td>
          <td>${t.employees?.department || "—"}</td>
          <td><span style="text-transform:uppercase;font-size:10px;font-weight:700">${t.priority}</span></td>
          <td>${STATUS_CONFIG[t.status]?.label || t.status}</td>
          <td>${t.due_date || "—"}</td>
          <td>${t.is_outside_work ? "Yes (GPS Field)" : "No"}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #111; }
      h1 { font-size: 20px; margin-bottom: 4px; color: #253C7D; }
      p { font-size: 12px; color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { text-align: left; padding: 8px 10px; background: #253C7D; color: #fff; font-size: 11px; text-transform: uppercase; }
      td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
      tr:nth-child(even) { background-color: #fcfcfc; }
      .footer { margin-top: 24px; font-size: 10px; color: #999; text-align: right; border-top: 1px solid #eee; padding-top: 8px; }
    </style>
  </head>
  <body>
    <h1>HRM_OPS — ${title}</h1>
    <p>Generated: ${new Date().toLocaleString("en-US")} &middot; Total Tasks: ${tasks.length}</p>
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">HRM_OPS HRMS &middot; Confidential Workforce System Report</div>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  }
};
