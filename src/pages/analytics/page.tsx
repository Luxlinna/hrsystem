import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type {
  AnalyticsTabKey,
  BenefitEnrollment,
  BenefitPlan,
  Candidate,
  Employee,
  ExpenseRecord,
  ExportFormat,
  ITAsset,
  ITTicket,
  JobPosting,
  LeaveRequest,
  OffboardingRequest,
  PayrollRecord,
} from "./types";
import { TABS } from "./constants";
import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { MetricCards } from "./components/MetricCards";
import { OverviewTab } from "./tabs/OverviewTab";
import { LeaveTab } from "./tabs/LeaveTab";
import { PayrollTab } from "./tabs/PayrollTab";
import { HiringTab } from "./tabs/HiringTab";
import { OffboardingTab } from "./tabs/OffboardingTab";
import { ITTab } from "./tabs/ITTab";
import { FinanceTab } from "./tabs/FinanceTab";
import { BenefitsTab } from "./tabs/BenefitsTab";

import { useBranchScope } from "@/context/BranchContext";

// Lazy-loaded to avoid bundling ~900KB of XLSX on initial page load
const getXLSX = () => import("xlsx");

export default function Analytics() {
  const { effectiveBranchId } = useBranchScope();
  const [activeTab, setActiveTab] = useState<AnalyticsTabKey>("overview");
  const [department, setDepartment] = useState("all");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [offboarding, setOffboarding] = useState<OffboardingRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [itAssets, setItAssets] = useState<ITAsset[]>([]);
  const [itTickets, setItTickets] = useState<ITTicket[]>([]);
  const [benefitEnrollments, setBenefitEnrollments] = useState<BenefitEnrollment[]>([]);
  const [benefitPlans, setBenefitPlans] = useState<BenefitPlan[]>([]);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const loadData = useCallback(async () => {
    let empQuery = supabase.from("employees").select("id, first_name, last_name, department, role, status, join_date, branch_id");
    if (effectiveBranchId) {
      empQuery = empQuery.eq("branch_id", effectiveBranchId);
    }

    let expQuery = supabase.from("expense_records").select("id, employee_id, category, amount, status, submitted_at, branch_id").is("deleted_at", null);
    if (effectiveBranchId) {
      expQuery = expQuery.eq("branch_id", effectiveBranchId);
    }

    const results = await Promise.all([
      empQuery,
      supabase.from("leave_requests").select("id, employee_id, leave_type, start_date, end_date, days, status, employees(branch_id)"),
      supabase.from("payroll_records").select("employee_id, month, base_salary, bonus, deductions, net_pay, status, employees(branch_id)"),
      supabase.from("job_postings").select("id, title, department, status, location, salary_min, salary_max").is("deleted_at", null),
      supabase.from("candidates").select("id, stage, department, applied_at").is("deleted_at", null),
      supabase.from("offboarding_requests").select("id, employee_id, reason, status, last_day, employees(branch_id)"),
      expQuery,
      supabase.from("it_assets").select("id, type, status, assigned_to, employees(branch_id)").is("deleted_at", null),
      supabase.from("it_tickets").select("id, priority, status, category, created_at").is("deleted_at", null),
      supabase.from("benefit_enrollments").select("id, employee_id, plan_id, status, employees(branch_id)"),
      supabase.from("benefit_plans").select("id, name, type"),
    ]);

    const empList = results[0].data || [];
    const empIds = new Set(empList.map((e: any) => e.id));

    const rawLeaves = results[1].data || [];
    const rawPayroll = results[2].data || [];
    const rawOffboarding = results[5].data || [];
    const rawItAssets = results[7].data || [];
    const rawBenefits = results[9].data || [];

    const filteredLeaves = effectiveBranchId ? rawLeaves.filter((l: any) => empIds.has(l.employee_id) || l.employees?.branch_id === effectiveBranchId) : rawLeaves;
    const filteredPayroll = effectiveBranchId ? rawPayroll.filter((p: any) => empIds.has(p.employee_id) || p.employees?.branch_id === effectiveBranchId) : rawPayroll;
    const filteredOffboarding = effectiveBranchId ? rawOffboarding.filter((o: any) => empIds.has(o.employee_id) || o.employees?.branch_id === effectiveBranchId) : rawOffboarding;
    const filteredItAssets = effectiveBranchId ? rawItAssets.filter((a: any) => !a.assigned_to || empIds.has(a.assigned_to) || a.employees?.branch_id === effectiveBranchId) : rawItAssets;
    const filteredBenefits = effectiveBranchId ? rawBenefits.filter((b: any) => empIds.has(b.employee_id) || b.employees?.branch_id === effectiveBranchId) : rawBenefits;

    setEmployees(empList);
    setLeaveRequests(filteredLeaves);
    setPayroll(filteredPayroll);
    setJobs(results[3].data || []);
    setCandidates(results[4].data || []);
    setOffboarding(filteredOffboarding);
    setExpenses(results[6].data || []);
    setItAssets(filteredItAssets);
    setItTickets(results[8].data || []);
    setBenefitEnrollments(filteredBenefits);
    setBenefitPlans(results[10].data || []);
  }, [effectiveBranchId]);

  useEffect(() => {
    loadData();
    const ch = supabase.channel("analytics-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_records" }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadData]);

  // Derived datasets
  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department))).sort(), [employees]);
  const filteredEmps = useMemo(() => (department === "all" ? employees : employees.filter((e) => e.department === department)), [employees, department]);
  const empMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  // Metric aggregates
  const totalEmployees = employees.length;
  const activeEmployees = useMemo(() => employees.filter((e) => e.status === "active").length, [employees]);
  const avgTenure = useMemo(() => {
    const now = new Date();
    const total = employees.reduce((s, e) => s + (e.join_date ? (now.getTime() - new Date(e.join_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25) : 0), 0);
    return employees.length ? (total / employees.length).toFixed(1) : "0";
  }, [employees]);

  const deptDistribution = useMemo(() => {
    const c: Record<string, number> = {};
    filteredEmps.forEach((e) => { c[e.department] = (c[e.department] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [filteredEmps]);

  const statusBreakdown = useMemo(() => {
    const c: Record<string, number> = {};
    filteredEmps.forEach((e) => { c[e.status] = (c[e.status] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [filteredEmps]);

  const leaveByType = useMemo(() => {
    const c: Record<string, number> = {};
    leaveRequests.forEach((l) => { c[l.leave_type] = (c[l.leave_type] || 0) + l.days; });
    return Object.entries(c).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [leaveRequests]);

  const leaveByDept = useMemo(() => {
    const d: Record<string, number> = {};
    leaveRequests.forEach((l) => {
      const emp = empMap.get(l.employee_id);
      if (emp) d[emp.department] = (d[emp.department] || 0) + (l.days || 0);
    });
    return Object.entries(d).map(([name, days]) => ({ name, days }));
  }, [leaveRequests, empMap]);

  const salaryByDept = useMemo(() => {
    const d: Record<string, { total: number; count: number }> = {};
    payroll.forEach((p) => {
      const emp = empMap.get(p.employee_id);
      if (emp) {
        if (!d[emp.department]) d[emp.department] = { total: 0, count: 0 };
        d[emp.department].total += Number(p.net_pay || 0);
        d[emp.department].count += 1;
      }
    });
    return Object.entries(d).map(([name, data]) => ({
      name, total: Math.round(data.total / 1000), avg: Math.round((data.total / data.count) / 1000), count: data.count,
    }));
  }, [payroll, empMap]);

  const hiringByDept = useMemo(() => {
    const d: Record<string, { open: number; candidates: number }> = {};
    jobs.filter((j) => j.status === "active").forEach((j) => {
      if (!d[j.department]) d[j.department] = { open: 0, candidates: 0 };
      d[j.department].open += 1;
    });
    candidates.forEach((c) => {
      if (!d[c.department]) d[c.department] = { open: 0, candidates: 0 };
      d[c.department].candidates += 1;
    });
    return Object.entries(d).map(([name, data]) => ({ name, open: data.open, candidates: data.candidates }));
  }, [jobs, candidates]);

  const offboardingByReason = useMemo(() => {
    const c: Record<string, number> = {};
    offboarding.forEach((o) => { c[o.reason] = (c[o.reason] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [offboarding]);

  const offboardingByStatus = useMemo(() => {
    const c: Record<string, number> = {};
    offboarding.forEach((o) => { c[o.status] = (c[o.status] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [offboarding]);

  const expenseByCategory = useMemo(() => {
    const c: Record<string, number> = {};
    expenses.forEach((e) => { c[e.category] = (c[e.category] || 0) + Number(e.amount || 0); });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [expenses]);

  const expenseByStatus = useMemo(() => {
    const c: Record<string, number> = {};
    expenses.forEach((e) => { c[e.status] = (c[e.status] || 0) + Number(e.amount || 0); });
    return Object.entries(c).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [expenses]);

  const itAssetsByType = useMemo(() => {
    const c: Record<string, number> = {};
    itAssets.forEach((a) => { c[a.type] = (c[a.type] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [itAssets]);

  const itAssetsByStatus = useMemo(() => {
    const c: Record<string, number> = {};
    itAssets.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [itAssets]);

  const ticketsByPriority = useMemo(() => {
    const c: Record<string, number> = {};
    itTickets.forEach((t) => { c[t.priority] = (c[t.priority] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [itTickets]);

  const ticketsByStatus = useMemo(() => {
    const c: Record<string, number> = {};
    itTickets.forEach((t) => { c[t.status] = (c[t.status] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [itTickets]);

  const benefitEnrollmentByPlan = useMemo(() => {
    return benefitPlans.map((plan) => ({
      name: plan.name,
      enrolled: benefitEnrollments.filter((e) => e.plan_id === plan.id && e.status === "active").length,
      total: employees.length,
    }));
  }, [benefitPlans, benefitEnrollments, employees.length]);

  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);
  const paidExpense = useMemo(() => expenses.filter((e) => e.status === "paid").reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);
  const openTickets = useMemo(() => itTickets.filter((t) => t.status === "open").length, [itTickets]);
  const assignedAssets = useMemo(() => itAssets.filter((a) => a.assigned_to).length, [itAssets]);

  const getExportData = useCallback((): { data: Record<string, string | number>[]; filename: string; title: string } => {
    if (activeTab === "overview") {
      return { data: deptDistribution.map((d) => ({ Department: d.name, "Employee Count": d.value })), filename: "workforce-overview", title: "Workforce Overview" };
    } else if (activeTab === "finance") {
      return { data: expenseByCategory.map((d) => ({ Category: d.name, "Total Amount": d.value })), filename: "finance-by-category", title: "Finance by Category" };
    } else if (activeTab === "it") {
      return { data: itAssetsByType.map((d) => ({ "Asset Type": d.name, Count: d.value })), filename: "it-assets", title: "IT Assets" };
    }
    return { data: [], filename: "analytics-export", title: "Analytics Export" };
  }, [activeTab, deptDistribution, expenseByCategory, itAssetsByType]);

  const exportCSV = useCallback(() => {
    setExporting("csv");
    const { data, filename } = getExportData();
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = [headers.join(","), ...data.map((r) => headers.map((h) => `"${r[h]}"`).join(","))];
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setTimeout(() => setExporting(null), 800);
  }, [getExportData]);

  const exportExcel = useCallback(async () => {
    setExporting("xlsx");
    const { data, filename, title } = getExportData();
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const aoa = [headers, ...data.map((r) => headers.map((h) => r[h]))];
      const XLSX = await getXLSX();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = headers.map((col) => ({ wch: Math.max(col.length + 2, 10) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }
    setTimeout(() => setExporting(null), 800);
  }, [getExportData]);

  const exportPDF = useCallback(() => {
    setExporting("pdf");
    const { data, title } = getExportData();
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const tableRows = data.map((row) =>
        `<tr>${headers.map((h) => `<td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px">${row[h]}</td>`).join("")}</tr>`
      ).join("");
      const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
        body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111}
        h1{font-size:20px;margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:20px}
        table{width:100%;border-collapse:collapse}
        th{text-align:left;padding:8px 10px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#666}
        td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
        .footer{margin-top:20px;font-size:10px;color:#999;text-align:right}
        @media print{body{padding:0}}
      </style></head><body>
        <h1>HRM_OPS — ${title}</h1>
        <p>Generated: ${new Date().toLocaleString("en-US")} · ${data.length} records</p>
        <table><thead><tr>${headers.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${tableRows}</tbody></table>
        <div class="footer">HRM_OPS HRMS · Confidential</div>
      </body></html>`;
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.onload = () => { win.print(); };
      }
    }
    setTimeout(() => setExporting(null), 800);
  }, [getExportData]);

  const handleExport = useCallback((fmt: ExportFormat) => {
    if (fmt === "pdf") exportPDF();
    else if (fmt === "csv") exportCSV();
    else exportExcel();
  }, [exportPDF, exportCSV, exportExcel]);

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      {/* Header with department filter and export dropdown */}
      <AnalyticsHeader
        department={department}
        setDepartment={setDepartment}
        departments={departments}
        exporting={exporting}
        exportOpen={exportOpen}
        setExportOpen={setExportOpen}
        onExport={handleExport}
      />

      {/* Top 8 metric tiles */}
      <MetricCards
        totalEmployees={totalEmployees}
        activeEmployees={activeEmployees}
        avgTenure={avgTenure}
        openJobsCount={jobs.filter((j) => j.status === "active").length}
        candidatesCount={candidates.length}
        pendingLeaveCount={leaveRequests.filter((l) => l.status === "pending").length}
        activeOffboardingCount={offboarding.filter((o) => o.status !== "completed").length}
        openTickets={openTickets}
        assignedAssets={assignedAssets}
        totalAssets={itAssets.length}
        totalExpense={totalExpense}
      />

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === t.key ? "bg-white text-[#253C7D]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <OverviewTab
          deptDistribution={deptDistribution}
          statusBreakdown={statusBreakdown}
          department={department}
          departments={departments}
          employees={employees}
          filteredEmps={filteredEmps}
          jobs={jobs}
          payroll={payroll}
        />
      )}

      {activeTab === "leave" && (
        <LeaveTab
          leaveByDept={leaveByDept}
          leaveByType={leaveByType}
          leaveRequests={leaveRequests}
          empMap={empMap}
          department={department}
        />
      )}

      {activeTab === "payroll" && (
        <PayrollTab
          salaryByDept={salaryByDept}
          payroll={payroll}
          empMap={empMap}
          department={department}
        />
      )}

      {activeTab === "hiring" && (
        <HiringTab
          hiringByDept={hiringByDept}
          candidates={candidates}
        />
      )}

      {activeTab === "offboarding" && (
        <OffboardingTab
          offboarding={offboarding}
          offboardingByReason={offboardingByReason}
          offboardingByStatus={offboardingByStatus}
        />
      )}

      {activeTab === "it" && (
        <ITTab
          itAssets={itAssets}
          assignedAssets={assignedAssets}
          openTickets={openTickets}
          itAssetsByType={itAssetsByType}
          itAssetsByStatus={itAssetsByStatus}
          ticketsByPriority={ticketsByPriority}
          ticketsByStatus={ticketsByStatus}
        />
      )}

      {activeTab === "finance" && (
        <FinanceTab
          expenses={expenses}
          totalExpense={totalExpense}
          paidExpense={paidExpense}
          expenseByCategory={expenseByCategory}
          expenseByStatus={expenseByStatus}
        />
      )}

      {activeTab === "benefits" && (
        <BenefitsTab
          benefitPlans={benefitPlans}
          benefitEnrollments={benefitEnrollments}
          employees={employees}
          benefitEnrollmentByPlan={benefitEnrollmentByPlan}
        />
      )}
    </div>
  );
}