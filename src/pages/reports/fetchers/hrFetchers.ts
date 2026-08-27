import { supabase } from "@/lib/supabase";
import type { ReportConfig } from "../types";
import { matchesEmployeeFilters, formatDateTime } from "../reportsUtils";
import type { ReportResult } from "./reportTypes";

export const fetchLeaveReport = async (config: ReportConfig): Promise<ReportResult> => {
  let q = supabase
    .from("leave_requests")
    .select("id, leave_type, start_date, end_date, days, status, deleted_at, deleted_by, employees(first_name, last_name, department, branches(name))")
    .order("created_at", { ascending: false });

  if (config.dateFrom) q = q.gte("end_date", config.dateFrom);
  if (config.dateTo) q = q.lte("start_date", config.dateTo);
  const { data } = await q;

  const mapped = (data || [])
    .map((r: any) => {
      const isDeleted = Boolean(r.deleted_at);
      return {
        id: r.id,
        employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
        department: r.employees?.department || "—",
        branch: r.employees?.branches?.name || "—",
        leave_type: r.leave_type,
        start_date: r.start_date,
        end_date: r.end_date,
        days: r.days,
        status: isDeleted ? "deleted" : r.status,
        deleted_at: r.deleted_at || null,
        deleted_by: r.deleted_by || "—",
        deleted_at_formatted: formatDateTime(r.deleted_at),
      };
    })
    .filter((r) => matchesEmployeeFilters(r, config));

  const cols = ["Employee", "Department", "Type", "Start Date", "End Date", "Days", "Status", "Deleted By", "Deleted Date & Time"];

  const totalDays = mapped.filter((r) => r.status !== "deleted").reduce((s, r) => s + r.days, 0);
  const approved = mapped.filter((r) => r.status === "approved").length;
  const pending = mapped.filter((r) => r.status === "pending").length;
  const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

  const summary: Record<string, string | number> = {
    "Total Requests": mapped.length,
    "Total Days": totalDays,
    Approved: approved,
    Pending: pending,
    ...(deletedCount > 0 ? { "Deleted Requests": deletedCount } : {}),
  };

  return { rows: mapped, columns: cols, summary };
};

export const fetchPayrollReport = async (config: ReportConfig): Promise<ReportResult> => {
  let q = supabase
    .from("payroll_records")
    .select("id, month, base_salary, bonus, deductions, net_pay, status, deleted_at, deleted_by, employees(first_name, last_name, department, branches(name))")
    .order("month", { ascending: false });

  if (config.dateFrom) q = q.gte("month", config.dateFrom.substring(0, 7));
  if (config.dateTo) q = q.lte("month", config.dateTo.substring(0, 7));
  const { data } = await q;

  const mapped = (data || [])
    .map((r: any) => {
      const isDeleted = Boolean(r.deleted_at);
      return {
        id: r.id,
        employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
        department: r.employees?.department || "—",
        branch: r.employees?.branches?.name || "—",
        month: r.month,
        base_salary: r.base_salary,
        bonus: r.bonus,
        deductions: r.deductions,
        net_pay: r.net_pay,
        status: isDeleted ? "deleted" : r.status,
        deleted_at: r.deleted_at || null,
        deleted_by: r.deleted_by || "—",
        deleted_at_formatted: formatDateTime(r.deleted_at),
      };
    })
    .filter((r) => matchesEmployeeFilters(r, config));

  const cols = ["Employee", "Department", "Month", "Base Salary", "Bonus", "Deductions", "Net Pay", "Status", "Deleted By", "Deleted Date & Time"];

  const total = mapped.filter((r) => r.status !== "deleted").reduce((s, r) => s + Number(r.net_pay), 0);
  const paid = mapped.filter((r) => r.status === "paid").length;
  const pending = mapped.filter((r) => r.status === "pending").length;
  const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

  const summary: Record<string, string | number> = {
    "Total Records": mapped.length,
    "Total Net Pay": `$${total.toLocaleString()}`,
    Paid: paid,
    Pending: pending,
    ...(deletedCount > 0 ? { "Deleted Records": deletedCount } : {}),
  };

  return { rows: mapped, columns: cols, summary };
};

export const fetchHeadcountReport = async (config: ReportConfig): Promise<ReportResult> => {
  const { data: emps } = await supabase
    .from("employees")
    .select("id, department, status, deleted_at, deleted_by, branches(name)");

  const map: Record<string, any> = {};
  (emps || []).forEach((e: any) => {
    const key = `${e.branches?.name || "Unassigned"}||${e.department || "General"}`;
    if (!map[key]) map[key] = {
      branch: e.branches?.name || "Unassigned",
      department: e.department || "General",
      employee_count: 0,
      active: 0,
      onboarding: 0,
      deleted_count: 0,
    };
    map[key].employee_count++;
    if (e.deleted_at || e.status === "inactive" || e.status === "terminated") {
      map[key].deleted_count++;
    } else if (e.status === "active") {
      map[key].active++;
    } else if (e.status === "onboarding") {
      map[key].onboarding++;
    }
  });

  const mapped = Object.values(map)
    .filter((r) => (!config.departmentFilter || r.department === config.departmentFilter) && (!config.branchFilter || r.branch === config.branchFilter))
    .sort((a, b) => b.employee_count - a.employee_count);

  const cols = ["Branch", "Department", "Total Headcount", "Active", "Onboarding", "Deleted / Inactive"];

  const total = mapped.reduce((s, r) => s + r.employee_count, 0);
  const activeTotal = mapped.reduce((s, r) => s + r.active, 0);
  const deletedTotal = mapped.reduce((s, r) => s + r.deleted_count, 0);

  const summary: Record<string, string | number> = {
    "Total Employees": total,
    "Active Staff": activeTotal,
    "Deleted / Inactive": deletedTotal,
    Branches: new Set(mapped.map((r) => r.branch)).size,
    Departments: new Set(mapped.map((r) => r.department)).size,
  };

  return { rows: mapped, columns: cols, summary };
};
