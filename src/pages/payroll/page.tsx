import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "@/components/Toast";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import { Link } from "react-router-dom";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url?: string | null;
  branch_id?: string | null;
  branches?: { id: string; name: string } | null;
}

interface PayrollRecord {
  id: string;
  employee_id: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: "paid" | "processed" | "pending";
  created_at?: string;
  notes?: string | null;
  employees?: Employee | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  paid: {
    label: "Paid",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/30",
    icon: "ri-checkbox-circle-fill",
  },
  processed: {
    label: "Processed",
    bg: "bg-sky-50 dark:bg-sky-500/15",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-500/30",
    icon: "ri-check-line",
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/30",
    icon: "ri-time-line",
  },
};

// Chart series colors — a slightly brighter navy is used in dark mode so the
// brand color (and the donut legend text, which Recharts colors per-series)
// stays legible against a near-black background.
const getDeptColors = (isDark: boolean) =>
  isDark
    ? ["#5B7FD1", "#38BDF8", "#34D399", "#FBBF24", "#A78BFA", "#F472B6", "#94A3B8"]
    : ["#253C7D", "#0284C7", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#64748B"];

const initials = (first?: string, last?: string) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

export default function Payroll() {
  const { user } = useAuth();
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const { isDark } = useTheme();
  const canViewAll = isAdmin || !!role?.payroll_view_all_employees;

  const [allRecords, setAllRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Month & Period Selection
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [periodMode, setPeriodMode] = useState<"month" | "all">("month");

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Modals
  const [payslipModal, setPayslipModal] = useState<PayrollRecord | null>(null);
  const [recordModal, setRecordModal] = useState<{ open: boolean; record: PayrollRecord | null }>({
    open: false,
    record: null,
  });
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordForm, setRecordForm] = useState({
    employee_id: "",
    month: currentMonthStr,
    base_salary: 0,
    bonus: 0,
    deductions: 0,
    status: "processed" as "paid" | "processed" | "pending",
    notes: "",
  });

  useEffect(() => {
    if (permsLoading) return;
    loadData();
  }, [canViewAll, permsLoading, user?.email]);

  const loadData = async () => {
    setLoading(true);

    if (canViewAll) {
      const [{ data: recordsData }, { data: empsData }] = await Promise.all([
        supabase
          .from("payroll_records")
          .select("*, employees(id, first_name, last_name, role, department, avatar_url, branch_id, branches(id, name))")
          .order("month", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branch_id, branches(id, name)")
          .eq("status", "active")
          .order("first_name"),
      ]);

      setAllRecords((recordsData as PayrollRecord[]) || []);
      // supabase-js's untyped client can't tell employees→branches is a
      // to-one relationship from the select string alone, so it infers
      // `branches` as an array — PostgREST actually returns a single object
      // here (confirmed by the `emp.branches?.name` access below), so this
      // is a real mismatch between the client's generic inference and
      // runtime shape, not an actual data-shape bug.
      setEmployees((empsData as unknown as Employee[]) || []);

      // If no records in current month, set selectedMonth to the latest month with data
      if (recordsData && recordsData.length > 0) {
        const hasCurrentMonth = recordsData.some((r) => r.month === currentMonthStr);
        if (!hasCurrentMonth) {
          setSelectedMonth(recordsData[0].month);
        }
      }
      setLoading(false);
      return;
    }

    // Individual employee self-service view
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, avatar_url")
      .eq("email", user.email)
      .maybeSingle();

    if (!me) {
      setAllRecords([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    setEmployees([me as Employee]);
    const { data: myRecords } = await supabase
      .from("payroll_records")
      .select("*, employees(id, first_name, last_name, role, department, avatar_url)")
      .eq("employee_id", me.id)
      .order("month", { ascending: false });

    setAllRecords((myRecords as PayrollRecord[]) || []);
    if (myRecords && myRecords.length > 0) {
      const hasCurrent = myRecords.some((r) => r.month === currentMonthStr);
      if (!hasCurrent) {
        setSelectedMonth(myRecords[0].month);
      }
    }
    setLoading(false);
  };

  // Distinct Historical Months available in records
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.month) set.add(r.month);
    });
    set.add(currentMonthStr);
    return Array.from(set).sort().reverse();
  }, [allRecords, currentMonthStr]);

  // Departments for filters
  const departments = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.employees?.department) set.add(r.employees.department);
    });
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [allRecords, employees]);

  // Filtered Payroll Records for the active period & filters
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      if (periodMode === "month" && r.month !== selectedMonth) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterDepartment !== "all" && r.employees?.department !== filterDepartment) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const role = (r.employees?.role || "").toLowerCase();
        const dept = (r.employees?.department || "").toLowerCase();
        const month = r.month.toLowerCase();
        if (!empName.includes(q) && !role.includes(q) && !dept.includes(q) && !month.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allRecords, periodMode, selectedMonth, filterStatus, filterDepartment, searchQuery]);

  // Aggregate Metrics for currently viewed records
  const totalBase = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + Number(r.base_salary || 0), 0),
    [filteredRecords]
  );
  const totalBonus = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + Number(r.bonus || 0), 0),
    [filteredRecords]
  );
  const totalDeductions = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + Number(r.deductions || 0), 0),
    [filteredRecords]
  );
  const totalNet = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + Number(r.net_pay || 0), 0),
    [filteredRecords]
  );
  const employeeCount = filteredRecords.length;
  const avgNetPay = employeeCount > 0 ? Math.round(totalNet / employeeCount) : 0;
  const pendingCount = useMemo(
    () => filteredRecords.filter((r) => r.status === "pending").length,
    [filteredRecords]
  );

  // Chart Data for Compensation Breakdown
  const chartData = useMemo(() => {
    return filteredRecords.slice(0, 15).map((p) => ({
      name: p.employees ? `${p.employees.first_name} ${p.employees.last_name[0]}.` : "—",
      base: +(p.base_salary / 1000).toFixed(1),
      bonus: +(p.bonus / 1000).toFixed(1),
      deductions: +(p.deductions / 1000).toFixed(1),
      net: +(p.net_pay / 1000).toFixed(1),
    }));
  }, [filteredRecords]);

  // Department Breakdown Pie Chart
  const deptDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const d = r.employees?.department || "General";
      counts[d] = (counts[d] || 0) + Number(r.net_pay || 0);
    });
    const colors = getDeptColors(isDark);
    return Object.entries(counts).map(([department, value], idx) => ({
      name: department,
      value,
      fill: colors[idx % colors.length],
    }));
  }, [filteredRecords, isDark]);

  // Month navigation helper
  const navigateMonth = (offset: number) => {
    const [yStr, mStr] = selectedMonth.split("-");
    const d = new Date(parseInt(yStr), parseInt(mStr) - 1 + offset, 1);
    const newM = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(newM);
    setPeriodMode("month");
  };

  // Update Status Action
  const handleUpdateStatus = async (recordId: string, newStatus: "paid" | "processed" | "pending") => {
    const { error } = await supabase
      .from("payroll_records")
      .update({ status: newStatus })
      .eq("id", recordId);

    if (error) {
      toast("Error", "Failed to update status", "error");
      return;
    }

    toast("Status Updated", `Payroll marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`, "success");
    setAllRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, status: newStatus } : r))
    );
  };

  // Open Create / Edit Modal
  const openRecordModal = (rec?: PayrollRecord | null) => {
    if (rec) {
      setRecordModal({ open: true, record: rec });
      setRecordForm({
        employee_id: rec.employee_id,
        month: rec.month,
        base_salary: Number(rec.base_salary || 0),
        bonus: Number(rec.bonus || 0),
        deductions: Number(rec.deductions || 0),
        status: rec.status,
        notes: rec.notes || "",
      });
    } else {
      setRecordModal({ open: true, record: null });
      setRecordForm({
        employee_id: employees[0]?.id || "",
        month: selectedMonth,
        base_salary: 3500,
        bonus: 0,
        deductions: 250,
        status: "processed",
        notes: "",
      });
    }
  };

  // Save Record (Create or Edit)
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForm.employee_id || !recordForm.month || savingRecord) return;
    setSavingRecord(true);

    const calculatedNet =
      Number(recordForm.base_salary || 0) +
      Number(recordForm.bonus || 0) -
      Number(recordForm.deductions || 0);

    if (recordModal.record) {
      // Edit existing
      const { error } = await supabase
        .from("payroll_records")
        .update({
          month: recordForm.month,
          base_salary: recordForm.base_salary,
          bonus: recordForm.bonus,
          deductions: recordForm.deductions,
          net_pay: calculatedNet,
          status: recordForm.status,
          notes: recordForm.notes ? recordForm.notes.trim() : null,
        })
        .eq("id", recordModal.record.id);

      setSavingRecord(false);
      if (error) {
        toast("Error", "Failed to update record", "error");
        return;
      }
      toast("Record Updated", "Payroll entry saved successfully.", "success");
    } else {
      // Create new
      const { error } = await supabase.from("payroll_records").insert({
        employee_id: recordForm.employee_id,
        month: recordForm.month,
        base_salary: recordForm.base_salary,
        bonus: recordForm.bonus,
        deductions: recordForm.deductions,
        net_pay: calculatedNet,
        status: recordForm.status,
        notes: recordForm.notes ? recordForm.notes.trim() : null,
      });

      setSavingRecord(false);
      if (error) {
        toast("Error", "Failed to create payroll record", "error");
        return;
      }
      toast("Record Created", "Payroll entry added successfully.", "success");
    }

    setRecordModal({ open: false, record: null });
    loadData();
  };

  // Delete Record
  const handleDeleteRecord = async (id: string, empName: string) => {
    if (!confirm(`Delete payroll entry for "${empName}"?`)) return;
    const { error } = await supabase.from("payroll_records").delete().eq("id", id);
    if (error) {
      toast("Error", "Failed to delete record", "error");
      return;
    }
    toast("Record Deleted", "Payroll entry removed.", "success");
    setAllRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Print/Download Payslip
  const printPayslip = (p: PayrollRecord) => {
    const empName = p.employees ? `${p.employees.first_name} ${p.employees.last_name}` : "Employee";
    const gross = Number(p.base_salary) + Number(p.bonus);
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Payslip - ${empName} - ${p.month}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 40px; max-width: 650px; margin: 0 auto; color: #1e293b; }
    .header { border-bottom: 2px solid #253C7D; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 22px; font-weight: 800; color: #253C7D; margin: 0; }
    .subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
    .badge { background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 12px; font-size: 13px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .row.total { font-weight: 800; font-size: 16px; border-top: 2px solid #253C7D; border-bottom: none; margin-top: 12px; color: #253C7D; }
    .footer { font-size: 11px; color: #94a3b8; margin-top: 36px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">OFFICIAL PAYSLIP</h1>
      <p class="subtitle">HRM_OPS Enterprise HR & Payroll System</p>
    </div>
    <span class="badge">${p.status}</span>
  </div>

  <div class="grid">
    <div><strong>Employee:</strong> ${empName}</div>
    <div><strong>Pay Period:</strong> ${p.month}</div>
    <div><strong>Role:</strong> ${p.employees?.role || "Team Member"}</div>
    <div><strong>Department:</strong> ${p.employees?.department || "General"}</div>
  </div>

  <div class="row"><span>Base Salary</span><span>$${Number(p.base_salary).toLocaleString()}</span></div>
  <div class="row"><span>Bonuses & Allowances</span><span style="color: #10b981;">+$${Number(p.bonus).toLocaleString()}</span></div>
  <div class="row"><span>Gross Earnings</span><span>$${gross.toLocaleString()}</span></div>
  <div class="row"><span>Taxes & Deductions</span><span style="color: #e11d48;">-$${Number(p.deductions).toLocaleString()}</span></div>
  <div class="row total"><span>Net Take-Home Pay</span><span>$${Number(p.net_pay).toLocaleString()}</span></div>

  <div class="footer">
    Generated on ${new Date().toLocaleString()} · Confidential Financial Document · HRM_OPS
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.onload = () => {
        win.print();
      };
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast("Export", "No records found to export", "warning");
      return;
    }

    const headers = ["Employee", "Department", "Role", "Month", "Base Salary", "Bonus", "Deductions", "Net Pay", "Status", "Notes"];
    const rows = filteredRecords.map((r) => [
      `"${r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown"}"`,
      `"${r.employees?.department || ""}"`,
      `"${r.employees?.role || ""}"`,
      r.month,
      r.base_salary,
      r.bonus,
      r.deductions,
      r.net_pay,
      r.status,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_export_${periodMode === "month" ? selectedMonth : "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Export Complete", `Exported ${filteredRecords.length} records to CSV`, "success");
  };

  const selectedMonthLabel = new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (loading && allRecords.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-950">
        <div className="w-9 h-9 border-3 border-[#253C7D] dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">Loading payroll management dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            <span>Financial Operations</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] dark:text-sky-400 font-bold">Compensation & Payroll</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Payroll Overview
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-300">
              {periodMode === "month" ? selectedMonthLabel : "All Historical Periods"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            {canViewAll
              ? `Manage employee compensations, bonuses, deductions, and generate payslips across all branches.`
              : `View your payslips, salary breakdowns, and compensation history.`}
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-excel-2-line text-emerald-600 dark:text-emerald-400 text-sm" />
            Export CSV
          </button>

          {canViewAll && (
            <button
              onClick={() => openRecordModal(null)}
              className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <i className="ri-add-circle-line text-base font-bold" />
              Add Payroll Record
            </button>
          )}
        </div>
      </div>

      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Net Payout */}
        <div
          onClick={() => setFilterStatus("all")}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterStatus === "all" ? "border-[#253C7D] dark:border-sky-400 ring-2 ring-[#253C7D]/10 dark:ring-sky-400/15" : "border-gray-200/80 dark:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] dark:text-sky-400 uppercase tracking-wider">Total Net Pay</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-400 flex items-center justify-center">
              <i className="ri-bank-card-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] dark:text-sky-300 mt-2">${(totalNet / 1000).toFixed(1)}k</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
            ${totalNet.toLocaleString()} net across {employeeCount} records
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D] dark:bg-sky-400" />
        </div>

        {/* Total Base Salary */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Base Salary</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">${(totalBase / 1000).toFixed(1)}k</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
            Avg ${(avgNetPay / 1000).toFixed(1)}k / employee
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500" />
        </div>

        {/* Total Bonuses */}
        <div
          onClick={() => setFilterStatus("paid")}
          className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterStatus === "paid" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-gray-200/80 dark:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Bonuses & Additions</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <i className="ri-gift-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-2">+${(totalBonus / 1000).toFixed(1)}k</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Performance & allowances</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Total Deductions */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Deductions</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <i className="ri-calculator-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-2">-${(totalDeductions / 1000).toFixed(1)}k</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Taxes, benefits & withholdings</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* Pending Approval — jumps straight to the records that still need action */}
        <div
          onClick={() => setFilterStatus("pending")}
          className={`col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterStatus === "pending" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80 dark:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Approval</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <i className="ri-time-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-2">{pendingCount}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
            {pendingCount > 0 ? "Awaiting review before payout" : "All records processed"}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>
      </div>

      {/* Period & Filter Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-700 p-3.5 shadow-2xs mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        {/* Month Jumper Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200/60 dark:border-slate-700">
            <button
              onClick={() => navigateMonth(-1)}
              className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Previous Month"
            >
              <i className="ri-arrow-left-s-line text-base font-bold" />
            </button>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPeriodMode("month");
              }}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold text-gray-800 dark:text-slate-100 dark:[color-scheme:dark] cursor-pointer shadow-2xs focus:outline-none focus:border-[#253C7D]"
            />

            <button
              onClick={() => navigateMonth(1)}
              className="w-7 h-7 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Next Month"
            >
              <i className="ri-arrow-right-s-line text-base font-bold" />
            </button>
          </div>

          {/* Quick Period Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setSelectedMonth(currentMonthStr);
                setPeriodMode("month");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodMode === "month" && selectedMonth === currentMonthStr
                  ? "bg-[#253C7D] text-white shadow-xs"
                  : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/60 dark:border-slate-700"
              }`}
            >
              Current Month
            </button>

            <button
              onClick={() => setPeriodMode(periodMode === "all" ? "month" : "all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodMode === "all"
                  ? "bg-[#253C7D] text-white shadow-xs"
                  : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200/60 dark:border-slate-700"
              }`}
            >
              📅 All Historical Periods
            </button>
          </div>
        </div>

        {/* Filters: Search, Department & Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative w-full sm:w-52">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, role..."
              className="w-full pl-8 pr-7 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-800 dark:text-slate-100 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <i className="ri-close-circle-fill text-xs" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          {departments.length > 0 && canViewAll && (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate font-medium"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="processed">Processed</option>
            <option value="pending">Pending</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg border border-gray-200/60 dark:border-slate-700">
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs" : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
              }`}
            >
              <i className="ri-table-line" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              title="Cards View"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "cards" ? "bg-white dark:bg-slate-700 text-[#253C7D] dark:text-sky-300 shadow-xs" : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
              }`}
            >
              <i className="ri-layout-grid-fill" />
            </button>
          </div>

          {/* Reset Filters */}
          {(searchQuery || filterDepartment !== "all" || filterStatus !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterDepartment("all");
                setFilterStatus("all");
              }}
              title="Reset Filters"
              className="px-2 py-1.5 text-xs text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Bar Chart: Salary Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i className="ri-bar-chart-2-line text-[#253C7D] dark:text-sky-400" />
                Payroll Compensation Breakdown ($k)
              </h3>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Base salary, bonus additions & deductions</p>
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-slate-700">
              {filteredRecords.length} records
            </span>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1e293b" : "#fff",
                      borderRadius: "12px",
                      border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                      color: isDark ? "#e2e8f0" : undefined,
                    }}
                  />
                  <Bar dataKey="base" fill={isDark ? "#5B7FD1" : "#253C7D"} radius={[4, 4, 0, 0]} name="Base ($k)" />
                  <Bar dataKey="bonus" fill="#10B981" radius={[4, 4, 0, 0]} name="Bonus ($k)" />
                  <Bar dataKey="deductions" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Deductions ($k)" />
                  <Bar dataKey="net" fill="#0284C7" radius={[4, 4, 0, 0]} name="Net ($k)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 text-xs">
              <i className="ri-bar-chart-line text-3xl mb-2 text-gray-300 dark:text-slate-700" />
              No payroll data available for chart
            </div>
          )}
        </div>

        {/* Donut Chart: Department Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
            <i className="ri-pie-chart-line text-[#253C7D] dark:text-sky-400" />
            Department Expenditure
          </h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">Net pay distribution by department</p>

          {deptDistributionData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deptDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Net Pay"]}
                    contentStyle={{
                      backgroundColor: isDark ? "#1e293b" : "#fff",
                      borderRadius: "12px",
                      border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                      fontSize: "12px",
                      color: isDark ? "#e2e8f0" : undefined,
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-slate-600 text-xs">
              <i className="ri-pie-chart-line text-3xl mb-2 text-gray-300 dark:text-slate-700" />
              No department records
            </div>
          )}
        </div>
      </div>

      {/* Payroll Records Data Display */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-file-list-3-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No Payroll Records Found</h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            No entries found for {periodMode === "month" ? selectedMonthLabel : "the selected filters"}. You can add a new record or select an older historical period above.
          </p>
          {canViewAll && (
            <button
              onClick={() => openRecordModal(null)}
              className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
            >
              + Create Entry for {selectedMonth}
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-800/60 text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department & Branch</th>
                  <th className="px-5 py-3.5">Pay Period</th>
                  <th className="px-5 py-3.5">Base Salary</th>
                  <th className="px-5 py-3.5">Bonus</th>
                  <th className="px-5 py-3.5">Deductions</th>
                  <th className="px-5 py-3.5">Net Pay</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredRecords.map((p) => {
                  const emp = p.employees;
                  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.processed;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                            {emp?.avatar_url ? (
                              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials(emp?.first_name, emp?.last_name)}</span>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/employees/${p.employee_id}`}
                              className="font-bold text-gray-900 dark:text-white group-hover:text-[#253C7D] dark:group-hover:text-sky-400 transition-colors block"
                            >
                              {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                            </Link>
                            <p className="text-[11px] text-gray-400 dark:text-slate-500">{emp?.role || "Team Member"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-[11px]">
                          {emp?.department || "General"}
                        </span>
                        {emp?.branches?.name && (
                          <span className="text-gray-400 dark:text-slate-500 block text-[10px] mt-0.5">{emp.branches.name}</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                        {p.month}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-800 dark:text-slate-200">
                        ${Number(p.base_salary).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                        +${Number(p.bonus).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">
                        -${Number(p.deductions).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-black text-sm text-[#253C7D] dark:text-sky-400">
                          ${Number(p.net_pay).toLocaleString()}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <i className={cfg.icon} />
                          {cfg.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View / Print Payslip */}
                          <button
                            onClick={() => setPayslipModal(p)}
                            className="px-2.5 py-1 text-xs font-bold text-[#253C7D] dark:text-sky-400 bg-blue-50/80 dark:bg-sky-400/10 hover:bg-blue-100 dark:hover:bg-sky-400/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="View Payslip"
                          >
                            <i className="ri-file-text-line" />
                            Payslip
                          </button>

                          {/* Print Shortcut */}
                          <button
                            onClick={() => printPayslip(p)}
                            className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Print Payslip"
                          >
                            <i className="ri-printer-line text-sm" />
                          </button>

                          {canViewAll && (
                            <>
                              <button
                                onClick={() => openRecordModal(p)}
                                className="p-1.5 text-gray-500 dark:text-slate-400 hover:text-[#253C7D] dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Edit Record"
                              >
                                <i className="ri-edit-line text-sm" />
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteRecord(
                                    p.id,
                                    emp ? `${emp.first_name} ${emp.last_name}` : "employee"
                                  )
                                }
                                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <i className="ri-delete-bin-line text-sm" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRecords.map((p) => {
            const emp = p.employees;
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.processed;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                        {emp?.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials(emp?.first_name, emp?.last_name)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/employees/${p.employee_id}`}
                          className="font-extrabold text-gray-900 dark:text-white group-hover:text-[#253C7D] dark:group-hover:text-sky-400 transition-colors truncate text-sm block"
                        >
                          {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                        </Link>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{emp?.role || "Team Member"}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-2xl space-y-2 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-slate-400 text-[11px]">Period:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{p.month}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-slate-400 text-[11px]">Base Salary:</span>
                      <span className="font-bold text-gray-800 dark:text-slate-200">${Number(p.base_salary).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-slate-400 text-[11px]">Bonus (+):</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+${Number(p.bonus).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-slate-400 text-[11px]">Deductions (-):</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">-${Number(p.deductions).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
                      <span className="font-bold text-gray-900 dark:text-white text-xs">Net Payout:</span>
                      <span className="font-black text-sm text-[#253C7D] dark:text-sky-400">${Number(p.net_pay).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800 gap-2">
                  <button
                    onClick={() => setPayslipModal(p)}
                    className="flex-1 py-1.5 bg-blue-50 dark:bg-sky-400/10 hover:bg-blue-100 dark:hover:bg-sky-400/20 text-[#253C7D] dark:text-sky-400 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                  >
                    View Payslip
                  </button>

                  <button
                    onClick={() => printPayslip(p)}
                    className="p-1.5 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="Print"
                  >
                    <i className="ri-printer-line text-sm" />
                  </button>

                  {canViewAll && (
                    <button
                      onClick={() => openRecordModal(p)}
                      className="p-1.5 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <i className="ri-edit-line text-sm" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAYSLIP PREVIEW & PRINT                                            */}
      {/* ========================================================================= */}
      {payslipModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => setPayslipModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                  <i className="ri-file-text-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Payslip Breakdown</h3>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Period: {payslipModal.month}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPayslipModal(null)}
                className="w-8 h-8 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Employee Summary Card */}
              <div className="flex items-center gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-700">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
                  {payslipModal.employees?.avatar_url ? (
                    <img src={payslipModal.employees.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials(payslipModal.employees?.first_name, payslipModal.employees?.last_name)}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 dark:text-white text-sm">
                    {payslipModal.employees?.first_name} {payslipModal.employees?.last_name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{payslipModal.employees?.role || "Team Member"}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">{payslipModal.employees?.department || "General"}</p>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="space-y-2 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-900">
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-500 dark:text-slate-400 font-medium">Base Salary</span>
                  <span className="font-bold text-gray-900 dark:text-white">${Number(payslipModal.base_salary).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-500 dark:text-slate-400 font-medium">Bonuses & Allowances</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+${Number(payslipModal.bonus).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-gray-500 dark:text-slate-400 font-medium">Gross Total</span>
                  <span className="font-bold text-gray-800 dark:text-slate-200">
                    ${(Number(payslipModal.base_salary) + Number(payslipModal.bonus)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1 text-rose-600 dark:text-rose-400">
                  <span>Deductions & Tax</span>
                  <span className="font-bold">-${Number(payslipModal.deductions).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm py-2.5 border-t border-gray-100 dark:border-slate-700 font-black text-[#253C7D] dark:text-sky-400">
                  <span>Net Salary Payout</span>
                  <span>${Number(payslipModal.net_pay).toLocaleString()}</span>
                </div>
              </div>

              {payslipModal.notes && (
                <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl text-xs text-gray-600 dark:text-slate-300 border border-gray-100 dark:border-slate-700">
                  <span className="font-bold text-gray-700 dark:text-slate-200">Remarks: </span>
                  {payslipModal.notes}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPayslipModal(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => printPayslip(payslipModal)}
                className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-printer-line text-sm" />
                Print / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD OR EDIT PAYROLL ENTRY (Supports ANY historical month!)         */}
      {/* ========================================================================= */}
      {recordModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !savingRecord && setRecordModal({ open: false, record: null })}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-400 flex items-center justify-center font-bold text-sm">
                  <i className="ri-calculator-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {recordModal.record ? "Edit Payroll Record" : "Add Payroll Record"}
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    {recordModal.record ? `Modifying period ${recordModal.record.month}` : "Create compensation entry for any month"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRecordModal({ open: false, record: null })}
                className="w-8 h-8 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Employee <span className="text-rose-500">*</span>
                </label>
                {recordModal.record ? (
                  <div className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white">
                    {recordModal.record.employees?.first_name} {recordModal.record.employees?.last_name}
                  </div>
                ) : (
                  <EmployeeSearchSelect
                    employees={employees}
                    value={recordForm.employee_id}
                    onChange={(id) => setRecordForm({ ...recordForm, employee_id: id })}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Pay Period (Month) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="month"
                    required
                    value={recordForm.month}
                    onChange={(e) => setRecordForm({ ...recordForm, month: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white dark:[color-scheme:dark] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Status
                  </label>
                  <select
                    value={recordForm.status}
                    onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="processed">Processed</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Base Salary ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={recordForm.base_salary}
                    onChange={(e) =>
                      setRecordForm({ ...recordForm, base_salary: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Bonus ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={recordForm.bonus}
                    onChange={(e) =>
                      setRecordForm({ ...recordForm, bonus: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Deductions ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={recordForm.deductions}
                    onChange={(e) =>
                      setRecordForm({ ...recordForm, deductions: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              {/* Real-time Net Pay preview */}
              <div className="p-3.5 bg-[#253C7D]/5 dark:bg-sky-400/10 border border-[#253C7D]/15 dark:border-sky-400/20 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Calculated Net Pay:</span>
                <span className="text-base font-black text-[#253C7D] dark:text-sky-400">
                  $
                  {(
                    Number(recordForm.base_salary || 0) +
                    Number(recordForm.bonus || 0) -
                    Number(recordForm.deductions || 0)
                  ).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  placeholder="Optional bonus or deduction details..."
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecordModal({ open: false, record: null })}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRecord || !recordForm.employee_id || !recordForm.month}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingRecord ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}