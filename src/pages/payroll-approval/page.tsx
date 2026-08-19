import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { toast } from "@/components/Toast";

interface PayrollRun {
  id: string;
  period: string;
  department: string;
  total_base: number;
  total_bonus: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  status: string;
  submitted_by: string | null;
  submitted_at: string | null;
  notes: string | null;
  created_at: string;
}

interface PayrollApproval {
  id: string;
  run_id: string;
  approver_name: string;
  approver_role: string | null;
  status: string;
  notes: string | null;
  acted_at: string | null;
  created_at: string;
}

interface EmployeeItemRecord {
  id: string;
  employee_id: string;
  month: string;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_pay: number;
  status: string;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url: string | null;
  } | null;
}

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: "ri-draft-line",
  },
  pending_approval: {
    label: "Pending Approval",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-fill",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-close-circle-fill",
  },
  processed: {
    label: "Processed & Paid",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    icon: "ri-bank-card-line",
  },
};

const DEPARTMENTS = [
  "All Departments",
  "Engineering",
  "Sales",
  "Operations",
  "Marketing",
  "Finance",
  "HR",
  "IT",
  "Legal",
  "Executive",
];

const fmt = (n: number) => `$${(n / 1000).toFixed(1)}k`;
const fmtFull = (n: number) => `$${Number(n).toLocaleString()}`;
const initials = (first?: string, last?: string) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

export default function PayrollApproval() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const canManage = isAdmin || (!!role && role.name !== "Chairman");
  const submitterName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [approvals, setApprovals] = useState<PayrollApproval[]>([]);
  const [itemizedRecords, setItemizedRecords] = useState<EmployeeItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Views
  const [tab, setTab] = useState<"pending" | "approved" | "history" | "itemized" | "create">("pending");
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  // Drilldown Modal
  const [viewingBatchRecords, setViewingBatchRecords] = useState<PayrollRun | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // Modals
  const [actionModal, setActionModal] = useState<{ run: PayrollRun; action: "approve" | "reject" } | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [acting, setActing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Create Form
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const [createForm, setCreateForm] = useState({
    period: currentPeriod,
    department: "Engineering",
    total_base: "125000",
    total_bonus: "8500",
    total_deductions: "11200",
    employee_count: "24",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const loadData = async () => {
    setLoading(true);
    const [{ data: r }, { data: a }, { data: recs }] = await Promise.all([
      supabase.from("payroll_runs").select("*").order("created_at", { ascending: false }),
      supabase.from("payroll_approvals").select("*").order("created_at", { ascending: true }),
      supabase
        .from("payroll_records")
        .select("id, employee_id, month, base_salary, bonus, deductions, net_pay, status, employees(first_name, last_name, role, department, avatar_url)")
        .order("month", { ascending: false }),
    ]);

    setRuns((r as PayrollRun[]) || []);
    setApprovals((a as PayrollApproval[]) || []);
    setItemizedRecords((recs as unknown as EmployeeItemRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("payroll-runs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_runs" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_approvals" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_records" }, () => loadData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // Highlight navigation from notifications
  useEffect(() => {
    if (!highlightId || runs.length === 0) return;
    const match = runs.find((r) => r.id === highlightId);
    if (!match) return;
    setTab(match.status === "pending_approval" ? "pending" : match.status === "approved" ? "approved" : "history");
    setPeriodFilter("all");
    setExpandedRun(highlightId);
    const t = setTimeout(() => {
      const el = document.getElementById(`payroll-run-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(t);
  }, [highlightId, runs]);

  const getRunApprovals = (runId: string) => approvals.filter((a) => a.run_id === runId);

  // Filter collections
  const pendingRuns = useMemo(() => runs.filter((r) => r.status === "pending_approval"), [runs]);
  const approvedRuns = useMemo(() => runs.filter((r) => r.status === "approved"), [runs]);
  const processedRuns = useMemo(() => runs.filter((r) => r.status === "processed"), [runs]);
  const historyRuns = useMemo(() => runs.filter((r) => r.status !== "pending_approval" && r.status !== "draft"), [runs]);

  const periods = useMemo(() => {
    const set = new Set<string>();
    runs.forEach((r) => r.period && set.add(r.period));
    itemizedRecords.forEach((r) => r.month && set.add(r.month));
    return ["all", ...Array.from(set).sort().reverse()];
  }, [runs, itemizedRecords]);

  const displayedRuns = useMemo(() => {
    let list: PayrollRun[] = [];
    if (tab === "pending") list = pendingRuns;
    else if (tab === "approved") list = approvedRuns;
    else if (tab === "history") list = historyRuns;

    return list.filter((r) => {
      if (periodFilter !== "all" && r.period !== periodFilter) return false;
      if (deptFilter !== "all" && r.department !== deptFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const dept = (r.department || "").toLowerCase();
        const period = (r.period || "").toLowerCase();
        const submitter = (r.submitted_by || "").toLowerCase();
        const notes = (r.notes || "").toLowerCase();
        if (!dept.includes(q) && !period.includes(q) && !submitter.includes(q) && !notes.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [tab, pendingRuns, approvedRuns, historyRuns, periodFilter, deptFilter, searchQuery]);

  // Filtered Itemized Records
  const filteredItemized = useMemo(() => {
    return itemizedRecords.filter((r) => {
      if (periodFilter !== "all" && r.month !== periodFilter) return false;
      if (deptFilter !== "all" && r.employees?.department !== deptFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const role = (r.employees?.role || "").toLowerCase();
        const dept = (r.employees?.department || "").toLowerCase();
        const month = (r.month || "").toLowerCase();
        if (!name.includes(q) && !role.includes(q) && !dept.includes(q) && !month.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [itemizedRecords, periodFilter, deptFilter, searchQuery]);

  // Aggregate Metrics
  const totalPendingNet = useMemo(() => pendingRuns.reduce((s, r) => s + Number(r.total_net || 0), 0), [pendingRuns]);
  const totalApprovedNet = useMemo(() => approvedRuns.reduce((s, r) => s + Number(r.total_net || 0), 0), [approvedRuns]);
  const totalProcessedNet = useMemo(() => processedRuns.reduce((s, r) => s + Number(r.total_net || 0), 0), [processedRuns]);

  // Approve / Reject Handler
  const handleAction = async () => {
    if (!actionModal || !canManage) return;
    setActing(true);
    const { run, action } = actionModal;

    const pendingForRun = getRunApprovals(run.id).filter((a) => a.status === "pending");
    const targetApproval = pendingForRun[0];

    if (targetApproval) {
      const { error: approvalError } = await supabase
        .from("payroll_approvals")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          notes: actionNote || null,
          acted_at: new Date().toISOString(),
        })
        .eq("id", targetApproval.id);

      if (approvalError) {
        setActing(false);
        toast("Error", "Failed to record approval", "error");
        return;
      }
    }

    const remainingPending = pendingForRun.length - (targetApproval ? 1 : 0);
    const finalStatus = action === "reject" ? "rejected" : remainingPending > 0 ? null : "approved";

    if (finalStatus) {
      const { error: runError } = await supabase.from("payroll_runs").update({ status: finalStatus }).eq("id", run.id);
      if (runError) {
        setActing(false);
        toast("Error", "Failed to update payroll run status", "error");
        return;
      }
    }

    setActing(false);
    setActionModal(null);
    setActionNote("");

    toast(
      finalStatus ? `Payroll Run ${finalStatus === "approved" ? "Approved" : "Rejected"}` : "Approval Recorded",
      finalStatus ? `The ${run.period} run for ${run.department} is ${finalStatus}.` : "Waiting on remaining approver in chain.",
      "success"
    );

    if (finalStatus) {
      logActivity({
        module: "payroll",
        action: finalStatus as "approved" | "rejected",
        entityType: "payroll_run",
        entityId: run.id,
        actorName: submitterName,
        actorRole: role?.name || "Unknown",
        description: `Payroll run for ${run.period} (${run.department}) was ${finalStatus}`,
        metadata: { period: run.period, department: run.department, total_net: run.total_net },
      });
      notify({
        source: "payroll",
        type: finalStatus === "approved" ? "success" : "warning",
        title: `Payroll run ${finalStatus}`,
        message: `The ${run.period} payroll run for ${run.department} was ${finalStatus}.`,
        entityId: run.id,
      });
    }
    await loadData();
  };

  // Process / Disburse Payroll Run
  const handleProcess = async (run: PayrollRun) => {
    if (!canManage || processingId) return;
    setProcessingId(run.id);
    const { error } = await supabase.from("payroll_runs").update({ status: "processed" }).eq("id", run.id);
    setProcessingId(null);

    if (error) {
      toast("Error", "Failed to mark run as processed", "error");
      return;
    }

    toast("Payroll Processed", `Disbursement finalized for ${run.department} (${run.period})`, "success");
    logActivity({
      module: "payroll",
      action: "processed",
      entityType: "payroll_run",
      entityId: run.id,
      actorName: submitterName,
      actorRole: role?.name || "Unknown",
      description: `Payroll run for ${run.period} (${run.department}) was processed & paid out`,
      metadata: { period: run.period, department: run.department, total_net: run.total_net },
    });
    notify({
      source: "payroll",
      type: "success",
      title: "Payroll processed",
      message: `The ${run.period} payroll run for ${run.department} has been processed and paid out.`,
      entityId: run.id,
    });
    await loadData();
  };

  // Create Payroll Run
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.period || !createForm.total_base || !canManage || creating) return;
    setCreating(true);

    const base = Number(createForm.total_base);
    const bonus = Number(createForm.total_bonus || 0);
    const deductions = Number(createForm.total_deductions || 0);
    const net = base + bonus - deductions;

    const { data, error } = await supabase
      .from("payroll_runs")
      .insert({
        period: createForm.period,
        department: createForm.department,
        total_base: base,
        total_bonus: bonus,
        total_deductions: deductions,
        total_net: net,
        employee_count: Number(createForm.employee_count || 0),
        status: "pending_approval",
        submitted_by: submitterName,
        submitted_at: new Date().toISOString(),
        notes: createForm.notes ? createForm.notes.trim() : null,
      })
      .select()
      .single();

    if (error || !data) {
      toast("Error", "Failed to create payroll run", "error");
      setCreating(false);
      return;
    }

    // Initialize 2-tier approval workflow
    await supabase.from("payroll_approvals").insert([
      { run_id: data.id, approver_name: "HR Director", approver_role: "Chief People Officer", status: "pending" },
      { run_id: data.id, approver_name: "Finance Director", approver_role: "Chief Financial Officer", status: "pending" },
    ]);

    setCreating(false);
    toast("Payroll Run Created", "Submitted into the multi-stage approval queue.", "success");
    setTab("pending");
    await loadData();
  };

  if (loading && runs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading payroll approval center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Financial Governance</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Payroll Approval & Disbursement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Payroll Approval Queue
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              Complete Historical Logs
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review department payroll batches, verify calculations, sign off 2-tier approval chains, and inspect itemized records.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setTab("create")}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-add-circle-line text-base font-bold" />
            New Payroll Run
          </button>
        )}
      </div>

      {/* Executive KPI Performance Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        {/* Pending Approval */}
        <div
          onClick={() => setTab("pending")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "pending" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Approval</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-time-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{pendingRuns.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{fmtFull(totalPendingNet)} awaiting review</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Ready for Processing / Approved */}
        <div
          onClick={() => setTab("approved")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "approved" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Ready to Disburse</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{approvedRuns.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{fmtFull(totalApprovedNet)} approved</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Processed & Paid */}
        <div
          onClick={() => setTab("history")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "history" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Processed & Paid</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-bank-card-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] mt-2">{processedRuns.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{fmtFull(totalProcessedNet)} disbursed</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>

        {/* Itemized Records Count */}
        <div
          onClick={() => setTab("itemized")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "itemized" ? "border-sky-500 ring-2 ring-sky-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Employee Payslips</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <i className="ri-user-star-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-700 mt-2">{itemizedRecords.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Historical entries loaded</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
        </div>
      </div>

      {/* Control Bar: Tabs, Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setTab("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "pending" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-time-line text-sm" />
              <span>Pending Authorization</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                  tab === "pending" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
                }`}
              >
                {pendingRuns.length}
              </span>
            </button>

            <button
              onClick={() => setTab("approved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "approved" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-checkbox-circle-line text-sm text-emerald-600" />
              <span>Ready for Disbursement</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                  tab === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                }`}
              >
                {approvedRuns.length}
              </span>
            </button>

            <button
              onClick={() => setTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "history" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-history-line text-sm" />
              <span>Approval History</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                  tab === "history" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
                }`}
              >
                {historyRuns.length}
              </span>
            </button>

            <button
              onClick={() => setTab("itemized")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "itemized" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-list-check-2 text-sm text-sky-600" />
              <span>Itemized Employee Records</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                  tab === "itemized" ? "bg-sky-100 text-sky-700" : "bg-gray-200 text-gray-600"
                }`}
              >
                {itemizedRecords.length}
              </span>
            </button>

            {canManage && (
              <button
                onClick={() => setTab("create")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  tab === "create" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-add-line text-sm" />
                <span>Create Run</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters: Search, Period & Department */}
        {tab !== "create" && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live Search */}
            <div className="relative w-full sm:w-52">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dept, name, notes..."
                className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-circle-fill text-xs" />
                </button>
              )}
            </div>

            {/* Period Filter (Includes all historical months from database) */}
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
            >
              <option value="all">📅 All Historical Periods</option>
              {periods
                .filter((p) => p !== "all")
                .map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate font-medium"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d === "All Departments" ? "all" : d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Reset */}
            {(searchQuery || periodFilter !== "all" || deptFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPeriodFilter("all");
                  setDeptFilter("all");
                }}
                title="Reset Filters"
                className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <i className="ri-refresh-line text-sm" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1, 2, 3. RUNS LIST VIEW (Pending, Approved, History)                       */}
      {/* ========================================================================= */}
      {tab !== "create" && tab !== "itemized" && (
        <div className="space-y-4">
          {displayedRuns.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                <i className="ri-check-double-line" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {tab === "pending"
                  ? "No Payroll Runs Pending Approval"
                  : tab === "approved"
                  ? "No Runs Awaiting Disbursement"
                  : "No Historical Runs Found"}
              </h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                {tab === "pending"
                  ? "All department payroll batches are up to date and authorized."
                  : "Entries matching the active filters will appear here."}
              </p>
              {tab === "pending" && canManage && (
                <button
                  onClick={() => setTab("create")}
                  className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
                >
                  + Create New Payroll Run
                </button>
              )}
            </div>
          ) : (
            displayedRuns.map((run) => {
              const runApprovals = getRunApprovals(run.id);
              const isExpanded = expandedRun === run.id;
              const meta = STATUS_META[run.status] || STATUS_META.draft;
              const isHighlight = run.id === highlightId;

              // Check if matching employee records exist for this period
              const matchingRecords = itemizedRecords.filter((r) => r.month === run.period);

              return (
                <div
                  key={run.id}
                  id={`payroll-run-${run.id}`}
                  tabIndex={-1}
                  className={`bg-white rounded-3xl border transition-all shadow-2xs hover:shadow-md outline-none overflow-hidden ${
                    isHighlight
                      ? "border-[#253C7D] ring-4 ring-[#253C7D]/15"
                      : run.status === "pending_approval"
                      ? "border-amber-200/80 hover:border-amber-400"
                      : run.status === "approved"
                      ? "border-emerald-200/80 hover:border-emerald-400"
                      : "border-gray-200/80"
                  }`}
                >
                  {/* Top Run Card Summary */}
                  <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 shadow-xs ${
                          run.status === "pending_approval"
                            ? "bg-amber-100 text-amber-700"
                            : run.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : run.status === "processed"
                            ? "bg-[#253C7D]/10 text-[#253C7D]"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <i className="ri-money-dollar-circle-line" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                            {run.department}
                          </h3>
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                            {run.period}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${meta.bg} ${meta.text} ${meta.border}`}
                          >
                            ● {meta.label}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                          <span>{run.employee_count} Employees</span>
                          <span>·</span>
                          <span>Submitted by {run.submitted_by || "Finance Operations"}</span>
                          {run.submitted_at && (
                            <>
                              <span>·</span>
                              <span>{new Date(run.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Financial Summary & Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Net Payout
                        </span>
                        <p className="text-lg font-black text-[#253C7D] leading-tight">
                          {fmtFull(run.total_net)}
                        </p>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          Gross {fmt(run.total_base)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {matchingRecords.length > 0 && (
                          <button
                            onClick={() => setViewingBatchRecords(run)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                            title="Inspect itemized employee payslips"
                          >
                            <i className="ri-team-line" />
                            {matchingRecords.length} Payslips
                          </button>
                        )}

                        {run.status === "pending_approval" && canManage && (
                          <>
                            <button
                              onClick={() => {
                                setActionModal({ run, action: "approve" });
                                setActionNote("");
                              }}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <i className="ri-check-line font-bold" />
                              Approve
                            </button>

                            <button
                              onClick={() => {
                                setActionModal({ run, action: "reject" });
                                setActionNote("");
                              }}
                              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            >
                              <i className="ri-close-line mr-1 font-bold" />
                              Reject
                            </button>
                          </>
                        )}

                        {run.status === "approved" && canManage && (
                          <button
                            onClick={() => handleProcess(run)}
                            disabled={processingId === run.id}
                            className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <i className="ri-bank-card-line" />
                            {processingId === run.id ? "Processing..." : "Process & Disburse"}
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                          className="w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                          title="Toggle Breakdown"
                        >
                          <i className={`${isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} text-lg`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown & 2-Tier Approval Chain */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-slate-50/50 p-5 sm:p-6 space-y-5 animate-in slide-in-from-top-2 duration-150">
                      {/* Financial Math Breakdown Grid */}
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                          Financial Compensation Breakdown
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white rounded-2xl p-3.5 border border-gray-200/70 shadow-2xs">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Base Salary</span>
                            <p className="text-sm font-extrabold text-gray-900 mt-0.5">{fmtFull(run.total_base)}</p>
                          </div>
                          <div className="bg-white rounded-2xl p-3.5 border border-gray-200/70 shadow-2xs">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase block">Bonuses (+)</span>
                            <p className="text-sm font-extrabold text-emerald-700 mt-0.5">+{fmtFull(run.total_bonus)}</p>
                          </div>
                          <div className="bg-white rounded-2xl p-3.5 border border-gray-200/70 shadow-2xs">
                            <span className="text-[10px] font-bold text-rose-600 uppercase block">Deductions (-)</span>
                            <p className="text-sm font-extrabold text-rose-700 mt-0.5">-{fmtFull(run.total_deductions)}</p>
                          </div>
                          <div className="bg-white rounded-2xl p-3.5 border border-[#253C7D]/20 shadow-2xs bg-[#253C7D]/5">
                            <span className="text-[10px] font-bold text-[#253C7D] uppercase block">Net Payout (=)</span>
                            <p className="text-sm font-black text-[#253C7D] mt-0.5">{fmtFull(run.total_net)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Notes Box */}
                      {run.notes && (
                        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/70 text-xs text-amber-900">
                          <span className="font-bold flex items-center gap-1.5 mb-0.5">
                            <i className="ri-information-line" /> Submission Notes:
                          </span>
                          <p className="text-amber-800">{run.notes}</p>
                        </div>
                      )}

                      {/* 2-Tier Approval Chain Visualizer */}
                      <div>
                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                          Multi-Tier Approval Chain
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {runApprovals.map((a, i) => (
                            <div
                              key={a.id}
                              className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                                a.status === "approved"
                                  ? "bg-emerald-50/50 border-emerald-200/80"
                                  : a.status === "rejected"
                                  ? "bg-rose-50/50 border-rose-200/80"
                                  : "bg-white border-gray-200/80"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                  a.status === "approved"
                                    ? "bg-emerald-600 text-white"
                                    : a.status === "rejected"
                                    ? "bg-rose-600 text-white"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {i + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold text-gray-900">{a.approver_name}</p>
                                  <span
                                    className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                                      a.status === "approved"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : a.status === "rejected"
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {a.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-0.5">{a.approver_role}</p>

                                {a.acted_at && (
                                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                    <i className="ri-check-double-line text-emerald-600" />
                                    Acted on {new Date(a.acted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                )}

                                {a.notes && (
                                  <p className="text-[11px] text-gray-600 italic mt-1 bg-white/80 p-1.5 rounded-lg border border-gray-100">
                                    "{a.notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ITEMIZED EMPLOYEE RECORDS TAB (All 165+ Historical Payrolls)           */}
      {/* ========================================================================= */}
      {tab === "itemized" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <i className="ri-file-list-3-line text-[#253C7D]" />
                All Historical Employee Payroll Entries
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Itemized employee records across all departments and previous months
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60">
              {filteredItemized.length} Records Found
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Period</th>
                  <th className="px-5 py-3.5">Base Salary</th>
                  <th className="px-5 py-3.5">Bonus (+)</th>
                  <th className="px-5 py-3.5">Deductions (-)</th>
                  <th className="px-5 py-3.5">Net Pay</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItemized.map((rec) => {
                  const emp = rec.employees;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                            {emp?.avatar_url ? (
                              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials(emp?.first_name, emp?.last_name)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                            </p>
                            <p className="text-[11px] text-gray-400">{emp?.role || "Team Member"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                          {emp?.department || "General"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                        {rec.month}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-800">
                        ${Number(rec.base_salary).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-emerald-600">
                        +${Number(rec.bonus).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-rose-600">
                        -${Number(rec.deductions).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-black text-sm text-[#253C7D]">
                          ${Number(rec.net_pay).toLocaleString()}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            rec.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-sky-50 text-sky-700 border border-sky-200"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE NEW PAYROLL RUN TAB                                              */}
      {/* ========================================================================= */}
      {tab === "create" && (
        <div className="max-w-2xl bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-lg">
              <i className="ri-folder-add-line" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Initiate New Department Payroll Batch</h3>
              <p className="text-xs text-gray-400 mt-0.5">Submit into the multi-stage authorization workflow</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Pay Period (Month) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="month"
                  required
                  value={createForm.period}
                  onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  {DEPARTMENTS.filter((d) => d !== "All Departments").map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Total Base Salary ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  value={createForm.total_base}
                  onChange={(e) => setCreateForm({ ...createForm, total_base: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Total Bonuses ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={createForm.total_bonus}
                  onChange={(e) => setCreateForm({ ...createForm, total_bonus: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Total Deductions ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={createForm.total_deductions}
                  onChange={(e) => setCreateForm({ ...createForm, total_deductions: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Eligible Employee Count
              </label>
              <input
                type="number"
                min={1}
                value={createForm.employee_count}
                onChange={(e) => setCreateForm({ ...createForm, employee_count: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                placeholder="20"
              />
            </div>

            {/* Real-time Net Payout Calculation Card */}
            {createForm.total_base && (
              <div className="bg-[#253C7D]/5 border border-[#253C7D]/15 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#253C7D] uppercase tracking-wider block">
                    Calculated Net Batch Payout
                  </span>
                  <p className="text-xl font-black text-[#253C7D] mt-0.5">
                    {fmtFull(
                      Number(createForm.total_base || 0) +
                        Number(createForm.total_bonus || 0) -
                        Number(createForm.total_deductions || 0)
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center">
                  <i className="ri-calculator-line text-lg" />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Executive Notes / Variance Remarks
              </label>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                rows={3}
                maxLength={500}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] resize-none"
                placeholder="Remarks regarding bonuses, retroactive adjustments, or overtime..."
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2">
              <i className="ri-shield-check-line text-base text-amber-600 shrink-0 mt-0.5" />
              <span>
                Submitting this batch will automatically assign two sequential approvers (HR Director & CFO) before funds can be disbursed.
              </span>
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTab("pending")}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {creating ? "Submitting..." : "Submit Batch for Approval"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: INSPECT BATCH'S ITEMIZED PAYSLIPS                                 */}
      {/* ========================================================================= */}
      {viewingBatchRecords && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setViewingBatchRecords(null)}
          />
          <div className="relative w-full sm:w-[600px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Itemized Employee Payslips ({viewingBatchRecords.period})
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {viewingBatchRecords.department} · {fmtFull(viewingBatchRecords.total_net)} Net
                  </p>
                </div>
                <button
                  onClick={() => setViewingBatchRecords(null)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {itemizedRecords
                  .filter((r) => r.month === viewingBatchRecords.period)
                  .map((rec) => {
                    const emp = rec.employees;
                    return (
                      <div
                        key={rec.id}
                        className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-xs">
                            {initials(emp?.first_name, emp?.last_name)}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-gray-900">
                              {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {emp?.role} · {emp?.department}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-extrabold text-[#253C7D]">
                            ${Number(rec.net_pay).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Base ${Number(rec.base_salary).toLocaleString()} · Bonus +${Number(rec.bonus).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setViewingBatchRecords(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: APPROVE / REJECT AUTHORIZATION DIALOG                               */}
      {/* ========================================================================= */}
      {actionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !acting && setActionModal(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                actionModal.action === "approve"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              <i
                className={`${
                  actionModal.action === "approve" ? "ri-checkbox-circle-line" : "ri-close-circle-line"
                } text-2xl font-bold`}
              />
            </div>

            <h3 className="text-lg font-extrabold text-gray-900">
              {actionModal.action === "approve" ? "Authorize Payroll Batch" : "Reject Payroll Batch"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {actionModal.run.department} · {actionModal.run.period} · {actionModal.run.employee_count} Employees
            </p>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-100 my-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Net Disbursement
              </span>
              <p className="text-xl font-black text-[#253C7D] mt-0.5">
                {fmtFull(actionModal.run.total_net)}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Sign-off Remarks (Optional)
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] resize-none"
                placeholder={`Add authorization comments for ${
                  actionModal.action === "approve" ? "approval" : "rejection"
                }...`}
              />
            </div>

            <div className="flex gap-3 mt-5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={acting}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                  actionModal.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {acting
                  ? "Processing..."
                  : actionModal.action === "approve"
                  ? "Sign & Approve"
                  : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}