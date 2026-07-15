import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { supabase } from "@/lib/supabase";

const COLORS = ["#0D7377", "#14919B", "#54BAB9", "#A8D8D8", "#1A4B4C", "#2B7A7A", "#3d9970", "#27ae60"];

interface Employee { id: string; first_name: string; last_name: string; department: string; role: string; status: string; join_date: string; }
interface LeaveRequest { id: string; employee_id: string; leave_type: string; start_date: string; end_date: string; days: number; status: string; }
interface PayrollRecord { employee_id: string; month: string; base_salary: number; bonus: number; deductions: number; net_pay: number; status: string; }
interface JobPosting { id: string; title: string; department: string; status: string; location?: string; salary_min?: number; salary_max?: number; }
interface Candidate { id: string; stage: string; department: string; applied_at: string; }
interface OffboardingRequest { id: string; employee_id: string; reason: string; status: string; last_day: string; }
interface ExpenseRecord { id: string; employee_id: string; category: string; amount: number; status: string; submitted_at: string; branch_id: string; }
interface ITAsset { id: string; type: string; status: string; assigned_to: string | null; }
interface ITTicket { id: string; priority: string; status: string; category: string; created_at: string; }
interface BenefitEnrollment { id: string; employee_id: string; plan_id: number; status: string; }
interface BenefitPlan { id: number; name: string; type: string; }

const TABS = [
  { key: "overview", label: "Workforce" },
  { key: "leave", label: "Leave" },
  { key: "payroll", label: "Payroll" },
  { key: "hiring", label: "Hiring" },
  { key: "offboarding", label: "Offboarding" },
  { key: "it", label: "IT & Assets" },
  { key: "finance", label: "Finance" },
  { key: "benefits", label: "Benefits" },
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("overview");
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
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    const results = await Promise.all([
      supabase.from("employees").select("*"),
      supabase.from("leave_requests").select("*"),
      supabase.from("payroll_records").select("*"),
      supabase.from("job_postings").select("*"),
      supabase.from("candidates").select("*"),
      supabase.from("offboarding_requests").select("*"),
      supabase.from("expense_records").select("*"),
      supabase.from("it_assets").select("*"),
      supabase.from("it_tickets").select("*"),
      supabase.from("benefit_enrollments").select("*"),
      supabase.from("benefit_plans").select("*"),
    ]);
    setEmployees(results[0].data || []);
    setLeaveRequests(results[1].data || []);
    setPayroll(results[2].data || []);
    setJobs(results[3].data || []);
    setCandidates(results[4].data || []);
    setOffboarding(results[5].data || []);
    setExpenses(results[6].data || []);
    setItAssets(results[7].data || []);
    setItTickets(results[8].data || []);
    setBenefitEnrollments(results[9].data || []);
    setBenefitPlans(results[10].data || []);
  };

  useEffect(() => {
    loadData();
    const ch = supabase.channel("analytics-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_records" }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department))).sort(), [employees]);
  const filteredEmps = department === "all" ? employees : employees.filter((e) => e.department === department);

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const avgTenure = useMemo(() => {
    const now = new Date();
    const total = employees.reduce((s, e) => s + (e.join_date ? (now.getTime() - new Date(e.join_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25) : 0), 0);
    return employees.length ? (total / employees.length).toFixed(1) : "0";
  }, [employees]);

  const deptDistribution = useMemo(() => {
    const c: Record<string, number> = {};
    employees.forEach((e) => { c[e.department] = (c[e.department] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const statusBreakdown = useMemo(() => {
    const c: Record<string, number> = {};
    employees.forEach((e) => { c[e.status] = (c[e.status] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [employees]);

  const leaveByType = useMemo(() => {
    const c: Record<string, number> = {};
    leaveRequests.forEach((l) => { c[l.leave_type] = (c[l.leave_type] || 0) + l.days; });
    return Object.entries(c).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [leaveRequests]);

  const leaveByDept = useMemo(() => {
    const d: Record<string, number> = {};
    leaveRequests.forEach((l) => {
      const emp = employees.find((e) => e.id === l.employee_id);
      if (emp) d[emp.department] = (d[emp.department] || 0) + (l.days || 0);
    });
    return Object.entries(d).map(([name, days]) => ({ name, days }));
  }, [leaveRequests, employees]);

  const salaryByDept = useMemo(() => {
    const d: Record<string, { total: number; count: number }> = {};
    payroll.forEach((p) => {
      const emp = employees.find((e) => e.id === p.employee_id);
      if (emp) {
        if (!d[emp.department]) d[emp.department] = { total: 0, count: 0 };
        d[emp.department].total += Number(p.net_pay || 0);
        d[emp.department].count += 1;
      }
    });
    return Object.entries(d).map(([name, data]) => ({
      name, total: Math.round(data.total / 1000), avg: Math.round((data.total / data.count) / 1000), count: data.count,
    }));
  }, [payroll, employees]);

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

  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const paidExpense = expenses.filter((e) => e.status === "paid").reduce((s, e) => s + Number(e.amount || 0), 0);
  const openTickets = itTickets.filter((t) => t.status === "open").length;
  const assignedAssets = itAssets.filter((a) => a.assigned_to).length;

  const exportCSV = () => {
    setExporting(true);
    let data: Record<string, string | number>[] = [];
    let filename = "analytics-export.csv";
    if (activeTab === "overview") {
      data = deptDistribution.map((d) => ({ Department: d.name, "Employee Count": d.value }));
      filename = "workforce-overview.csv";
    } else if (activeTab === "finance") {
      data = expenseByCategory.map((d) => ({ Category: d.name, "Total Amount": d.value }));
      filename = "finance-by-category.csv";
    } else if (activeTab === "it") {
      data = itAssetsByType.map((d) => ({ "Asset Type": d.name, Count: d.value }));
      filename = "it-assets.csv";
    }
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = [headers.join(","), ...data.map((r) => headers.map((h) => `"${r[h]}"`).join(","))];
      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Analytics Dashboard</h1>
          <p className="text-[13px] text-gray-500 mt-1">Real-time insights across all HR modules</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] bg-white"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button
            onClick={exportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-[#0D7377] text-white px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <i className="ri-download-line" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {[
          { label: "Employees", value: totalEmployees, sub: `${activeEmployees} active`, color: "bg-[#0D7377]/10 text-[#0D7377]" },
          { label: "Avg Tenure", value: `${avgTenure}yr`, sub: "", color: "bg-emerald-50 text-emerald-700" },
          { label: "Open Roles", value: jobs.filter((j) => j.status === "active").length, sub: `${candidates.length} candidates`, color: "bg-amber-50 text-amber-700" },
          { label: "Pending Leave", value: leaveRequests.filter((l) => l.status === "pending").length, sub: "", color: "bg-sky-50 text-sky-700" },
          { label: "Offboarding", value: offboarding.filter((o) => o.status !== "completed").length, sub: "active", color: "bg-rose-50 text-rose-700" },
          { label: "IT Tickets", value: openTickets, sub: "open", color: "bg-violet-50 text-violet-700" },
          { label: "Assets", value: `${assignedAssets}/${itAssets.length}`, sub: "assigned", color: "bg-teal-50 text-teal-700" },
          { label: "Expenses", value: `$${Math.round(totalExpense / 1000)}k`, sub: "total", color: "bg-orange-50 text-orange-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-3 ${s.color}`}>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[10px] font-semibold mt-0.5 leading-tight">{s.label}</p>
            {s.sub && <p className="text-[9px] mt-0.5 opacity-70">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap ${activeTab === t.key ? "bg-white text-[#0D7377]" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Department Distribution</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value">
                    {deptDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Status Breakdown</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                  <Bar dataKey="value" fill="#0D7377" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-gray-900">Department Summary</h3>
              <span className="text-[11px] text-gray-400">{filteredEmps.length} employees</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-gray-50">
                  {["Department", "Headcount", "Active", "On Leave", "Open Roles", "Avg Salary"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(department === "all" ? departments : [department]).map((dept) => {
                    const de = employees.filter((e) => e.department === dept);
                    const active = de.filter((e) => e.status === "active").length;
                    const onLeave = de.filter((e) => e.status === "on_leave").length;
                    const roles = jobs.filter((j) => j.department === dept && j.status === "active").length;
                    const dp = payroll.filter((p) => de.find((e) => e.id === p.employee_id));
                    const avg = dp.length ? Math.round(dp.reduce((s, p) => s + Number(p.net_pay || 0), 0) / dp.length / 1000) : 0;
                    return (
                      <tr key={dept} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-[13px] font-medium text-gray-900">{dept}</td>
                        <td className="px-5 py-3 text-[13px] text-gray-600">{de.length}</td>
                        <td className="px-5 py-3 text-[13px] text-green-600 font-medium">{active}</td>
                        <td className="px-5 py-3 text-[13px] text-amber-600">{onLeave}</td>
                        <td className="px-5 py-3 text-[13px] text-sky-600">{roles}</td>
                        <td className="px-5 py-3 text-[13px] text-gray-900 font-medium">${avg}k</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "leave" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Leave Days by Department</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Bar dataKey="days" fill="#0D7377" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Leave by Type</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leaveByType} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                  {leaveByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[14px] font-semibold text-gray-900">Leave Requests Detail</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-gray-50">
                  {["Employee", "Type", "Department", "Dates", "Days", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {leaveRequests
                    .filter((l) => department === "all" || employees.find((e) => e.id === l.employee_id)?.department === department)
                    .map((l) => {
                      const emp = employees.find((e) => e.id === l.employee_id);
                      return (
                        <tr key={l.id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-3 text-[13px] text-gray-900">{emp ? `${emp.first_name} ${emp.last_name}` : "—"}</td>
                          <td className="px-5 py-3 text-[13px] text-gray-600 capitalize">{l.leave_type}</td>
                          <td className="px-5 py-3 text-[13px] text-gray-600">{emp?.department || "—"}</td>
                          <td className="px-5 py-3 text-[13px] text-gray-600">{l.start_date} → {l.end_date}</td>
                          <td className="px-5 py-3 text-[13px] font-medium">{l.days}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${l.status === "approved" ? "bg-green-50 text-green-700" : l.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{l.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "payroll" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Payroll by Department ($k)</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryByDept}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Bar dataKey="total" fill="#0D7377" radius={[6, 6, 0, 0]} name="Total" />
                <Bar dataKey="avg" fill="#54BAB9" radius={[6, 6, 0, 0]} name="Avg" />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </BarChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Salary Distribution</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salaryByDept}>
                <defs>
                  <linearGradient id="salGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D7377" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0D7377" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Area type="monotone" dataKey="total" stroke="#0D7377" fill="url(#salGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[14px] font-semibold text-gray-900">Payroll Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-gray-50">
                  {["Employee", "Department", "Month", "Base Salary", "Bonus", "Deductions", "Net Pay", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {payroll
                    .filter((p) => department === "all" || employees.find((e) => e.id === p.employee_id)?.department === department)
                    .map((p, i) => {
                      const emp = employees.find((e) => e.id === p.employee_id);
                      return (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-3 text-[13px] text-gray-900">{emp ? `${emp.first_name} ${emp.last_name}` : "—"}</td>
                          <td className="px-5 py-3 text-[13px] text-gray-600">{emp?.department || "—"}</td>
                          <td className="px-5 py-3 text-[13px] text-gray-600">{p.month}</td>
                          <td className="px-5 py-3 text-[13px] text-gray-900">${Number(p.base_salary || 0).toLocaleString()}</td>
                          <td className="px-5 py-3 text-[13px] text-green-600">+${Number(p.bonus || 0).toLocaleString()}</td>
                          <td className="px-5 py-3 text-[13px] text-red-500">-${Number(p.deductions || 0).toLocaleString()}</td>
                          <td className="px-5 py-3 text-[13px] font-semibold text-gray-900">${Number(p.net_pay || 0).toLocaleString()}</td>
                          <td className="px-5 py-3">
                            <span className={`text-[11px] font-medium px-2 py-1 rounded-full capitalize ${p.status === "processed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{p.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "hiring" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Open Roles vs Candidates by Dept</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={hiringByDept} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Bar dataKey="open" fill="#0D7377" radius={[4, 4, 0, 0]} name="Open Roles" />
                <Bar dataKey="candidates" fill="#54BAB9" radius={[4, 4, 0, 0]} name="Candidates" />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </BarChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Candidate Pipeline</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { stage: "Applied", count: candidates.filter((c) => c.stage === "applied").length },
                { stage: "Screening", count: candidates.filter((c) => c.stage === "screening").length },
                { stage: "Interview", count: candidates.filter((c) => c.stage === "interview").length },
                { stage: "Offer", count: candidates.filter((c) => c.stage === "offer").length },
                { stage: "Hired", count: candidates.filter((c) => c.stage === "hired").length },
              ]}>
                <defs><linearGradient id="pipeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D7377" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0D7377" stopOpacity={0} />
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Area type="monotone" dataKey="count" stroke="#0D7377" fill="url(#pipeGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer></div>
          </div>
        </div>
      )}

      {activeTab === "offboarding" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            {[
              { label: "Total Offboarded", value: offboarding.length, color: "bg-gray-50" },
              { label: "In Progress", value: offboarding.filter((o) => o.status !== "completed").length, color: "bg-amber-50" },
              { label: "Completed", value: offboarding.filter((o) => o.status === "completed").length, color: "bg-green-50" },
              { label: "This Month", value: offboarding.filter((o) => new Date(o.last_day).getMonth() === new Date().getMonth()).length, color: "bg-sky-50" },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-[12px] text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Departure Reasons</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={offboardingByReason} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                  {offboardingByReason.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Status Breakdown</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={offboardingByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Bar dataKey="value" fill="#0D7377" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          </div>
        </div>
      )}

      {activeTab === "it" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-3 gap-4 lg:col-span-2">
            {[
              { label: "Total Assets", value: itAssets.length, color: "bg-sky-50 text-sky-700" },
              { label: "Assigned", value: assignedAssets, color: "bg-green-50 text-green-700" },
              { label: "Open Tickets", value: openTickets, color: "bg-amber-50 text-amber-700" },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[12px] font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Assets by Type</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={itAssetsByType} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                  {itAssetsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Bar dataKey="value" fill="#0D7377" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Asset Status</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={itAssetsByStatus} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                  {itAssetsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Ticket Status</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Bar dataKey="value" fill="#54BAB9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          </div>
        </div>
      )}

      {activeTab === "finance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-3 gap-4 lg:col-span-2">
            {[
              { label: "Total Expenses", value: `$${Math.round(totalExpense).toLocaleString()}`, color: "bg-gray-50 text-gray-700" },
              { label: "Paid Out", value: `$${Math.round(paidExpense).toLocaleString()}`, color: "bg-green-50 text-green-700" },
              { label: "Pending Approval", value: expenses.filter((e) => e.status === "pending").length.toString(), color: "bg-amber-50 text-amber-700" },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[12px] font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Spending by Category</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]} />
                <Bar dataKey="value" fill="#0D7377" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Expenses by Status</h3>
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                  {expenseByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer></div>
          </div>
        </div>
      )}

      {activeTab === "benefits" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-3 gap-4 lg:col-span-2">
            {[
              { label: "Active Plans", value: benefitPlans.length, color: "bg-[#0D7377]/10 text-[#0D7377]" },
              { label: "Total Enrolled", value: benefitEnrollments.filter((e) => e.status === "active").length, color: "bg-emerald-50 text-emerald-700" },
              { label: "Enrollment Rate", value: employees.length > 0 ? `${Math.round((new Set(benefitEnrollments.map((e) => e.employee_id)).size / employees.length) * 100)}%` : "0%", color: "bg-sky-50 text-sky-700" },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-xl p-4`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[12px] font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="border border-gray-100 rounded-xl p-5 lg:col-span-2">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Enrollment by Plan</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={benefitEnrollmentByPlan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                <Bar dataKey="enrolled" fill="#0D7377" radius={[6, 6, 0, 0]} name="Enrolled" />
              </BarChart>
            </ResponsiveContainer></div>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-[14px] font-semibold text-gray-900">Plan-Level Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-gray-50">
                  {["Plan", "Type", "Enrolled", "Enrollment Rate"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {benefitPlans.map((plan) => {
                    const enrolled = benefitEnrollments.filter((e) => e.plan_id === plan.id && e.status === "active").length;
                    const rate = employees.length > 0 ? Math.round((enrolled / employees.length) * 100) : 0;
                    return (
                      <tr key={plan.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-[13px] font-medium text-gray-900">{plan.name}</td>
                        <td className="px-5 py-3 text-[13px] text-gray-600 capitalize">{plan.type}</td>
                        <td className="px-5 py-3 text-[13px] text-[#0D7377] font-semibold">{enrolled}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#0D7377] rounded-full" style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-[12px] text-gray-600">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}