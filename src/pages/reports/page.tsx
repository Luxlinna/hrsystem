import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import ReportViewer from "./components/ReportViewer";

const MODULES = [
  { id: "leave", label: "Leave Summary", icon: "ri-calendar-event-line", color: "bg-amber-50 text-amber-700 border-amber-200", desc: "All leave requests by employee, type, and status" },
  { id: "payroll", label: "Payroll Report", icon: "ri-money-dollar-circle-line", color: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "Salary, bonuses, deductions and net pay records" },
  { id: "headcount", label: "Headcount Report", icon: "ri-team-line", color: "bg-sky-50 text-sky-700 border-sky-200", desc: "Employee distribution by branch and department" },
  { id: "expenses", label: "Expense Report", icon: "ri-bank-line", color: "bg-teal-50 text-teal-700 border-teal-200", desc: "All expense records with approval status" },
  { id: "hire", label: "Hire Pipeline", icon: "ri-briefcase-line", color: "bg-violet-50 text-violet-700 border-violet-200", desc: "Candidate pipeline and hiring funnel stages" },
  { id: "daily-logs", label: "Daily Work Logs", icon: "ri-file-list-2-line", color: "bg-indigo-50 text-indigo-700 border-indigo-200", desc: "Every employee's daily work entries — what they worked on, when" },
];

// Modules whose rows are tied to one employee, so the name/department/
// branch filters below actually apply to them.
const EMPLOYEE_SCOPED_MODULES = new Set(["leave", "payroll", "headcount", "daily-logs"]);

// Maps displayed column labels to the report row object's property names,
// shared by every export format so CSV/PDF/Excel stay consistent.
const COLUMN_KEY_MAP: Record<string, string> = {
  "Employee": "employee", "Department": "department", "Type": "leave_type", "Start Date": "start_date",
  "End Date": "end_date", "Days": "days", "Status": "status", "Month": "month",
  "Base Salary": "base_salary", "Bonus": "bonus", "Deductions": "deductions", "Net Pay": "net_pay",
  "Branch": "branch", "Total Headcount": "employee_count", "Active": "active", "Onboarding": "onboarding",
  "Description": "description", "Category": "category", "Amount": "amount", "Submitted By": "submitted_by",
  "Date": "date", "Candidate": "name", "Position": "position", "Stage": "stage", "Applied Date": "applied_date",
  "Time": "time", "Activity": "activity", "Notes": "notes",
};

const cellValue = (row: any, col: string) => row[COLUMN_KEY_MAP[col] || col.toLowerCase()];

const reportFileName = (moduleLabel: string) =>
  `${moduleLabel.toLowerCase().replace(/ /g, "-")}-${new Date().toISOString().substring(0, 10)}`;

const EXPORT_FORMAT_LABEL: Record<string, string> = { pdf: "PDF", csv: "CSV", xlsx: "Excel" };

export default function ReportsPage() {
  const [activeModule, setActiveModule] = useState("leave");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportColumns, setReportColumns] = useState<string[]>([]);
  const [exporting, setExporting] = useState<"pdf" | "csv" | "xlsx" | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("employees").select("department").eq("status", "active").then(({ data }) => {
      setDepartments([...new Set((data || []).map((r) => r.department).filter(Boolean))].sort());
    });
    supabase.from("branches").select("name").order("name").then(({ data }) => {
      setBranches((data || []).map((r) => r.name));
    });
  }, []);

  // Close the export dropdown when clicking anywhere outside of it.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isEmployeeScoped = EMPLOYEE_SCOPED_MODULES.has(activeModule);

  const reportConfig = useMemo(
    () => ({ module: activeModule, dateFrom, dateTo, employeeSearch, departmentFilter, branchFilter }),
    [activeModule, dateFrom, dateTo, employeeSearch, departmentFilter, branchFilter]
  );

  const handleDataReady = useCallback((rows: any[], cols: string[]) => {
    setReportData(rows);
    setReportColumns(cols);
  }, []);

  const exportCSV = () => {
    setExporting("csv");
    const module = MODULES.find((m) => m.id === activeModule);
    const header = reportColumns.join(",");
    const rows = reportData.map((row) =>
      reportColumns.map((col) => {
        const v = String(cellValue(row, col) ?? "");
        return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportFileName(module?.label || "report")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(null), 800);
  };

  const exportExcel = () => {
    setExporting("xlsx");
    const module = MODULES.find((m) => m.id === activeModule);
    const aoa = [
      reportColumns,
      ...reportData.map((row) => reportColumns.map((col) => cellValue(row, col) ?? "")),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = reportColumns.map((col) => ({ wch: Math.max(col.length + 2, 10) }));
    const wb = XLSX.utils.book_new();
    // Excel forbids a few characters in sheet names; strip them before truncating.
    const sheetName = (module?.label || "Report").replace(/[\[\]:*?/\\]/g, "").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${reportFileName(module?.label || "report")}.xlsx`);
    setTimeout(() => setExporting(null), 800);
  };

  const exportPDF = () => {
    setExporting("pdf");
    const module = MODULES.find((m) => m.id === activeModule);
    const dateRange = dateFrom || dateTo ? ` | ${dateFrom || "—"} to ${dateTo || "—"}` : "";
    const tableRows = reportData.map((row) =>
      `<tr>${reportColumns.map((col) => {
        const v = cellValue(row, col);
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
      <h1>HRM_OPS — ${module?.label}</h1>
      <p>Generated: ${new Date().toLocaleString("en-US")}${dateRange} · ${reportData.length} records</p>
      <table><thead><tr>${reportColumns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
      <tbody>${tableRows}</tbody></table>
      <div class="footer">HRM_OPS HRMS · Confidential</div>
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
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            disabled={reportData.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#253C7D] text-white rounded-lg text-sm font-medium hover:bg-[#1F336A] transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            {exporting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="ri-download-2-line" />}
            {exporting ? `Exporting ${EXPORT_FORMAT_LABEL[exporting]}...` : "Export"}
            <i className={`ri-arrow-down-s-line text-base transition-transform ${exportOpen ? "rotate-180" : ""}`} />
          </button>

          {exportOpen && reportData.length > 0 && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-50">
              <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Export as</p>
              {[
                { fmt: "pdf" as const, label: "PDF Document", hint: ".pdf", icon: "ri-file-pdf-line", desc: "Print-ready report", color: "text-red-500" },
                { fmt: "csv" as const, label: "CSV Spreadsheet", hint: ".csv", icon: "ri-file-text-line", desc: "Comma-separated values", color: "text-emerald-600" },
                { fmt: "xlsx" as const, label: "Excel Workbook", hint: ".xlsx", icon: "ri-file-excel-2-line", desc: "Microsoft Excel format", color: "text-green-600" },
              ].map((opt) => (
                <button
                  key={opt.fmt}
                  onClick={() => {
                    setExportOpen(false);
                    if (opt.fmt === "pdf") exportPDF();
                    else if (opt.fmt === "csv") exportCSV();
                    else exportExcel();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left cursor-pointer group"
                >
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white transition-colors shrink-0">
                    <i className={`${opt.icon} text-base ${opt.color}`} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-800">{opt.label}</span>
                    <span className="block text-[11px] text-gray-400">{opt.desc}</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono shrink-0">{opt.hint}</span>
                </button>
              ))}
            </div>
          )}
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

          {/* Employee / Department / Branch */}
          <div className={`bg-white border border-gray-100 rounded-xl p-4 ${!isEmployeeScoped ? "opacity-40 pointer-events-none" : ""}`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Employee Filters {!isEmployeeScoped && <span className="normal-case font-normal">(not used by this report)</span>}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name</label>
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Search employee name..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Branch / Team</label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {(employeeSearch || departmentFilter || branchFilter) && (
                <button
                  onClick={() => { setEmployeeSearch(""); setDepartmentFilter(""); setBranchFilter(""); }}
                  className="text-xs text-[#253C7D] hover:underline cursor-pointer w-full text-center"
                >
                  Clear employee filters
                </button>
              )}
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
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-[#253C7D] hover:underline cursor-pointer w-full text-center">
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
                config={reportConfig}
                onDataReady={handleDataReady}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}