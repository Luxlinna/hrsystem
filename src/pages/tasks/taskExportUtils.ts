import type { Task, Employee } from "./types";
import { STATUS_CONFIG } from "./constants";
import { formatExact } from "./taskUtils";

// Helper for dynamic XLSX loading
const getXLSX = async () => {
  return await import("xlsx");
};

export const exportTasksCSV = (tasks: Task[], filename = "tasks_report.csv") => {
  if (tasks.length === 0) return;
  const headers = ["Title", "Assignee", "Department", "Priority", "Status", "Due Date", "Outside Work", "Created At"];
  const rows = tasks.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unassigned"}"`,
    `"${t.employees?.department || "—"}"`,
    t.priority,
    STATUS_CONFIG[t.status]?.label || t.status,
    t.due_date || "—",
    t.is_outside_work ? "Yes" : "No",
    t.created_at.slice(0, 10),
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportTasksXLSX = async (tasks: Task[], filename = "tasks_report.xlsx") => {
  if (tasks.length === 0) return;
  const data = tasks.map((t) => ({
    Title: t.title,
    Description: t.description || "",
    Assignee: t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unassigned",
    Department: t.employees?.department || "—",
    Priority: t.priority,
    Status: STATUS_CONFIG[t.status]?.label || t.status,
    "Due Date": t.due_date || "—",
    "Outside Work": t.is_outside_work ? "Yes" : "No",
    "Created Date": t.created_at.slice(0, 10),
  }));

  const headers = Object.keys(data[0]);
  const aoa = [headers, ...data.map((r) => headers.map((h) => r[h as keyof typeof r]))];
  const XLSX = await getXLSX();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = headers.map((c) => ({ wch: Math.max(c.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tasks Report");
  XLSX.writeFile(wb, filename);
};

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

export const exportTasksSVG = (tasks: Task[], filename = "task_metrics_chart.svg") => {
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProg = tasks.filter((t) => t.status === "in_progress").length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length || 1;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320" style="background:#ffffff;border-radius:16px;font-family:sans-serif;">
    <rect width="600" height="320" fill="#ffffff" rx="16"/>
    <text x="24" y="36" font-size="18" font-weight="bold" fill="#0f172a">Workforce Task Status Distribution</text>
    <text x="24" y="56" font-size="12" fill="#64748b">Generated on ${new Date().toLocaleDateString()} &middot; Total: ${tasks.length} tasks</text>
    
    <!-- Progress Bar Stack -->
    <g transform="translate(24, 80)">
      <rect x="0" y="0" width="${(todo / total) * 552}" height="32" fill="#64748b" rx="4"/>
      <rect x="${(todo / total) * 552}" y="0" width="${(inProg / total) * 552}" height="32" fill="#0284c7" rx="4"/>
      <rect x="${((todo + inProg) / total) * 552}" y="0" width="${(blocked / total) * 552}" height="32" fill="#e11d48" rx="4"/>
      <rect x="${((todo + inProg + blocked) / total) * 552}" y="0" width="${(done / total) * 552}" height="32" fill="#059669" rx="4"/>
    </g>

    <!-- Legend & Counts -->
    <g transform="translate(24, 150)">
      <rect x="0" y="0" width="12" height="12" fill="#64748b" rx="2"/><text x="20" y="11" font-size="13" font-weight="600" fill="#334155">To Do: ${todo} (${Math.round((todo / total) * 100)}%)</text>
      <rect x="260" y="0" width="12" height="12" fill="#0284c7" rx="2"/><text x="280" y="11" font-size="13" font-weight="600" fill="#334155">In Progress: ${inProg} (${Math.round((inProg / total) * 100)}%)</text>
      <rect x="0" y="40" width="12" height="12" fill="#e11d48" rx="2"/><text x="20" y="51" font-size="13" font-weight="600" fill="#334155">Blocked: ${blocked} (${Math.round((blocked / total) * 100)}%)</text>
      <rect x="260" y="40" width="12" height="12" fill="#059669" rx="2"/><text x="280" y="51" font-size="13" font-weight="600" fill="#334155">Completed: ${done} (${Math.round((done / total) * 100)}%)</text>
    </g>
    <text x="24" y="290" font-size="11" fill="#94a3b8">HRM_OPS HRMS &middot; Vector Chart Export</text>
  </svg>`;

  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
