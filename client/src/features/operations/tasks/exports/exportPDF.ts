import type { Task } from "../types";
import { STATUS_CONFIG, PRIORITY_META } from "../constants";

export const exportTasksPDF = (tasks: Task[], title = "Workforce Tasks & Field Activity Report") => {
  if (tasks.length === 0) return;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const blocked = tasks.filter((t) => t.status === "blocked").length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const outsideWork = tasks.filter((t) => t.is_outside_work).length;

  const statusBadges: Record<Task["status"], { bg: string; color: string; label: string }> = {
    done: { bg: "#d1fae5", color: "#065f46", label: "Completed" },
    in_progress: { bg: "#e0f2fe", color: "#0369a1", label: "In Progress" },
    blocked: { bg: "#fee2e2", color: "#991b1b", label: "Blocked" },
    todo: { bg: "#f1f5f9", color: "#475569", label: "To Do" },
  };

  const priorityBadges: Record<Task["priority"], { bg: string; color: string; label: string }> = {
    urgent: { bg: "#fee2e2", color: "#991b1b", label: "Urgent" },
    high: { bg: "#fef3c7", color: "#92400e", label: "High" },
    medium: { bg: "#e0f2fe", color: "#0369a1", label: "Medium" },
    low: { bg: "#f1f5f9", color: "#475569", label: "Low" },
  };

  const rows = tasks
    .map((t) => {
      const assignee = t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unassigned";
      const dept = t.employees?.department || "—";
      const sBadge = statusBadges[t.status] || { bg: "#f1f5f9", color: "#475569", label: t.status };
      const pBadge = priorityBadges[t.priority] || { bg: "#f1f5f9", color: "#475569", label: t.priority };
      const fieldTag = t.is_outside_work
        ? `<span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;background:#ede9fe;color:#5b21b6">GPS Field</span>`
        : `<span style="color:#94a3b8;font-size:10px">Office</span>`;

      return `<tr>
        <td style="font-weight:700;color:#111827">${t.title}</td>
        <td style="font-weight:600;color:#334155">${assignee}</td>
        <td>${dept}</td>
        <td style="text-align:center">
          <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:${pBadge.bg};color:${pBadge.color}">
            ${pBadge.label}
          </span>
        </td>
        <td style="text-align:center">
          <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:${sBadge.bg};color:${sBadge.color}">
            ${sBadge.label}
          </span>
        </td>
        <td>${t.due_date || "—"}</td>
        <td style="text-align:center">${fieldTag}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 15mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
      .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 14px; margin-bottom: 18px; }
      h1 { font-size: 20px; font-weight: 800; color: #253C7D; margin: 0 0 4px 0; }
      .meta { font-size: 11px; color: #64748b; }
      .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 18px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; text-align: center; }
      .stat-val { font-size: 18px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
      th { text-align: left; padding: 8px 10px; background: #253C7D; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) { background-color: #f8fafc; }
      .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>HRM_OPS — ${title}</h1>
        <div class="meta">Workforce Operations &amp; Task Management Summary</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Field Tasks (GPS):</strong> ${outsideWork}</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">${total}</div>
        <div class="stat-lbl">Total Tasks</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#059669">${completed}</div>
        <div class="stat-lbl">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#0284c7">${inProgress}</div>
        <div class="stat-lbl">In Progress</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#dc2626">${blocked}</div>
        <div class="stat-lbl">Blocked</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#64748b">${todo}</div>
        <div class="stat-lbl">To Do</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Task Title</th>
          <th>Assignee</th>
          <th>Department</th>
          <th style="text-align:center">Priority</th>
          <th style="text-align:center">Status</th>
          <th>Due Date</th>
          <th style="text-align:center">Type</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Confidential Task Roster</div>
      <div>Page 1 of 1</div>
    </div>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  }
};

