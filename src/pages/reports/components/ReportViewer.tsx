import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

interface ReportConfig {
  module: string;
  dateFrom: string;
  dateTo: string;
}

interface LeaveRow {
  id: string;
  employee: string;
  department: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
}

interface PayrollRow {
  id: string;
  employee: string;
  department: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: string;
}

interface HeadcountRow {
  branch: string;
  department: string;
  employee_count: number;
  active: number;
  onboarding: number;
}

interface ExpenseRow {
  id: string;
  description: string;
  category: string;
  amount: number;
  submitted_by: string;
  status: string;
  date: string;
}

interface HireRow {
  id: string;
  name: string;
  position: string;
  stage: string;
  status: string;
  applied_date: string;
}

type ReportRow = LeaveRow | PayrollRow | HeadcountRow | ExpenseRow | HireRow;

interface Props {
  config: ReportConfig;
  onDataReady: (rows: ReportRow[], columns: string[]) => void;
}

const STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
  paid: "bg-emerald-50 text-emerald-700",
  processed: "bg-sky-50 text-sky-700",
  active: "bg-emerald-50 text-emerald-700",
  open: "bg-amber-50 text-amber-700",
  hired: "bg-emerald-50 text-emerald-700",
  interview: "bg-sky-50 text-sky-700",
  screening: "bg-violet-50 text-violet-700",
};

export default function ReportViewer({ config, onDataReady }: Props) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, string | number>>({});

  const fetchLeave = useCallback(async () => {
    let q = supabase
      .from("leave_requests")
      .select("id, leave_type, start_date, end_date, days, status, employees(first_name, last_name, department)")
      .order("created_at", { ascending: false });
    if (config.dateFrom) q = q.gte("start_date", config.dateFrom);
    if (config.dateTo) q = q.lte("end_date", config.dateTo);
    const { data } = await q;
    const mapped: LeaveRow[] = (data || []).map((r: any) => ({
      id: r.id,
      employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
      department: r.employees?.department || "—",
      leave_type: r.leave_type,
      start_date: r.start_date,
      end_date: r.end_date,
      days: r.days,
      status: r.status,
    }));
    const cols = ["Employee", "Department", "Type", "Start Date", "End Date", "Days", "Status"];
    setRows(mapped);
    setColumns(cols);
    const totalDays = mapped.reduce((s, r) => s + r.days, 0);
    const approved = mapped.filter((r) => r.status === "approved").length;
    setSummary({ "Total Requests": mapped.length, "Total Days": totalDays, Approved: approved, Pending: mapped.filter((r) => r.status === "pending").length });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchPayroll = useCallback(async () => {
    let q = supabase
      .from("payroll_records")
      .select("id, month, base_salary, bonus, deductions, net_pay, status, employees(first_name, last_name, department)")
      .order("month", { ascending: false });
    if (config.dateFrom) q = q.gte("month", config.dateFrom.substring(0, 7));
    if (config.dateTo) q = q.lte("month", config.dateTo.substring(0, 7));
    const { data } = await q;
    const mapped: PayrollRow[] = (data || []).map((r: any) => ({
      id: r.id,
      employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
      department: r.employees?.department || "—",
      month: r.month,
      base_salary: r.base_salary,
      bonus: r.bonus,
      deductions: r.deductions,
      net_pay: r.net_pay,
      status: r.status,
    }));
    const cols = ["Employee", "Department", "Month", "Base Salary", "Bonus", "Deductions", "Net Pay", "Status"];
    setRows(mapped);
    setColumns(cols);
    const total = mapped.reduce((s, r) => s + Number(r.net_pay), 0);
    setSummary({ "Total Records": mapped.length, "Total Net Pay": `$${total.toLocaleString()}`, Paid: mapped.filter((r) => r.status === "paid").length, Pending: mapped.filter((r) => r.status === "pending").length });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchHeadcount = useCallback(async () => {
    const { data: emps } = await supabase
      .from("employees")
      .select("id, department, status, branches(name)")
      .eq("status", "active");
    const map: Record<string, HeadcountRow> = {};
    (emps || []).forEach((e: any) => {
      const key = `${e.branches?.name || "Unassigned"}||${e.department || "General"}`;
      if (!map[key]) map[key] = { branch: e.branches?.name || "Unassigned", department: e.department || "General", employee_count: 0, active: 0, onboarding: 0 };
      map[key].employee_count++;
      if (e.status === "active") map[key].active++;
      if (e.status === "onboarding") map[key].onboarding++;
    });
    const mapped = Object.values(map).sort((a, b) => b.employee_count - a.employee_count);
    const cols = ["Branch", "Department", "Total Headcount", "Active", "Onboarding"];
    setRows(mapped);
    setColumns(cols);
    const total = mapped.reduce((s, r) => s + r.employee_count, 0);
    setSummary({ "Total Employees": total, Branches: new Set(mapped.map((r) => r.branch)).size, Departments: new Set(mapped.map((r) => r.department)).size });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchExpenses = useCallback(async () => {
    let q = supabase
      .from("expense_records")
      .select("id, description, category, amount, submitted_by, status, created_at")
      .order("created_at", { ascending: false });
    if (config.dateFrom) q = q.gte("created_at", config.dateFrom);
    if (config.dateTo) q = q.lte("created_at", config.dateTo + "T23:59:59");
    const { data } = await q;
    const mapped: ExpenseRow[] = (data || []).map((r: any) => ({
      id: r.id,
      description: r.description,
      category: r.category,
      amount: r.amount,
      submitted_by: r.submitted_by,
      status: r.status,
      date: r.created_at?.substring(0, 10) || "",
    }));
    const cols = ["Description", "Category", "Amount", "Submitted By", "Date", "Status"];
    setRows(mapped);
    setColumns(cols);
    const total = mapped.reduce((s, r) => s + Number(r.amount), 0);
    const paid = mapped.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
    setSummary({ "Total Records": mapped.length, "Total Amount": `$${total.toLocaleString()}`, "Amount Paid": `$${paid.toLocaleString()}`, "Pending Approval": mapped.filter((r) => r.status === "pending").length });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  const fetchHire = useCallback(async () => {
    let q = supabase
      .from("candidates")
      .select("id, full_name, stage, applied_at, job_postings(title)")
      .order("applied_at", { ascending: false });
    if (config.dateFrom) q = q.gte("applied_at", config.dateFrom);
    if (config.dateTo) q = q.lte("applied_at", config.dateTo + "T23:59:59");
    const { data } = await q;
    const mapped: HireRow[] = (data || []).map((r: any) => ({
      id: r.id,
      name: r.full_name || "",
      position: r.job_postings?.title || "—",
      stage: r.stage,
      status: r.stage,
      applied_date: r.applied_at?.substring(0, 10) || "",
    }));
    const cols = ["Candidate", "Position", "Stage", "Status", "Applied Date"];
    setRows(mapped);
    setColumns(cols);
    setSummary({ "Total Candidates": mapped.length, Hired: mapped.filter((r) => r.status === "hired").length, "In Progress": mapped.filter((r) => !["hired", "rejected"].includes(r.status)).length, Rejected: mapped.filter((r) => r.status === "rejected").length });
    onDataReady(mapped, cols);
  }, [config, onDataReady]);

  useEffect(() => {
    setLoading(true);
    const run = async () => {
      if (config.module === "leave") await fetchLeave();
      else if (config.module === "payroll") await fetchPayroll();
      else if (config.module === "headcount") await fetchHeadcount();
      else if (config.module === "expenses") await fetchExpenses();
      else if (config.module === "hire") await fetchHire();
      setLoading(false);
    };
    run();
  }, [config, fetchLeave, fetchPayroll, fetchHeadcount, fetchExpenses, fetchHire]);

  const renderCell = (col: string, row: ReportRow) => {
    const lc = col.toLowerCase().replace(/ /g, "_");
    const val = (row as any)[Object.keys(row).find((k) => k.toLowerCase().replace(/ /g, "_") === lc || col.toLowerCase().includes(k.toLowerCase())) || ""] ?? "—";
    if (col === "Status" || col === "status") {
      return (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_COLOR[String(val).toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
          {String(val)}
        </span>
      );
    }
    if (col.includes("Salary") || col.includes("Pay") || col.includes("Bonus") || col.includes("Deduct") || col === "Amount") {
      return `$${Number(val).toLocaleString()}`;
    }
    return String(val ?? "—");
  };

  const getRowValue = (col: string, row: ReportRow): string => {
    const keyMap: Record<string, string> = {
      "Employee": "employee", "Department": "department", "Type": "leave_type", "Start Date": "start_date",
      "End Date": "end_date", "Days": "days", "Status": "status", "Month": "month",
      "Base Salary": "base_salary", "Bonus": "bonus", "Deductions": "deductions", "Net Pay": "net_pay",
      "Branch": "branch", "Total Headcount": "employee_count", "Active": "active", "Onboarding": "onboarding",
      "Description": "description", "Category": "category", "Amount": "amount", "Submitted By": "submitted_by",
      "Date": "date", "Candidate": "name", "Position": "position", "Stage": "stage", "Applied Date": "applied_date",
    };
    const key = keyMap[col] || col.toLowerCase();
    const v = (row as any)[key];
    if (col.includes("Salary") || col.includes("Pay") || col.includes("Bonus") || col.includes("Deduct") || col === "Amount") {
      return `$${Number(v || 0).toLocaleString()}`;
    }
    return String(v ?? "—");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div id="report-content">
      {/* Summary Cards */}
      {Object.keys(summary).length > 0 && (
        <div className={`grid gap-4 mb-6 grid-cols-2 lg:grid-cols-${Math.min(Object.keys(summary).length, 4)}`}>
          {Object.entries(summary).map(([k, v]) => (
            <div key={k} className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{k}</p>
              <p className="text-2xl font-bold text-gray-900">{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-xl text-gray-400">
          <i className="ri-file-search-line text-3xl mb-2" />
          <p className="text-sm">No data found for selected filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {columns.map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {renderCell(col, row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3 text-right">{rows.length} records</p>
    </div>
  );
}