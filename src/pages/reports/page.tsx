import { useState, useCallback, useRef } from "react";
import ReportViewer from "./components/ReportViewer";

const MODULES = [
  { id: "leave", label: "Leave Summary", icon: "ri-calendar-event-line", color: "bg-amber-50 text-amber-700 border-amber-200", desc: "All leave requests by employee, type, and status" },
  { id: "payroll", label: "Payroll Report", icon: "ri-money-dollar-circle-line", color: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "Salary, bonuses, deductions and net pay records" },
  { id: "headcount", label: "Headcount Report", icon: "ri-team-line", color: "bg-sky-50 text-sky-700 border-sky-200", desc: "Employee distribution by branch and department" },
  { id: "expenses", label: "Expense Report", icon: "ri-bank-line", color: "bg-teal-50 text-teal-700 border-teal-200", desc: "All expense records with approval status" },
  { id: "hire", label: "Hire Pipeline", icon: "ri-briefcase-line", color: "bg-violet-50 text-violet-700 border-violet-200", desc: "Candidate pipeline and hiring funnel stages" },
];

export default function ReportsPage() {
  const [activeModule, setActiveModule] = useState("leave");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportColumns, setReportColumns] = useState<string[]>([]);
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDataReady = useCallback((rows: any[], cols: string[]) => {
    setReportData(rows);
    setReportColumns(cols);
  }, []);

  const exportCSV = () => {
    setExporting("csv");
    const module = MODULES.find((m) => m.id === activeModule);
    const header = reportColumns.join(",");
    const keyMap: Record<string, string> = {
      "Employee": "employee", "Department": "department", "Type": "leave_type", "Start Date": "start_date",
      "End Date": "end_date", "Days": "days", "Status": "status", "Month": "month",
      "Base Salary": "base_salary", "Bonus": "bonus", "Deductions": "deductions", "Net Pay": "net_pay",
      "Branch": "branch", "Total Headcount": "employee_count", "Active": "active", "Onboarding": "onboarding",
      "Description": "description", "Category": "category", "Amount": "amount", "Submitted By": "submitted_by",
      "Date": "date", "Candidate": "name", "Position": "position", "Stage": "stage", "Applied Date": "applied_date",
    };
    const rows = reportData.map((row) =>
      reportColumns.map((col) => {
        const key = keyMap[col] || col.toLowerCase();
        const v = row[key];
        const str = String(v ?? "");
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module?.label.toLowerCase().replace(/ /g, "-")}-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(null), 800);
  };

  const exportPDF = () => {
    setExporting("pdf");
    const module = MODULES.find((m) => m.id === activeModule);
    const dateRange = dateFrom || dateTo ? ` | ${dateFrom || "—"} to ${dateTo || "—"}` : "";
    const keyMap: Record<string, string> = {
      "Employee": "employee", "Department": "department", "Type": "leave_type", "Start Date": "start_date",
      "End Date": "end_date", "Days": "days", "Status": "status", "Month": "month",
      "Base Salary": "base_salary", "Bonus": "bonus", "Deductions": "deductions", "Net Pay": "net_pay",
      "Branch": "branch", "Total Headcount": "employee_count", "Active": "active", "Onboarding": "onboarding",
      "Description": "description", "Category": "category", "Amount": "amount", "Submitted By": "submitted_by",
      "Date": "date", "Candidate": "name", "Position": "position", "Stage": "stage", "Applied Date": "applied_date",
    };
    const tableRows = reportData.map((row) =>
      `<tr>${reportColumns.map((col) => {
        const key = keyMap[col] || col.toLowerCase();
        const v = row[key];
        let val = String(v ?? "—");
        if (col.includes("Salary") || col.includes("Pay") || col.includes("Bonus") || col.includes("Deduct") || col === "Amount") {
          val = `$${Number(v || 0).toLocaleString()}`;
        }
        return `<td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px">${val}</td>`;
      }).join("")}</tr>`
    ).join("");

    const html = `<!DOCTYPE html><html><head><title>${module?.label}</title><style>
      body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111}
      h1{font-size:20px;margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:20px}
      table{width:100%;border-collapse:collapse}
      th{text-align:left;padding:8px 10px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#666}
      td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
      .footer{margin-top:20px;font-size:10px;color:#999;text-align:right}
      @media print{body{padding:0}}
    </style></head><body>
      <h1>HR Nexus — ${module?.label}</h1>
      <p>Generated: ${new Date().toLocaleString("en-US")}${dateRange} · ${reportData.length} records</p>
      <table><thead><tr>${reportColumns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
      <tbody>${tableRows}</tbody></table>
      <div class="footer">HR Nexus HRMS · Confidential</div>
    </body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.onload = () => { win.print(); win.close(); };
    }
    setTimeout(() => setExporting(null), 800);
  };

  const activeModuleInfo = MODULES.find((m) => m.id === activeModule)!;

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Reports &amp; Export Center
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate, preview, and export HR reports per module</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={reportData.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            {exporting === "csv" ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <i className="ri-file-excel-line" />}
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            disabled={reportData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            {exporting === "pdf" ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="ri-file-pdf-line" />}
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel — Module Selector + Filters */}
        <div className="lg:w-[280px] shrink-0 space-y-4">
          {/* Module Cards */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select Report Type</p>
            <div className="space-y-2">
              {MODULES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    activeModule === m.id ? `${m.color} border-current` : "border-transparent hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${activeModule === m.id ? "bg-current/10" : "bg-gray-100"}`}>
                    <i className={`${m.icon} text-sm ${activeModule === m.id ? "" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{m.label}</p>
                    <p className="text-[11px] opacity-70 mt-0.5 leading-snug">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Date Range Filter</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0D7377]/30 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0D7377]/30 cursor-pointer"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-[#0D7377] hover:underline cursor-pointer w-full text-center">
                  Clear dates
                </button>
              )}
            </div>

            {/* Quick presets */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">Quick Presets</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "This Month", fn: () => { const n = new Date(); setDateFrom(n.toISOString().substring(0, 7) + "-01"); setDateTo(new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().substring(0, 10)); } },
                { label: "Last Month", fn: () => { const n = new Date(); n.setMonth(n.getMonth() - 1); setDateFrom(n.toISOString().substring(0, 7) + "-01"); setDateTo(new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().substring(0, 10)); } },
                { label: "Q1 2026", fn: () => { setDateFrom("2026-01-01"); setDateTo("2026-03-31"); } },
                { label: "Q2 2026", fn: () => { setDateFrom("2026-04-01"); setDateTo("2026-06-30"); } },
                { label: "YTD 2026", fn: () => { setDateFrom("2026-01-01"); setDateTo(new Date().toISOString().substring(0, 10)); } },
                { label: "All Time", fn: () => { setDateFrom(""); setDateTo(""); } },
              ].map((p) => (
                <button key={p.label} onClick={p.fn} className="px-2 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-gray-600 transition-colors cursor-pointer text-center whitespace-nowrap">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — Report Preview */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            {/* Report header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${activeModuleInfo.color}`}>
                  <i className={`${activeModuleInfo.icon} text-lg`} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{activeModuleInfo.label}</h2>
                  <p className="text-xs text-gray-500">
                    {dateFrom || dateTo ? `${dateFrom || "Start"} → ${dateTo || "Today"}` : "All time"}
                    {reportData.length > 0 && ` · ${reportData.length} records`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Generated</p>
                <p className="text-xs font-medium text-gray-600">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
            </div>

            <div ref={printRef}>
              <ReportViewer
                config={{ module: activeModule, dateFrom, dateTo }}
                onDataReady={handleDataReady}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}