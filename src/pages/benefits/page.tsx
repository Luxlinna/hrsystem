import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";

interface BenefitPlan {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: string;
  eligible_count: number;
  created_at: string;
}

interface Enrollment {
  id: string;
  plan_id: string;
  employee_id: string;
  status: string;
  employees?: { first_name: string; last_name: string; role: string } | null;
  benefit_plans?: { name: string; type: string } | null;
}

export default function Benefits() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const [tab, setTab] = useState<"plans" | "enrollment" | "providers">("plans");
  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employees, setEmployees] = useState<{ id: string; first_name: string; last_name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ employee_id: "", plan_id: "" });
  const [enrollEmployeeIds, setEnrollEmployeeIds] = useState<string[]>([]);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const enrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: p } = await supabase.from("benefit_plans").select("*").order("created_at");
    setPlans(p || []);

    const { data: e } = await supabase
      .from("benefit_enrollments")
      .select("*, employees(first_name, last_name, role), benefit_plans(name, type)")
      .order("created_at", { ascending: false });
    setEnrollments(e || []);

    const { data: emps } = await supabase.from("employees").select("id, first_name, last_name, role, avatar_url").eq("status", "active").order("first_name");
    setEmployees(emps || []);
    setLoading(false);
  };

  const toggleEnrollmentStatus = async (enrollment: Enrollment) => {
    const nextStatus = enrollment.status === "enrolled" ? "opted_out" : "enrolled";
    await supabase.from("benefit_enrollments").update({ status: nextStatus }).eq("id", enrollment.id);
    toast(nextStatus === "enrolled" ? "Re-enrolled" : "Opted out", `${enrollment.employees?.first_name ?? "Employee"} is now ${nextStatus.replace("_", " ")}.`, "success");
    logActivity({ module: "benefits", action: "updated", entityType: "benefit_enrollment", entityId: enrollment.id, actorName, actorRole: role?.name || "Unknown", description: `${enrollment.employees?.first_name ?? "Employee"} ${enrollment.employees?.last_name ?? ""} is now ${nextStatus.replace("_", " ")} in ${enrollment.benefit_plans?.name ?? "a benefit plan"}` });
    loadData();
  };

  // Close the enroll dropdown when clicking outside.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (enrollRef.current && !enrollRef.current.contains(e.target as Node)) setEnrollOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Reset dropdown state when modal closes.
  useEffect(() => {
    if (!enrollModal) {
      setEnrollOpen(false);
      setEnrollSearch("");
    }
  }, [enrollModal]);

  const enrollEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enrollEmployeeIds.length === 0 || !enrollForm.plan_id) return;
    const plan = plans.find((p) => p.id === enrollForm.plan_id);
    const payload = enrollEmployeeIds.map((empId) => ({
      employee_id: empId,
      plan_id: enrollForm.plan_id,
      status: "enrolled",
    }));
    await supabase.from("benefit_enrollments").insert(payload);
    setEnrollModal(false);
    setEnrollForm({ employee_id: "", plan_id: "" });
    setEnrollEmployeeIds([]);
    toast("Enrollment saved", `${enrollEmployeeIds.length} employee${enrollEmployeeIds.length === 1 ? '' : 's'} enrolled in ${plan?.name ?? 'benefit plan'}`, "success");
    logActivity({ module: "benefits", action: "created", entityType: "benefit_enrollment", actorName, actorRole: role?.name || "Unknown", description: `${enrollEmployeeIds.length} employee${enrollEmployeeIds.length === 1 ? '' : 's'} enrolled in ${plan?.name ?? "a benefit plan"}` });
    loadData();
  };

  const activePlans = plans.filter((p) => p.status === "active").length;
  const totalEnrolled = enrollments.filter((e) => e.status === "enrolled").length;
  const optedOut = enrollments.filter((e) => e.status === "opted_out").length;

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#FAFAF8]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Benefits Administration</h1>
          <p className="text-[13px] text-gray-500 mt-1">Manage employee benefits, enrollment, and providers</p>
        </div>
        <button
          onClick={() => setEnrollModal(true)}
          className="px-4 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] whitespace-nowrap"
        >
          <i className="ri-user-add-line mr-1" />
          Enroll Employee
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#253C7D]/10 rounded-xl p-5">
          <p className="text-2xl font-bold text-[#253C7D]">{activePlans}</p>
          <p className="text-[12px] font-medium text-[#253C7D]/70 mt-1">Active Benefit Plans</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-green-700">{totalEnrolled}</p>
          <p className="text-[12px] font-medium text-green-600 mt-1">Total Enrolled</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-gray-700">{optedOut}</p>
          <p className="text-[12px] font-medium text-gray-600 mt-1">Opted Out</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["plans", "enrollment", "providers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-[12px] font-medium capitalize transition-colors whitespace-nowrap ${
              tab === t ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === "plans" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-7 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider items-center">
                  <span>Plan</span>
                  <span>Provider</span>
                  <span>Type</span>
                  <span>Eligible</span>
                  <span>Enrolled</span>
                  <span>Rate</span>
                  <span>Status</span>
                </div>
                {plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-[13px]">No benefit plans found</div>
                ) : (
                  plans.map((b) => {
                    const enrolledCount = enrollments.filter((e) => e.plan_id === b.id && e.status === "enrolled").length;
                    const rate = b.eligible_count > 0 ? ((enrolledCount / b.eligible_count) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={b.id} className="grid grid-cols-7 px-5 py-4 border-t border-gray-50 items-center">
                        <span className="text-[13px] font-medium text-gray-900">{b.name}</span>
                        <span className="text-[13px] text-gray-600">{b.provider || "—"}</span>
                        <span className="text-[13px] text-gray-600">{b.type}</span>
                        <span className="text-[13px] text-gray-500">{b.eligible_count.toLocaleString()}</span>
                        <span className="text-[13px] font-bold text-[#253C7D]">{enrolledCount}</span>
                        <span className="text-[13px] font-semibold text-gray-900">{rate}%</span>
                        <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-full w-fit capitalize ${
                          b.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {tab === "enrollment" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-500 text-[13px] col-span-2">
                  No benefit plans available
                </div>
              ) : (
                plans.map((b) => {
                  const planEnrollments = enrollments.filter((e) => e.plan_id === b.id);
                  const enrolledCount = planEnrollments.filter((e) => e.status === "enrolled").length;
                  const pct = b.eligible_count > 0 ? (enrolledCount / b.eligible_count) * 100 : 0;
                  return (
                    <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[14px] font-semibold text-gray-900">{b.name}</span>
                        <span className="text-[11px] text-gray-500">{b.provider || "Internal"}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-gray-500">Enrollment</span>
                        <span className="text-[11px] font-semibold text-gray-700">{enrolledCount} / {b.eligible_count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-[#253C7D] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      {planEnrollments.length > 0 && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-gray-50">
                          {planEnrollments.slice(0, 4).map((e) => (
                            <div key={e.id} className="flex items-center justify-between text-[12px]">
                              <Link to={`/employees/${e.employee_id}`} className="text-gray-700 hover:text-[#253C7D] transition-colors">
                                {e.employees?.first_name} {e.employees?.last_name}
                              </Link>
                              <button
                                onClick={() => toggleEnrollmentStatus(e)}
                                title={e.status === "enrolled" ? "Click to opt out" : "Click to re-enroll"}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                                  e.status === "enrolled" ? "bg-green-50 text-green-700 hover:bg-green-100" : e.status === "opted_out" ? "bg-gray-50 text-gray-500 hover:bg-gray-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                }`}
                              >
                                {e.status.replace("_", " ")}
                              </button>
                            </div>
                          ))}
                          {planEnrollments.length > 4 && (
                            <p className="text-[11px] text-gray-400 mt-1">+{planEnrollments.length - 4} more enrolled</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "providers" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-500 text-[13px] col-span-3">
                  No providers found
                </div>
              ) : (
                Array.from(new Set(plans.map((p) => p.provider).filter(Boolean))).map((provider) => {
                  const providerPlans = plans.filter((p) => p.provider === provider);
                  return (
                    <div key={provider} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-3 hover:border-[#253C7D]/20 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-[#253C7D]/10 flex items-center justify-center shrink-0">
                        <i className="ri-building-line text-xl text-[#253C7D] w-6 h-6 flex items-center justify-center" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-gray-900">{provider}</p>
                        <p className="text-[12px] text-gray-500">{providerPlans.length} active plan{providerPlans.length > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Enroll Modal */}
      {enrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Enroll Employee</h3>
              <button onClick={() => setEnrollModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <i className="ri-close-line text-xl text-gray-500" />
              </button>
            </div>
            <form onSubmit={enrollEmployee} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Employee(s)</label>
                <div className="relative" ref={enrollRef}>
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                    <input
                      type="text"
                      role="combobox"
                      aria-expanded={enrollOpen}
                      value={enrollOpen ? enrollSearch : enrollEmployeeIds.length > 0 ? `${enrollEmployeeIds.length} employee${enrollEmployeeIds.length === 1 ? '' : 's'} selected` : enrollSearch}
                      onChange={(e) => { setEnrollSearch(e.target.value); setEnrollOpen(true); }}
                      onFocus={() => setEnrollOpen(true)}
                      placeholder="Search by name..."
                      className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] bg-white"
                    />
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {enrollOpen && (() => {
                    const filtered = employees.filter((emp) => {
                      const q = enrollSearch.trim().toLowerCase();
                      if (!q) return true;
                      return `${emp.first_name} ${emp.last_name} ${emp.role}`.toLowerCase().includes(q);
                    });
                    return (
                      <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                        <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                          {filtered.length} employee{filtered.length === 1 ? '' : 's'}{enrollSearch.trim() ? ` matching "${enrollSearch.trim()}"` : ''}
                        </p>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const allIds = filtered.map((e) => e.id);
                            const allSelected = allIds.length > 0 && allIds.every((id) => enrollEmployeeIds.includes(id));
                            setEnrollEmployeeIds(allSelected ? [] : allIds);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            filtered.length > 0 && filtered.every((e) => enrollEmployeeIds.includes(e.id))
                              ? "bg-[#253C7D] border-[#253C7D]"
                              : filtered.some((e) => enrollEmployeeIds.includes(e.id))
                                ? "bg-[#253C7D]/20 border-[#253C7D]"
                                : "border-gray-300 bg-white"
                          }`}>
                            {filtered.length > 0 && filtered.every((e) => enrollEmployeeIds.includes(e.id)) && <i className="ri-check-line text-white text-xs" />}
                            {filtered.some((e) => enrollEmployeeIds.includes(e.id)) && !(filtered.length > 0 && filtered.every((e) => enrollEmployeeIds.includes(e.id))) && <span className="w-2 h-0.5 bg-[#253C7D] rounded" />}
                          </span>
                          Select all ({filtered.length})
                        </button>
                        {filtered.length === 0 ? (
                          <p className="px-3 py-4 text-[12px] text-gray-400">No employees found.</p>
                        ) : (
                          filtered.map((emp) => {
                            const checked = enrollEmployeeIds.includes(emp.id);
                            return (
                              <label
                                key={emp.id}
                                onMouseDown={(e) => e.preventDefault()}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${checked ? "bg-[#253C7D]/5" : "hover:bg-gray-50"}`}
                              >
                                <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                  checked ? "bg-[#253C7D] border-[#253C7D]" : "border-gray-300 bg-white"
                                }`}>
                                  {checked && <i className="ri-check-line text-white text-xs" />}
                                </span>
                                <input type="checkbox" className="sr-only" checked={checked} onChange={() => {
                                  setEnrollEmployeeIds((prev) => prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]);
                                }} />
                                <span className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {`${emp.first_name[0] || ''}${emp.last_name[0] || ''}`.toUpperCase()}
                                </span>
                                <span className="flex-1 min-w-0">
                                  <span className="block text-[13px] font-medium text-gray-900">{emp.first_name} {emp.last_name}</span>
                                  <span className="block text-[11px] text-gray-400 truncate">{emp.role}</span>
                                </span>
                                {checked && <i className="ri-check-line text-[#253C7D] text-sm shrink-0" />}
                              </label>
                            );
                          })
                        )}
                      </div>
                    );
                  })()}
                </div>
                {enrollEmployeeIds.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-gray-400">{enrollEmployeeIds.length} employee{enrollEmployeeIds.length === 1 ? '' : 's'} selected</p>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Benefit Plan</label>
                <select
                  required
                  value={enrollForm.plan_id}
                  onChange={(e) => setEnrollForm({ ...enrollForm, plan_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D] bg-white"
                >
                  <option value="">Select plan</option>
                  {plans.filter((p) => p.status === "active").map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} ({plan.type})</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={enrollEmployeeIds.length === 0} className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] disabled:opacity-50">
                {enrollEmployeeIds.length > 1 ? `Enroll ${enrollEmployeeIds.length} Employees` : "Enroll"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}