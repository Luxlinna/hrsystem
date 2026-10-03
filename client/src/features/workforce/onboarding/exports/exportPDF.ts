import type { OnboardingRequest, OnboardingDoc } from "../types";
import { STAGES } from "../constants";
import { getOverallProgress } from "../onboardingUtils";

const getStageLabel = (stageKey: string) => {
  const match = STAGES.find((s) => s.key === stageKey);
  return match?.label || stageKey;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "approved":
      return "In Progress";
    case "pending":
      return "Pending Approval";
    default:
      return status;
  }
};

export const exportOnboardingPDF = (
  requests: OnboardingRequest[],
  documents: OnboardingDoc[],
  title = "Employee Onboarding Workforce Report"
) => {
  if (requests.length === 0) return;

  const total = requests.length;
  const completed = requests.filter((r) => r.status === "completed").length;
  const inProgress = requests.filter((r) => r.status === "approved").length;
  const pending = requests.filter((r) => r.status === "pending").length;

  const rows = requests
    .map((req) => {
      const name = req.employees ? `${req.employees.first_name} ${req.employees.last_name}` : "Unknown";
      const role = req.employees?.role || "—";
      const dept = req.employees?.department || "—";
      const branch = req.employees?.branches?.name || "Headquarters";
      const stage = getStageLabel(req.stage);
      const status = getStatusLabel(req.status);
      const progress = getOverallProgress(req, documents);
      const reqDocs = documents.filter((d) => d.onboarding_request_id === req.id);
      const completedDocs = reqDocs.filter((d) => d.status === "complete").length;

      return `<tr>
        <td style="font-weight:700;color:#111">${name}</td>
        <td>${role}</td>
        <td>${dept}</td>
        <td>${branch}</td>
        <td><span style="font-weight:600;color:#253C7D">${stage}</span></td>
        <td>
          <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${
            req.status === "completed"
              ? "background:#d1fae5;color:#065f46"
              : req.status === "approved"
              ? "background:#dbeafe;color:#1e40af"
              : "background:#fef3c7;color:#92400e"
          }">
            ${status}
          </span>
        </td>
        <td style="text-align:center">${req.day_count || 0}d</td>
        <td style="font-weight:700;text-align:center">${progress}% (${completedDocs}/${reqDocs.length})</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 28px; color: #1e293b; }
      .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 16px; margin-bottom: 20px; }
      h1 { font-size: 22px; font-weight: 800; color: #253C7D; margin: 0 0 4px 0; }
      .meta { font-size: 11px; color: #64748b; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; text-align: center; }
      .stat-val { font-size: 20px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
      th { text-align: left; padding: 10px 8px; background: #253C7D; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 8px 8px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) { background-color: #f8fafc; }
      .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>HRM_OPS — ${title}</h1>
        <div class="meta">Comprehensive Employee Lifecycle & 4-Stage Onboarding Summary</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Active Records:</strong> ${total} Employees</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">${total}</div>
        <div class="stat-lbl">Total Onboarding</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#059669">${completed}</div>
        <div class="stat-lbl">Completed / Hired</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#2563eb">${inProgress}</div>
        <div class="stat-lbl">In Progress</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#d97706">${pending}</div>
        <div class="stat-lbl">Pending Approval</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee</th>
          <th>Role</th>
          <th>Department</th>
          <th>Branch</th>
          <th>Current Stage</th>
          <th>Status</th>
          <th style="text-align:center">Days</th>
          <th style="text-align:center">Progress</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Confidential Employee Record</div>
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
