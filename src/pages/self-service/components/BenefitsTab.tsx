import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Enrollment {
  id: string;
  status: string;
  created_at: string;
  benefit_plans: {
    name: string;
    type: string;
    provider: string;
    description: string;
    coverage_amount: number;
    employee_contribution: number;
  } | null;
}

interface Props {
  employeeId: string;
}

const TYPE_ICON: Record<string, string> = {
  health: "ri-heart-pulse-line",
  dental: "ri-tooth-line",
  retirement: "ri-safe-line",
  wellness: "ri-mental-health-line",
  commuter: "ri-bus-line",
  parental: "ri-parent-line",
};

const TYPE_COLOR: Record<string, string> = {
  health: "bg-red-50 text-red-600",
  dental: "bg-sky-50 text-sky-600",
  retirement: "bg-emerald-50 text-emerald-600",
  wellness: "bg-violet-50 text-violet-600",
  commuter: "bg-amber-50 text-amber-600",
  parental: "bg-pink-50 text-pink-600",
};

export default function BenefitsTab({ employeeId }: Props) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = async () => {
    if (!employeeId) return;
    setLoading(true);
    const [{ data: enr }, { data: plans }] = await Promise.all([
      supabase.from("benefit_enrollments").select("*, benefit_plans(name, type, provider, description, coverage_amount, employee_contribution)").eq("employee_id", employeeId),
      supabase.from("benefit_plans").select("*").eq("status", "active"),
    ]);
    setEnrollments(enr || []);
    setAllPlans(plans || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [employeeId]);

  const enrolledPlanIds = new Set(enrollments.map((e) => e.benefit_plans ? allPlans.find((p) => p.name === e.benefit_plans!.name)?.id : null).filter(Boolean));
  const availablePlans = allPlans.filter((p) => !enrolledPlanIds.has(p.id));

  const handleEnroll = async () => {
    if (!selectedPlan) return;
    setEnrolling(true);
    const { error } = await supabase.from("benefit_enrollments").insert({ employee_id: employeeId, plan_id: selectedPlan, status: "active" });
    setEnrolling(false);
    if (error) { setToast("Enrollment failed. Please try again."); setTimeout(() => setToast(null), 3000); return; }
    setToast("Successfully enrolled in plan!");
    setTimeout(() => setToast(null), 3000);
    setShowEnrollModal(false);
    setSelectedPlan("");
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg">{toast}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{enrollments.length} Active Enrollment{enrollments.length !== 1 ? "s" : ""}</p>
          <p className="text-xs text-gray-500">{availablePlans.length} plans available to enroll</p>
        </div>
        {availablePlans.length > 0 && (
          <button
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D7377] text-white rounded-xl text-sm hover:bg-[#0a5f63] transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line" />
            Enroll in Plan
          </button>
        )}
      </div>

      {/* Enrolled Plans */}
      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-xl text-gray-400">
          <i className="ri-heart-pulse-line text-3xl mb-2" />
          <p className="text-sm">Not enrolled in any benefit plans yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enrollments.map((e) => {
            const plan = e.benefit_plans;
            if (!plan) return null;
            const type = plan.type || "health";
            return (
              <div key={e.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${TYPE_COLOR[type] || "bg-gray-100 text-gray-500"}`}>
                    <i className={`${TYPE_ICON[type] || "ri-shield-check-line"} text-lg`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900 leading-tight">{plan.name}</p>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize">{e.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{plan.provider}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {plan.coverage_amount && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Coverage</p>
                      <p className="text-sm font-bold text-gray-900">${Number(plan.coverage_amount).toLocaleString()}</p>
                    </div>
                  )}
                  {plan.employee_contribution && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Your Contribution</p>
                      <p className="text-sm font-bold text-gray-900">${Number(plan.employee_contribution).toLocaleString()}/mo</p>
                    </div>
                  )}
                </div>
                {plan.description && <p className="text-xs text-gray-500 mt-3 leading-relaxed">{plan.description}</p>}
                <p className="text-[11px] text-gray-400 mt-3">Enrolled {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Enroll in a Benefit Plan</h3>
              <button onClick={() => setShowEnrollModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg cursor-pointer">
                <i className="ri-close-line" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              {availablePlans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${selectedPlan === p.id ? "border-[#0D7377] bg-[#0D7377]/5" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${TYPE_COLOR[p.type] || "bg-gray-100 text-gray-500"}`}>
                    <i className={`${TYPE_ICON[p.type] || "ri-shield-check-line"} text-base`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.provider}</p>
                  </div>
                  {selectedPlan === p.id && <i className="ri-checkbox-circle-fill text-[#0D7377]" />}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEnrollModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={!selectedPlan || enrolling}
                className="flex-1 px-4 py-2 bg-[#0D7377] text-white rounded-xl text-sm hover:bg-[#0a5f63] disabled:opacity-50 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
              >
                {enrolling ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Enroll Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}