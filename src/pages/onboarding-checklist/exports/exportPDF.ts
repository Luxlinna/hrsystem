import type { OnboardingHire, ChecklistTask } from "../types";
import { getHireName } from "../checklistUtils";

export const exportChecklistPDF = (hire: OnboardingHire, tasks: ChecklistTask[]) => {
  const hireName = getHireName(hire);
  const emp = hire.employees;
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length || 1;
  const pct = Math.round((completedCount / totalCount) * 100);

  const taskRows = tasks
    .map(
      (t, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9; page-break-inside: avoid;">
        <td style="padding: 8px 10px; font-weight: 700; color: #64748b; width: 30px; vertical-align: top;">${idx + 1}.</td>
        <td style="padding: 8px 10px; vertical-align: top;">
          <div style="font-weight: 700; color: ${t.completed ? "#0f172a" : "#475569"}; font-size: 12px;">${t.task_name}</div>
          ${t.description ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${t.description}</div>` : ""}
        </td>
        <td style="padding: 8px 10px; text-align: center; vertical-align: top; width: 110px;">
          <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; ${
            t.completed ? "background: #dcfce7; color: #15803d;" : "background: #f1f5f9; color: #64748b;"
          }">
            ${t.completed ? "Completed" : "Pending"}
          </span>
        </td>
        <td style="padding: 8px 10px; font-size: 11px; color: #64748b; vertical-align: top; width: 120px;">
          ${t.due_date ? t.due_date : "—"}
        </td>
      </tr>
    `
    )
    .join("");

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>Onboarding Checklist — ${hireName}</title>
    <meta charset="utf-8" />
    <style>
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        margin: 0;
        padding: 0;
        color: #0f172a;
        background: #ffffff;
      }
      .header-box {
        border-bottom: 2px solid #253C7D;
        padding-bottom: 14px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      h1 {
        font-size: 20px;
        font-weight: 800;
        color: #253C7D;
        margin: 0 0 4px 0;
      }
      .meta {
        font-size: 12px;
        color: #475569;
      }
      .progress-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 16px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 24px;
      }
      th {
        text-align: left;
        background: #253C7D;
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        padding: 8px 10px;
        letter-spacing: 0.5px;
      }
      .signatures {
        margin-top: 30px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        page-break-inside: avoid;
      }
      .sig-line {
        margin-top: 40px;
        border-bottom: 1px solid #cbd5e1;
        width: 200px;
      }
      .footer {
        margin-top: 24px;
        font-size: 10px;
        color: #94a3b8;
        display: flex;
        justify-content: space-between;
        border-top: 1px solid #f1f5f9;
        padding-top: 8px;
      }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>Onboarding Checklist Summary</h1>
        <div class="meta">Employee: <strong>${hireName}</strong> &middot; ${emp?.role || "Staff"} &middot; ${emp?.department || "General"}</div>
      </div>
      <div class="meta" style="text-align: right;">
        <div><strong>Date:</strong> ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        <div>HR Management System</div>
      </div>
    </div>

    <div class="progress-card">
      <span style="font-size: 12px; font-weight: 700; color: #334155;">Checklist Progress:</span>
      <span style="font-size: 14px; font-weight: 800; color: #253C7D;">${completedCount} of ${tasks.length} tasks completed (${pct}%)</span>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Checklist Task & Description</th>
          <th style="text-align: center;">Status</th>
          <th>Due Date</th>
        </tr>
      </thead>
      <tbody>
        ${taskRows}
      </tbody>
    </table>

    <div class="signatures">
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #334155;">HR Manager Signature:</div>
        <div class="sig-line"></div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Date: _______________</div>
      </div>
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #334155;">Department Lead Signature:</div>
        <div class="sig-line"></div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Date: _______________</div>
      </div>
    </div>

    <div class="footer">
      <div>HRM_OPS &middot; Confidential Employee Record</div>
      <div>Page 1 of 1</div>
    </div>
  </body>
  </html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
};
