import type { Expense } from "../types";

export function exportExpensesPDF(expenses: Expense[], title = "Corporate Expense & Financial Ledger Report"): boolean {
  const total = expenses.length;
  const totalAmount = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const paidAmount = expenses.filter((e) => e.status === "paid").reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const pendingAmount = expenses.filter((e) => e.status === "pending").reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const approvedAmount = expenses.filter((e) => e.status === "approved").reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const rows = expenses.length > 0
    ? expenses
        .map((e) => {
          const statusStr = (e.status || "pending").toUpperCase();
          const branchName = e.branches?.name || "General";
          const desc = e.description || "—";
          const submitter = e.submitted_by || "—";

          const statColor =
            e.status === "paid"
              ? "background:#d1fae5;color:#065f46"
              : e.status === "approved"
              ? "background:#e0f2fe;color:#0369a1"
              : e.status === "rejected"
              ? "background:#fee2e2;color:#991b1b"
              : "background:#fef3c7;color:#92400e";

          return `<tr>
            <td style="font-weight:700;color:#253C7D">${e.category}<br/><span style="font-size:10px;color:#64748b">${branchName}</span></td>
            <td>${e.date}</td>
            <td style="font-weight:600">${desc}</td>
            <td>${submitter}</td>
            <td style="text-align:right;font-weight:800;color:#253C7D">$${Number(e.amount || 0).toLocaleString()}</td>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statColor}">
                ${statusStr}
              </span>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No expense records found.</td></tr>`;

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
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; text-align: center; }
      .stat-val { font-size: 18px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
      th { text-align: left; padding: 8px 8px; background: #253C7D; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) { background-color: #f8fafc; }
      .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>HRM_OPS — ${title}</h1>
        <div class="meta">Corporate Finance &middot; Expense &amp; Cashflow Summary</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Transactions:</strong> ${total} Entries</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val">$${totalAmount.toLocaleString()}</div><div class="stat-lbl">Total Expenses</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#059669">$${paidAmount.toLocaleString()}</div><div class="stat-lbl">Disbursed (Paid)</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#0284c7">$${approvedAmount.toLocaleString()}</div><div class="stat-lbl">Approved Pending Pay</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#d97706">$${pendingAmount.toLocaleString()}</div><div class="stat-lbl">Awaiting Approval</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Category &amp; Branch</th>
          <th>Transaction Date</th>
          <th>Description</th>
          <th>Submitted By</th>
          <th style="text-align:right">Amount</th>
          <th>Payment Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Financial Operations</div>
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
  return true;
}
