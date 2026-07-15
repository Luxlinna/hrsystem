import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: "ri-draft-line" },
  pending_approval: { label: "Pending", color: "bg-amber-50 text-amber-700", icon: "ri-time-line" },
  approved: { label: "Approved", color: "bg-green-50 text-green-700", icon: "ri-checkbox-circle-line" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700", icon: "ri-close-circle-fill" },
  processed: { label: "Processed", color: "bg-[#0D7377]/10 text-[#0D7377]", icon: "ri-bank-card-line" },
};

export default function PayrollApproval() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [approvals, setApprovals] = useState<PayrollApproval[]>([]);
  const [tab, setTab] = useState<"pending" | "history" | "create">("pending");
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ run: PayrollRun; action: "approve" | "reject" } | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [createForm, setCreateForm] = useState({ period: "", department: "Engineering", total_base: "", total_bonus: "", total_deductions: "", employee_count: "", notes: "" });
  const [creating, setCreating] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("all");

  const loadData = async () => {
    const [{ data: r }, { data: a }] = await Promise.all([
      supabase.from("payroll_runs").select("*").order("created_at", { ascending: false }),
      supabase.from("payroll_approvals").select("*").order("created_at", { ascending: true }),
    ]);
    setRuns(r || []);
    setApprovals(a || []);
  };

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("payroll-runs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_runs" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_approvals" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }
  }, [toast]);

  const fmt = (n: number) => `$${(n / 1000).toFixed(1)}k`;
  const fmtFull = (n: number) => `$${Number(n).toLocaleString()}`;

  const getRunApprovals = (runId: string) => approvals.filter((a) => a.run_id === runId);

  const handleAction = async () => {
    if (!actionModal) return;
    setActing(true);
    const { run, action } = actionModal;
    const newStatus = action === "approve" ? "approved" : "rejected";

    const approvalsForRun = getRunApprovals(run.id).filter((a) => a.status === "pending");
    if (approvalsForRun.length > 0) {
      await supabase.from("payroll_approvals").update({ status: action === "approve" ? "approved" : "rejected", notes: actionNote || null, acted_at: new Date().toISOString() }).eq("id", approvalsForRun[0].id);
    }

    await supabase.from("payroll_runs").update({ status: newStatus }).eq("id", run.id);

    setActing(false);
    setActionModal(null);
    setActionNote("");
    setToast({ type: "success", message: `Payroll run ${action === "approve" ? "approved" : "rejected"} successfully` });
    await loadData();
  };

  const handleProcess = async (run: PayrollRun) => {
    await supabase.from("payroll_runs").update({ status: "processed" }).eq("id", run.id);
    setToast({ type: "success", message: "Payroll run marked as processed" });
    await loadData();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.period || !createForm.total_base) return;
    setCreating(true);
    const base = Number(createForm.total_base);
    const bonus = Number(createForm.total_bonus || 0);
    const deductions = Number(createForm.total_deductions || 0);
    const net = base + bonus - deductions;
    const { data, error } = await supabase.from("payroll_runs").insert({
      period: createForm.period,
      department: createForm.department,
      total_base: base,
      total_bonus: bonus,
      total_deductions: deductions,
      total_net: net,
      employee_count: Number(createForm.employee_count || 0),
      status: "pending_approval",
      submitted_by: "Sarah Mitchell",
      submitted_at: new Date().toISOString(),
      notes: createForm.notes || null,
    }).select().single();

    if (error) { setToast({ type: "error", message: "Failed to create run" }); setCreating(false); return; }

    if (data) {
      await supabase.from("payroll_approvals").insert([
        { run_id: data.id, approver_name: "Sarah Mitchell", approver_role: "Chief HR Officer", status: "pending" },
        { run_id: data.id, approver_name: "Finance Lead", approver_role: "Finance Director", status: "pending" },
      ]);
    }

    setCreating(false);
    setToast({ type: "success", message: "Payroll run created and submitted for approval" });
    setCreateForm({ period: "", department: "Engineering", total_base: "", total_bonus: "", total_deductions: "", employee_count: "", notes: "" });
    setTab("pending");
    await loadData();
  };

  const pendingRuns = runs.filter((r) => r.status === "pending_approval");
  const historyRuns = runs.filter((r) => r.status !== "pending_approval" && r.status !== "draft");
  const periods = ["all", ...Array.from(new Set(runs.map((r) => r.period))).sort().reverse()];

  const filteredHistory = periodFilter === "all" ? historyRuns : historyRuns.filter((r) => r.period === periodFilter);

  const totalPendingNet = pendingRuns.reduce((s, r) => s + Number(r.total_net), 0);
  const totalProcessedNet = runs.filter((r) => r.status === "processed").reduce((s, r) => s + Number(r.total_net), 0);

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-[13px] font-medium text-white ${toast.type === "success" ? "bg-[#0D7377]" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Payroll Approval</h1>
          <p className="text-[13px] text-gray-500 mt-1">Review, approve, and process payroll runs before disbursement</p>
        </div>
        <button onClick={() => setTab("create")} className="inline-flex items-center gap-2 bg-[#0D7377] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors whitespace-nowrap">
          <i className="ri-add-line" /> New Payroll Run
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pending Approval", value: pendingRuns.length, sub: fmt(totalPendingNet) + " total", color: "bg-amber-50 text-amber-700" },
          { label: "Approved Runs", value: runs.filter(r => r.status === "approved").length, sub: fmt(runs.filter(r => r.status === "approved").reduce((s, r) => s + Number(r.total_net), 0)), color: "bg-green-50 text-green-700" },
          { label: "Processed", value: runs.filter(r => r.status === "processed").length, sub: fmt(totalProcessedNet) + " paid", color: "bg-[#0D7377]/10 text-[#0D7377]" },
          { label: "Draft", value: runs.filter(r => r.status === "draft").length, sub: "Awaiting submission", color: "bg-gray-50 text-gray-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[12px] font-medium mt-0.5">{s.label}</p>
            <p className="text-[11px] opacity-70 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 border-b border-gray-100">
        {([["pending", "Pending Approval", pendingRuns.length], ["history", "History", historyRuns.length], ["create", "Create Run", null]] as const).map(([id, label, count]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-5 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === id ? "border-[#0D7377] text-[#0D7377]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {label}
            {count !== null && <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${tab === id ? "bg-[#0D7377]/10 text-[#0D7377]" : "bg-gray-100 text-gray-500"}`}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Pending Tab */}
      {tab === "pending" && (
        <div className="space-y-4">
          {pendingRuns.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <i className="ri-check-double-line text-5xl mb-3 block" />
              <p className="text-[14px]">No payroll runs pending approval</p>
              <p className="text-[12px] mt-1">All runs are up to date!</p>
            </div>
          ) : pendingRuns.map((run) => {
            const runApprovals = getRunApprovals(run.id);
            const isExpanded = expandedRun === run.id;
            return (
              <div key={run.id} className="border border-amber-100 rounded-xl overflow-hidden bg-amber-50/20">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                      <i className="ri-money-dollar-circle-line text-xl" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-bold text-gray-900">{run.department}</p>
                        <span className="text-[11px] text-gray-500">· {run.period}</span>
                      </div>
                      <p className="text-[12px] text-gray-500">{run.employee_count} employees · Submitted by {run.submitted_by || "HR"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[16px] font-bold text-gray-900">{fmt(run.total_net)}</p>
                      <p className="text-[11px] text-gray-500">Net payout</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setActionModal({ run, action: "approve" }); setActionNote(""); }} className="px-4 py-2 bg-green-500 text-white text-[12px] font-semibold rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap">
                        <i className="ri-check-line mr-1" />Approve
                      </button>
                      <button onClick={() => { setActionModal({ run, action: "reject" }); setActionNote(""); }} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-[12px] font-semibold rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap">
                        <i className="ri-close-line mr-1" />Reject
                      </button>
                      <button onClick={() => setExpandedRun(isExpanded ? null : run.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                        <i className={`${isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} text-lg`} />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-amber-100 bg-white p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                      {[
                        { label: "Base Salary", value: fmtFull(run.total_base), color: "text-gray-900" },
                        { label: "Bonus", value: `+${fmtFull(run.total_bonus)}`, color: "text-green-600" },
                        { label: "Deductions", value: `-${fmtFull(run.total_deductions)}`, color: "text-red-600" },
                        { label: "Net Payout", value: fmtFull(run.total_net), color: "text-[#0D7377] font-bold" },
                      ].map((item) => (
                        <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-[11px] text-gray-500 mb-1">{item.label}</p>
                          <p className={`text-[15px] font-semibold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {run.notes && (
                      <div className="mb-4 p-3 bg-amber-50 rounded-lg text-[12px] text-amber-800">
                        <i className="ri-information-line mr-1" />{run.notes}
                      </div>
                    )}
                    <h4 className="text-[13px] font-semibold text-gray-900 mb-3">Approval Chain</h4>
                    <div className="space-y-2">
                      {runApprovals.map((a, i) => (
                        <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border ${a.status === "approved" ? "border-green-100 bg-green-50/30" : a.status === "rejected" ? "border-red-100 bg-red-50/30" : "border-gray-100 bg-gray-50"}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${a.status === "approved" ? "bg-green-500 text-white" : a.status === "rejected" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-[12px] font-semibold text-gray-900">{a.approver_name}</p>
                            <p className="text-[11px] text-gray-500">{a.approver_role}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${a.status === "approved" ? "bg-green-100 text-green-700" : a.status === "rejected" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                              {a.status}
                            </span>
                            {a.acted_at && <p className="text-[10px] text-gray-400 mt-0.5">{new Date(a.acted_at).toLocaleDateString()}</p>}
                            {a.notes && <p className="text-[10px] text-gray-500 mt-0.5 max-w-xs">{a.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <label className="text-[12px] font-medium text-gray-600">Period:</label>
            <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-[12px] bg-white focus:outline-none focus:border-[#0D7377]">
              {periods.map((p) => <option key={p} value={p}>{p === "all" ? "All Periods" : p}</option>)}
            </select>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-7 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span className="col-span-2">Department / Period</span>
              <span>Employees</span>
              <span>Base</span>
              <span>Net Pay</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><i className="ri-history-line text-3xl mb-2 block" /><p className="text-[13px]">No history found</p></div>
            ) : filteredHistory.map((run) => {
              const meta = STATUS_META[run.status] || STATUS_META.draft;
              const runApprovals = getRunApprovals(run.id);
              const isExpanded = expandedRun === run.id;
              return (
                <div key={run.id} className="border-t border-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-7 px-5 py-4 items-center gap-2">
                    <div className="md:col-span-2">
                      <p className="text-[13px] font-semibold text-gray-900">{run.department}</p>
                      <p className="text-[11px] text-gray-500">{run.period} · {run.submitted_by || "HR"}</p>
                    </div>
                    <span className="text-[13px] text-gray-600">{run.employee_count}</span>
                    <span className="text-[13px] text-gray-700">{fmt(run.total_base)}</span>
                    <span className="text-[13px] font-semibold text-gray-900">{fmt(run.total_net)}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full w-fit ${meta.color}`}>
                      <i className={`${meta.icon} text-[11px]`} />{meta.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {run.status === "approved" && (
                        <button onClick={() => handleProcess(run)} className="px-3 py-1.5 bg-[#0D7377] text-white text-[11px] font-semibold rounded-lg hover:bg-[#0a5c60] transition-colors whitespace-nowrap">Process</button>
                      )}
                      <button onClick={() => setExpandedRun(isExpanded ? null : run.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                        <i className={`${isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} text-base`} />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-gray-50 bg-gray-50/30 px-5 py-4">
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                          { label: "Base", v: fmtFull(run.total_base) },
                          { label: "Bonus", v: `+${fmtFull(run.total_bonus)}` },
                          { label: "Deductions", v: `-${fmtFull(run.total_deductions)}` },
                          { label: "Net", v: fmtFull(run.total_net) },
                        ].map((it) => (
                          <div key={it.label} className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-[10px] text-gray-500">{it.label}</p>
                            <p className="text-[13px] font-bold text-gray-900 mt-0.5">{it.v}</p>
                          </div>
                        ))}
                      </div>
                      {runApprovals.length > 0 && (
                        <>
                          <p className="text-[12px] font-semibold text-gray-700 mb-2">Approval Chain</p>
                          <div className="space-y-1.5">
                            {runApprovals.map((a) => (
                              <div key={a.id} className={`flex items-center gap-2 p-2 rounded-lg text-[11px] ${a.status === "approved" ? "bg-green-50 text-green-700" : a.status === "rejected" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-600"}`}>
                                <i className={`${a.status === "approved" ? "ri-check-line" : a.status === "rejected" ? "ri-close-line" : "ri-time-line"}`} />
                                <span className="font-medium">{a.approver_name}</span>
                                <span className="text-gray-400">({a.approver_role})</span>
                                <span className="capitalize font-semibold ml-auto">{a.status}</span>
                                {a.acted_at && <span className="text-gray-400">{new Date(a.acted_at).toLocaleDateString()}</span>}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Tab */}
      {tab === "create" && (
        <div className="max-w-2xl">
          <div className="border border-gray-100 rounded-2xl p-6">
            <h3 className="text-[15px] font-bold text-gray-900 mb-5">Create Payroll Run</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Period * (YYYY-MM)</label>
                  <input type="text" required value={createForm.period} onChange={(e) => setCreateForm({ ...createForm, period: e.target.value })} placeholder="e.g. 2026-06" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Department *</label>
                  <select value={createForm.department} onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377] bg-white">
                    {["Engineering","Sales","Operations","Marketing","Finance","IT","Legal","Executive","All Departments"].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Total Base Salary *</label>
                  <input type="number" required value={createForm.total_base} onChange={(e) => setCreateForm({ ...createForm, total_base: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Total Bonus</label>
                  <input type="number" value={createForm.total_bonus} onChange={(e) => setCreateForm({ ...createForm, total_bonus: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Total Deductions</label>
                  <input type="number" value={createForm.total_deductions} onChange={(e) => setCreateForm({ ...createForm, total_deductions: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="0" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Employee Count</label>
                  <input type="number" value={createForm.employee_count} onChange={(e) => setCreateForm({ ...createForm, employee_count: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="0" />
                </div>
              </div>
              {createForm.total_base && (
                <div className="bg-[#0D7377]/5 border border-[#0D7377]/10 rounded-xl p-4">
                  <p className="text-[12px] font-semibold text-[#0D7377] mb-1">Calculated Net Payout</p>
                  <p className="text-[20px] font-bold text-[#0D7377]">
                    {fmtFull(Number(createForm.total_base) + Number(createForm.total_bonus || 0) - Number(createForm.total_deductions || 0))}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} rows={3} maxLength={500} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377] resize-none" placeholder="Add context or notes about this payroll run..." />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[12px] text-amber-700">
                <i className="ri-information-line mr-1.5" />This run will be submitted for approval automatically. Two approvers will be assigned.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setTab("pending")} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 px-4 py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors disabled:opacity-50">{creating ? "Submitting..." : "Submit for Approval"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${actionModal.action === "approve" ? "bg-green-50" : "bg-red-50"}`}>
              <i className={`${actionModal.action === "approve" ? "ri-check-line text-green-600" : "ri-close-line text-red-600"} text-xl`} />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">
              {actionModal.action === "approve" ? "Approve Payroll Run" : "Reject Payroll Run"}
            </h3>
            <p className="text-[13px] text-gray-500 mb-1">{actionModal.run.department} · {actionModal.run.period}</p>
            <p className="text-[14px] font-bold text-[#0D7377] mb-4">Net Payout: {fmtFull(actionModal.run.total_net)}</p>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Note (optional)</label>
            <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)} rows={3} maxLength={500} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0D7377] resize-none" placeholder={`Add a note for ${actionModal.action === "approve" ? "approval" : "rejection"}...`} />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setActionModal(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleAction}
                disabled={acting}
                className={`flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-colors disabled:opacity-50 ${actionModal.action === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
              >
                {acting ? "Processing..." : actionModal.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}