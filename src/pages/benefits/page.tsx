import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department?: string;
  role?: string;
  avatar_url?: string | null;
}

interface BenefitPlan {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: string;
  eligible_count: number;
  description?: string | null;
  coverage_amount?: number | null;
  employee_contribution?: number | null;
  created_at: string;
}

interface Enrollment {
  id: string;
  plan_id: string;
  employee_id: string;
  status: "enrolled" | "opted_out" | string;
  created_at?: string;
  employees?: {
    id?: string;
    first_name: string;
    last_name: string;
    department?: string;
    role?: string;
    avatar_url?: string | null;
  } | null;
  benefit_plans?: {
    id?: string;
    name: string;
    type: string;
    provider?: string;
    coverage_amount?: number | null;
    employee_contribution?: number | null;
  } | null;
}

const PLAN_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  health: { label: "Medical Health", icon: "ri-heart-pulse-line", color: "text-rose-600", bg: "bg-rose-50" },
  dental: { label: "Dental Care", icon: "ri-empathize-line", color: "text-blue-600", bg: "bg-blue-50" },
  vision: { label: "Vision & Optical", icon: "ri-eye-line", color: "text-indigo-600", bg: "bg-indigo-50" },
  life: { label: "Life Insurance", icon: "ri-shield-star-line", color: "text-amber-600", bg: "bg-amber-50" },
  retirement: { label: "Retirement & 401(k)", icon: "ri-safe-2-line", color: "text-emerald-600", bg: "bg-emerald-50" },
  commuter: { label: "Commuter & Transit", icon: "ri-car-line", color: "text-purple-600", bg: "bg-purple-50" },
  wellness: { label: "Wellness & Gym", icon: "ri-run-line", color: "text-teal-600", bg: "bg-teal-50" },
  other: { label: "Other Perk", icon: "ri-gift-line", color: "text-slate-600", bg: "bg-slate-50" },
};

const initials = (first?: string, last?: string) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

export default function Benefits() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const canManage = isAdmin || (!!role && role.name !== "Chairman");

  const [tab, setTab] = useState<"plans" | "enrollment" | "providers">("plans");
  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Plans Tab
  const [planSearchQuery, setPlanSearchQuery] = useState("");
  const [planTypeFilter, setPlanTypeFilter] = useState("all");
  const [planStatusFilter, setPlanStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Filters for Enrollment Tab
  const [enrollSearchQuery, setEnrollSearchQuery] = useState("");
  const [enrollPlanFilter, setEnrollPlanFilter] = useState("all");
  const [enrollStatusFilter, setEnrollStatusFilter] = useState("all");
  const [enrollDeptFilter, setEnrollDeptFilter] = useState("all");

  // Selected Plan Drawer
  const [selectedPlan, setSelectedPlan] = useState<BenefitPlan | null>(null);

  // Modals
  const [enrollModal, setEnrollModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BenefitPlan | null>(null);
  const [saving, setSaving] = useState(false);

  // Batch Enrollment Form State
  const [enrollForm, setEnrollForm] = useState({ plan_id: "" });
  const [enrollEmployeeIds, setEnrollEmployeeIds] = useState<string[]>([]);
  const [enrollModalSearch, setEnrollModalSearch] = useState("");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const enrollRef = useRef<HTMLDivElement>(null);

  // Create / Edit Plan Form
  const [planForm, setPlanForm] = useState({
    name: "",
    provider: "",
    type: "health",
    coverage_amount: "5000",
    employee_contribution: "25",
    eligible_count: "50",
    status: "active",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: p }, { data: e }, { data: emps }] = await Promise.all([
      supabase.from("benefit_plans").select("*").order("created_at", { ascending: false }),
      supabase
        .from("benefit_enrollments")
        .select("*, employees(id, first_name, last_name, department, role, avatar_url), benefit_plans(id, name, type, provider, coverage_amount, employee_contribution)")
        .order("created_at", { ascending: false }),
      supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url")
        .is("deleted_at", null)
        .order("first_name"),
    ]);

    setPlans((p as BenefitPlan[]) || []);
    setEnrollments((e as unknown as Enrollment[]) || []);
    setEmployees((emps as Employee[]) || []);
    setLoading(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (enrollRef.current && !enrollRef.current.contains(e.target as Node)) setEnrollOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!enrollModal) {
      setEnrollOpen(false);
      setEnrollModalSearch("");
    }
  }, [enrollModal]);

  // Aggregate Metrics
  const activePlans = useMemo(() => plans.filter((p) => p.status === "active").length, [plans]);
  const totalEnrolled = useMemo(() => enrollments.filter((e) => e.status === "enrolled").length, [enrollments]);
  const optedOut = useMemo(() => enrollments.filter((e) => e.status === "opted_out").length, [enrollments]);
  const totalEligible = useMemo(() => plans.reduce((s, p) => s + (p.eligible_count || 0), 0), [plans]);
  const overallRate = totalEligible > 0 ? ((totalEnrolled / totalEligible) * 100).toFixed(1) : "0.0";

  // Distinct Departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => emp.department && set.add(emp.department));
    return ["All Departments", ...Array.from(set).sort()];
  }, [employees]);

  // Filtered Plans (for Plans Tab)
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (planTypeFilter !== "all" && p.type !== planTypeFilter) return false;
      if (planStatusFilter !== "all" && p.status !== planStatusFilter) return false;
      if (planSearchQuery.trim()) {
        const q = planSearchQuery.toLowerCase().trim();
        const name = (p.name || "").toLowerCase();
        const provider = (p.provider || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        if (!name.includes(q) && !provider.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [plans, planTypeFilter, planStatusFilter, planSearchQuery]);

  // Filtered Enrollments (for Enrollment Tab)
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      if (enrollPlanFilter !== "all" && e.plan_id !== enrollPlanFilter) return false;
      if (enrollStatusFilter !== "all" && e.status !== enrollStatusFilter) return false;
      if (enrollDeptFilter !== "all" && e.employees?.department !== enrollDeptFilter) return false;
      if (enrollSearchQuery.trim()) {
        const q = enrollSearchQuery.toLowerCase().trim();
        const name = `${e.employees?.first_name || ""} ${e.employees?.last_name || ""}`.toLowerCase();
        const role = (e.employees?.role || "").toLowerCase();
        const plan = (e.benefit_plans?.name || "").toLowerCase();
        const provider = (e.benefit_plans?.provider || "").toLowerCase();
        if (!name.includes(q) && !role.includes(q) && !plan.includes(q) && !provider.includes(q)) return false;
      }
      return true;
    });
  }, [enrollments, enrollPlanFilter, enrollStatusFilter, enrollDeptFilter, enrollSearchQuery]);

  // Providers Directory
  const providersList = useMemo(() => {
    const map = new Map<string, { plans: BenefitPlan[]; enrolledCount: number }>();
    plans.forEach((p) => {
      const prov = p.provider || "Company Self-Insured";
      if (!map.has(prov)) {
        map.set(prov, { plans: [], enrolledCount: 0 });
      }
      const item = map.get(prov)!;
      item.plans.push(p);
      const enr = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
      item.enrolledCount += enr;
    });

    return Array.from(map.entries()).map(([provider, data]) => ({
      provider,
      plans: data.plans,
      enrolledCount: data.enrolledCount,
    }));
  }, [plans, enrollments]);

  // --- Actions ---
  const toggleEnrollmentStatus = async (enrollment: Enrollment) => {
    if (!canManage) return;
    const nextStatus = enrollment.status === "enrolled" ? "opted_out" : "enrolled";
    const { error } = await supabase
      .from("benefit_enrollments")
      .update({ status: nextStatus })
      .eq("id", enrollment.id);

    if (error) {
      toast("Error", "Failed to update enrollment status", "error");
      return;
    }

    toast(
      nextStatus === "enrolled" ? "Re-Enrolled" : "Opted Out",
      `${enrollment.employees?.first_name ?? "Employee"} is now ${nextStatus.replace("_", " ")}.`,
      "success"
    );

    logActivity({
      module: "benefits",
      action: "updated",
      entityType: "benefit_enrollment",
      entityId: enrollment.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `${enrollment.employees?.first_name ?? "Employee"} ${
        enrollment.employees?.last_name ?? ""
      } is now ${nextStatus.replace("_", " ")} in ${enrollment.benefit_plans?.name ?? "benefit plan"}`,
    });

    setEnrollments((prev) =>
      prev.map((e) => (e.id === enrollment.id ? { ...e, status: nextStatus } : e))
    );
  };

  const handleBatchEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enrollEmployeeIds.length === 0 || !enrollForm.plan_id || saving) return;
    setSaving(true);

    const plan = plans.find((p) => p.id === enrollForm.plan_id);
    const payload = enrollEmployeeIds.map((empId) => ({
      employee_id: empId,
      plan_id: enrollForm.plan_id,
      status: "enrolled",
    }));

    const { error } = await supabase.from("benefit_enrollments").insert(payload);
    setSaving(false);

    if (error) {
      toast("Error", "Failed to save enrollment batch", "error");
      return;
    }

    setEnrollModal(false);
    setEnrollForm({ plan_id: "" });
    setEnrollEmployeeIds([]);
    toast(
      "Enrollment Saved",
      `${enrollEmployeeIds.length} employee${
        enrollEmployeeIds.length === 1 ? "" : "s"
      } enrolled in ${plan?.name ?? "benefit plan"}`,
      "success"
    );

    logActivity({
      module: "benefits",
      action: "created",
      entityType: "benefit_enrollment",
      actorName,
      actorRole: role?.name || "Unknown",
      description: `${enrollEmployeeIds.length} employee${
        enrollEmployeeIds.length === 1 ? "" : "s"
      } enrolled in ${plan?.name ?? "a benefit plan"}`,
    });
    loadData();
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name || !planForm.provider || !canManage || saving) return;
    setSaving(true);

    const { error } = await supabase.from("benefit_plans").insert([
      {
        name: planForm.name,
        provider: planForm.provider,
        type: planForm.type,
        coverage_amount: Number(planForm.coverage_amount || 0),
        employee_contribution: Number(planForm.employee_contribution || 0),
        eligible_count: Number(planForm.eligible_count || 50),
        description: planForm.description || null,
        status: planForm.status || "active",
      },
    ]);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to create benefit plan", "error");
      return;
    }

    setPlanModal(false);
    setPlanForm({
      name: "",
      provider: "",
      type: "health",
      coverage_amount: "5000",
      employee_contribution: "25",
      eligible_count: "50",
      status: "active",
      description: "",
    });
    toast("Plan Created", "New benefit plan registered successfully.", "success");
    logActivity({
      module: "benefits",
      action: "created",
      entityType: "benefit_plan",
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Registered new benefit plan "${planForm.name}" (${planForm.provider})`,
    });
    loadData();
  };

  // Open Edit Modal
  const openEditPlan = (plan: BenefitPlan) => {
    if (!canManage) return;
    setPlanForm({
      name: plan.name,
      provider: plan.provider,
      type: plan.type,
      coverage_amount: String(plan.coverage_amount || 0),
      employee_contribution: String(plan.employee_contribution || 0),
      eligible_count: String(plan.eligible_count || 50),
      status: plan.status || "active",
      description: plan.description || "",
    });
    setEditingPlan(plan);
  };

  // Save Edit Plan
  const handleSavePlanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !canManage || saving) return;
    setSaving(true);

    const { error } = await supabase
      .from("benefit_plans")
      .update({
        name: planForm.name,
        provider: planForm.provider,
        type: planForm.type,
        coverage_amount: Number(planForm.coverage_amount || 0),
        employee_contribution: Number(planForm.employee_contribution || 0),
        eligible_count: Number(planForm.eligible_count || 50),
        status: planForm.status,
        description: planForm.description || null,
      })
      .eq("id", editingPlan.id);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to update benefit plan", "error");
      return;
    }

    setEditingPlan(null);
    toast("Plan Updated", `"${planForm.name}" details updated successfully.`, "success");
    logActivity({
      module: "benefits",
      action: "updated",
      entityType: "benefit_plan",
      entityId: editingPlan.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Updated benefit plan "${planForm.name}" (${planForm.provider})`,
    });

    if (selectedPlan && selectedPlan.id === editingPlan.id) {
      setSelectedPlan({
        ...selectedPlan,
        name: planForm.name,
        provider: planForm.provider,
        type: planForm.type,
        coverage_amount: Number(planForm.coverage_amount || 0),
        employee_contribution: Number(planForm.employee_contribution || 0),
        eligible_count: Number(planForm.eligible_count || 50),
        status: planForm.status,
        description: planForm.description,
      });
    }
    loadData();
  };

  // Delete Plan
  const handleDeletePlan = async (plan: BenefitPlan) => {
    if (!canManage) return;
    const enrolledMembersCount = enrollments.filter((e) => e.plan_id === plan.id).length;
    const confirmMsg =
      enrolledMembersCount > 0
        ? `Delete benefit plan "${plan.name}"? This will also remove ${enrolledMembersCount} active employee enrollment${
            enrolledMembersCount > 1 ? "s" : ""
          }.`
        : `Are you sure you want to delete the benefit plan "${plan.name}"?`;

    if (!confirm(confirmMsg)) return;

    // Remove foreign key enrollments first
    await supabase.from("benefit_enrollments").delete().eq("plan_id", plan.id);
    const { error } = await supabase.from("benefit_plans").delete().eq("id", plan.id);

    if (error) {
      toast("Error", "Failed to delete benefit plan", "error");
      return;
    }

    toast("Plan Deleted", `"${plan.name}" has been removed from catalog.`, "success");
    logActivity({
      module: "benefits",
      action: "deleted",
      entityType: "benefit_plan",
      entityId: plan.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Deleted benefit plan "${plan.name}" (${plan.provider})`,
    });

    if (selectedPlan && selectedPlan.id === plan.id) {
      setSelectedPlan(null);
    }
    loadData();
  };

  const handleExportCSV = () => {
    if (tab === "plans") {
      const headers = ["Plan Name", "Provider", "Type", "Status", "Coverage Amount", "Employee Contribution", "Eligible Count", "Enrolled Count"];
      const rows = filteredPlans.map((p) => {
        const enr = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
        return [
          `"${p.name}"`,
          `"${p.provider}"`,
          `"${p.type}"`,
          `"${p.status}"`,
          p.coverage_amount || 0,
          p.employee_contribution || 0,
          p.eligible_count || 0,
          enr,
        ];
      });
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const uri = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", uri);
      link.setAttribute("download", `benefit_plans_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("Export Complete", `Exported ${filteredPlans.length} benefit plans.`, "success");
    } else {
      const headers = ["Employee", "Department", "Role", "Benefit Plan", "Provider", "Status", "Enrolled Date"];
      const rows = filteredEnrollments.map((e) => [
        `"${e.employees ? `${e.employees.first_name} ${e.employees.last_name}` : "—"}"`,
        `"${e.employees?.department || ""}"`,
        `"${e.employees?.role || ""}"`,
        `"${e.benefit_plans?.name || ""}"`,
        `"${e.benefit_plans?.provider || ""}"`,
        `"${e.status}"`,
        `"${e.created_at || ""}"`,
      ]);
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const uri = encodeURI(csv);
      const link = document.createElement("a");
      link.setAttribute("href", uri);
      link.setAttribute("download", `benefit_enrollments_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("Export Complete", `Exported ${filteredEnrollments.length} enrollments.`, "success");
    }
  };

  if (loading && plans.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading benefits administration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Compensation & Perks</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Benefits Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Employee Benefits Hub
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              Healthcare & Perks
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage company health insurance plans, edit benefit programs, track employee coverage, and administer enrollment.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
            Export CSV
          </button>

          {canManage && (
            <button
              onClick={() => {
                setPlanForm({
                  name: "",
                  provider: "",
                  type: "health",
                  coverage_amount: "5000",
                  employee_contribution: "25",
                  eligible_count: "50",
                  status: "active",
                  description: "",
                });
                setPlanModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <i className="ri-add-line text-sm" />
              New Plan
            </button>
          )}

          <button
            onClick={() => setEnrollModal(true)}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-user-add-line text-base font-bold" />
            Enroll Employees
          </button>
        </div>
      </div>

      {/* Executive Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* Active Benefit Plans */}
        <div
          onClick={() => {
            setTab("plans");
            setPlanStatusFilter("all");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "plans" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active Plans</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-heart-pulse-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] mt-2">{activePlans}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{providersList.length} Insurance Providers</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>

        {/* Total Active Enrollments */}
        <div
          onClick={() => {
            setTab("enrollment");
            setEnrollStatusFilter("enrolled");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "enrollment" && enrollStatusFilter === "enrolled"
              ? "border-emerald-500 ring-2 ring-emerald-500/10"
              : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Enrolled</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalEnrolled}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{overallRate}% Overall Participation</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Opted Out Rate */}
        <div
          onClick={() => {
            setTab("enrollment");
            setEnrollStatusFilter("opted_out");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "enrollment" && enrollStatusFilter === "opted_out"
              ? "border-slate-500 ring-2 ring-slate-500/10"
              : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Opted Out</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <i className="ri-user-unfollow-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 mt-2">{optedOut}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Staff waived coverage</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500" />
        </div>

        {/* Total Eligible Capacity */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Total Capacity</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <i className="ri-team-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{totalEligible}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Eligible seats across plans</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-2.5 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTab("plans")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tab === "plans"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <i className="ri-heart-pulse-line text-sm" />
            <span>Benefit Plans Catalog</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "plans" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {plans.length}
            </span>
          </button>

          <button
            onClick={() => setTab("enrollment")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tab === "enrollment"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <i className="ri-user-star-line text-sm" />
            <span>Employee Enrollment Roster</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "enrollment" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {enrollments.length}
            </span>
          </button>

          <button
            onClick={() => setTab("providers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tab === "providers"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <i className="ri-building-line text-sm" />
            <span>Insurance Providers</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "providers" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {providersList.length}
            </span>
          </button>
        </div>

        {/* View Toggle on Plans */}
        {tab === "plans" && (
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 self-start md:self-auto">
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-table-line" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              title="Cards View"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-layout-grid-fill" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. BENEFIT PLANS MATRIX TAB                                               */}
      {/* ========================================================================= */}
      {tab === "plans" && (
        <div className="space-y-6">
          {/* Quick Filters Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="relative w-full sm:w-64">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={planSearchQuery}
                onChange={(e) => setPlanSearchQuery(e.target.value)}
                placeholder="Search plan name, provider..."
                className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
              />
              {planSearchQuery && (
                <button
                  onClick={() => setPlanSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-circle-fill text-xs" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <select
                value={planTypeFilter}
                onChange={(e) => setPlanTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
              >
                <option value="all">All Benefit Types</option>
                {Object.keys(PLAN_TYPE_CONFIG).map((t) => (
                  <option key={t} value={t}>
                    {PLAN_TYPE_CONFIG[t].label}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={planStatusFilter}
                onChange={(e) => setPlanStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Plans</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Reset */}
              {(planSearchQuery || planTypeFilter !== "all" || planStatusFilter !== "all") && (
                <button
                  onClick={() => {
                    setPlanSearchQuery("");
                    setPlanTypeFilter("all");
                    setPlanStatusFilter("all");
                  }}
                  title="Reset Filters"
                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <i className="ri-refresh-line text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Plans Display */}
          {filteredPlans.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                <i className="ri-heart-pulse-line" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Benefit Plans Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No benefit programs match your selected search criteria.
              </p>
              {canManage && (
                <button
                  onClick={() => {
                    setPlanForm({
                      name: "",
                      provider: "",
                      type: "health",
                      coverage_amount: "5000",
                      employee_contribution: "25",
                      eligible_count: "50",
                      status: "active",
                      description: "",
                    });
                    setPlanModal(true);
                  }}
                  className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
                >
                  + Create Benefit Plan
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Benefit Plan</th>
                      <th className="px-5 py-3.5">Provider</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Coverage Value</th>
                      <th className="px-5 py-3.5">Employee / Mo</th>
                      <th className="px-5 py-3.5">Participation Rate</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPlans.map((p) => {
                      const typeCfg = PLAN_TYPE_CONFIG[p.type] || PLAN_TYPE_CONFIG.other;
                      const enrolledCount = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
                      const rate = p.eligible_count > 0 ? ((enrolledCount / p.eligible_count) * 100).toFixed(1) : "0.0";

                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPlan(p)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl ${typeCfg.bg} ${typeCfg.color} flex items-center justify-center text-base font-bold shrink-0 shadow-2xs`}
                              >
                                <i className={typeCfg.icon} />
                              </div>
                              <div>
                                <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm">
                                  {p.name}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate max-w-xs">{p.description || p.provider}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                              {p.provider || "Internal"}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-600 capitalize">
                            {typeCfg.label}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-black text-gray-900">
                            ${Number(p.coverage_amount || 0).toLocaleString()}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-700">
                            ${Number(p.employee_contribution || 0).toLocaleString()}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#253C7D] rounded-full transition-all"
                                  style={{ width: `${Math.min(100, Number(rate))}%` }}
                                />
                              </div>
                              <span className="font-black text-gray-900 text-xs">
                                {enrolledCount}/{p.eligible_count} ({rate}%)
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                p.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              ● {p.status}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setEnrollForm({ plan_id: p.id });
                                  setEnrollModal(true);
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer"
                              >
                                + Enroll
                              </button>

                              {canManage && (
                                <>
                                  <button
                                    onClick={() => openEditPlan(p)}
                                    className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Plan"
                                  >
                                    <i className="ri-edit-line text-sm" />
                                  </button>

                                  <button
                                    onClick={() => handleDeletePlan(p)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Plan"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((p) => {
                const typeCfg = PLAN_TYPE_CONFIG[p.type] || PLAN_TYPE_CONFIG.other;
                const enrolledCount = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
                const rate = p.eligible_count > 0 ? ((enrolledCount / p.eligible_count) * 100).toFixed(1) : "0.0";

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-2xl ${typeCfg.bg} ${typeCfg.color} flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs`}
                          >
                            <i className={typeCfg.icon} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate text-sm">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-gray-400 truncate">{p.provider || "Internal Plan"}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                            p.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>

                      {p.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 mb-3">
                          {p.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-slate-50 p-2.5 rounded-xl">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Coverage Limit</span>
                          <span className="font-black text-gray-900">${Number(p.coverage_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Employee / Mo</span>
                          <span className="font-black text-[#253C7D]">${Number(p.employee_contribution || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 text-[11px]">Enrolled Staff</span>
                          <span className="font-bold text-gray-800">
                            {enrolledCount} / {p.eligible_count} ({rate}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#253C7D] rounded-full transition-all"
                            style={{ width: `${Math.min(100, Number(rate))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEnrollForm({ plan_id: p.id });
                          setEnrollModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        + Enroll Staff
                      </button>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {canManage && (
                          <>
                            <button
                              onClick={() => openEditPlan(p)}
                              className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                              title="Edit Plan"
                            >
                              <i className="ri-edit-line text-sm" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(p)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Plan"
                            >
                              <i className="ri-delete-bin-line text-sm" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EMPLOYEE ENROLLMENT ROSTER TAB                                         */}
      {/* ========================================================================= */}
      {tab === "enrollment" && (
        <div className="space-y-6">
          {/* Enrollment Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
            <div className="relative w-full sm:w-64">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={enrollSearchQuery}
                onChange={(e) => setEnrollSearchQuery(e.target.value)}
                placeholder="Search staff, role, plan..."
                className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
              />
              {enrollSearchQuery && (
                <button
                  onClick={() => setEnrollSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-circle-fill text-xs" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Plan Filter */}
              <select
                value={enrollPlanFilter}
                onChange={(e) => setEnrollPlanFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold max-w-[150px] truncate"
              >
                <option value="all">All Benefit Plans</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={enrollStatusFilter}
                onChange={(e) => setEnrollStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="enrolled">Enrolled Active</option>
                <option value="opted_out">Opted Out</option>
              </select>

              {/* Department Filter */}
              <select
                value={enrollDeptFilter}
                onChange={(e) => setEnrollDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate font-medium"
              >
                {departments.map((d) => (
                  <option key={d} value={d === "All Departments" ? "all" : d}>
                    {d}
                  </option>
                ))}
              </select>

              {/* Reset */}
              {(enrollSearchQuery || enrollPlanFilter !== "all" || enrollStatusFilter !== "all" || enrollDeptFilter !== "all") && (
                <button
                  onClick={() => {
                    setEnrollSearchQuery("");
                    setEnrollPlanFilter("all");
                    setEnrollStatusFilter("all");
                    setEnrollDeptFilter("all");
                  }}
                  title="Reset Filters"
                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <i className="ri-refresh-line text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Enrollments Table */}
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                <i className="ri-user-unfollow-line" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Enrollment Records Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No staff members match the selected filters or search query.
              </p>
              <button
                onClick={() => setEnrollModal(true)}
                className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
              >
                + Enroll Staff Member
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Employee Name</th>
                      <th className="px-5 py-3.5">Department / Role</th>
                      <th className="px-5 py-3.5">Benefit Plan</th>
                      <th className="px-5 py-3.5">Provider</th>
                      <th className="px-5 py-3.5">Employee Contrib</th>
                      <th className="px-5 py-3.5">Enrollment Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEnrollments.map((e) => {
                      const emp = e.employees;
                      const plan = e.benefit_plans;

                      return (
                        <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <Link
                              to={`/employees/${e.employee_id}`}
                              className="flex items-center gap-3 group cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                                {emp?.avatar_url ? (
                                  <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span>{initials(emp?.first_name, emp?.last_name)}</span>
                                )}
                              </div>
                              <div>
                                <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                                  {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                                </p>
                              </div>
                            </Link>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                              {emp?.department || "General"}
                            </span>
                            <span className="text-[11px] text-gray-400 ml-2">{emp?.role || "Staff"}</span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                            {plan?.name || "—"}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-600">
                            {plan?.provider || "Forte"}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-bold text-[#253C7D]">
                            ${Number(plan?.employee_contribution || 0).toLocaleString()}/mo
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                e.status === "enrolled"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              ● {e.status.replace("_", " ")}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            {canManage && (
                              <button
                                onClick={() => toggleEnrollmentStatus(e)}
                                title={e.status === "enrolled" ? "Click to opt-out" : "Click to re-enroll"}
                                className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                  e.status === "enrolled"
                                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                }`}
                              >
                                {e.status === "enrolled" ? "Opt Out" : "Re-Enroll"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INSURANCE & PERK PROVIDERS TAB                                         */}
      {/* ========================================================================= */}
      {tab === "providers" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providersList.map(({ provider, plans: provPlans, enrolledCount }) => (
            <div
              key={provider}
              className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-2xl font-bold shrink-0">
                    <i className="ri-building-line" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-base">
                      {provider}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {provPlans.length} Active Plan{provPlans.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl mb-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Enrolled Members:</span>
                    <span className="font-black text-[#253C7D]">{enrolledCount} Staff</span>
                  </div>
                </div>

                {/* Plan chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Underwritten Programs:
                  </span>
                  {provPlans.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-gray-800">{p.name}</span>
                      <span className="text-gray-400 font-semibold">${p.coverage_amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: BENEFIT PLAN DETAILS & ENROLLED ROSTER                            */}
      {/* ========================================================================= */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedPlan(null)}
          />
          <div className="relative w-full sm:w-[500px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">{selectedPlan.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedPlan.provider} · {selectedPlan.type}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {canManage && (
                    <>
                      <button
                        onClick={() => openEditPlan(selectedPlan)}
                        className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit Plan"
                      >
                        <i className="ri-edit-line text-base" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(selectedPlan)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <i className="ri-delete-bin-line text-base" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                  >
                    <i className="ri-close-line text-lg" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Financial Overview Card */}
                <div className="p-5 bg-gradient-to-r from-[#253C7D] to-[#17254E] rounded-3xl text-white shadow-md">
                  <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider block">
                    Max Annual Coverage Limit
                  </span>
                  <p className="text-3xl font-black text-white mt-1">
                    ${Number(selectedPlan.coverage_amount || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/80">
                    <span>Employee Contrib: ${Number(selectedPlan.employee_contribution || 0).toLocaleString()}/mo</span>
                    <span>·</span>
                    <span>Seats: {selectedPlan.eligible_count}</span>
                  </div>
                </div>

                {selectedPlan.description && (
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Plan Terms & Policy Summary
                    </span>
                    <p className="text-xs text-gray-700 bg-gray-50 rounded-2xl p-3.5 border border-gray-100 leading-relaxed">
                      {selectedPlan.description}
                    </p>
                  </div>
                )}

                {/* Enrolled Staff List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Enrolled Team Members (
                      {enrollments.filter((e) => e.plan_id === selectedPlan.id && e.status === "enrolled").length})
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {enrollments
                      .filter((e) => e.plan_id === selectedPlan.id)
                      .map((e) => {
                        const emp = e.employees;
                        return (
                          <div
                            key={e.id}
                            className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#253C7D] text-white flex items-center justify-center font-bold text-[10px]">
                                {initials(emp?.first_name, emp?.last_name)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {emp?.first_name} {emp?.last_name}
                                </p>
                                <p className="text-[10px] text-gray-400">{emp?.role} · {emp?.department}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => toggleEnrollmentStatus(e)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                                e.status === "enrolled"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              }`}
                            >
                              {e.status.replace("_", " ")}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => {
                  setEnrollForm({ plan_id: selectedPlan.id });
                  setEnrollModal(true);
                }}
                className="flex-1 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                + Enroll Staff
              </button>
              {canManage && (
                <button
                  onClick={() => openEditPlan(selectedPlan)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Edit Plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH MULTI-SELECT ENROLLMENT                                       */}
      {/* ========================================================================= */}
      {enrollModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setEnrollModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className="ri-user-add-line" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Enroll Employees in Benefits</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Select plan and staff participants</p>
                </div>
              </div>

              <button
                onClick={() => setEnrollModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleBatchEnroll} className="space-y-4">
              {/* Plan Selector */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Select Benefit Plan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={enrollForm.plan_id}
                  onChange={(e) => setEnrollForm({ ...enrollForm, plan_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="">Choose a Benefit Plan...</option>
                  {plans
                    .filter((p) => p.status === "active")
                    .map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.provider} · {plan.type})
                      </option>
                    ))}
                </select>
              </div>

              {/* Employee Multi-Select Combobox */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Select Employees <span className="text-rose-500">*</span>
                </label>
                <div className="relative" ref={enrollRef}>
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                    <input
                      type="text"
                      role="combobox"
                      aria-expanded={enrollOpen}
                      value={
                        enrollOpen
                          ? enrollModalSearch
                          : enrollEmployeeIds.length > 0
                          ? `${enrollEmployeeIds.length} employee${enrollEmployeeIds.length === 1 ? "" : "s"} selected`
                          : enrollModalSearch
                      }
                      onChange={(e) => {
                        setEnrollModalSearch(e.target.value);
                        setEnrollOpen(true);
                      }}
                      onFocus={() => setEnrollOpen(true)}
                      placeholder="Search employee by name or role..."
                      className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                    />
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  {enrollOpen && (
                    <div className="absolute z-30 mt-1.5 w-full bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5">
                      {/* Select All */}
                      <button
                        type="button"
                        onClick={() => {
                          const matchingIds = employees
                            .filter((emp) => {
                              const q = enrollModalSearch.trim().toLowerCase();
                              if (!q) return true;
                              return `${emp.first_name} ${emp.last_name} ${emp.role || ""}`.toLowerCase().includes(q);
                            })
                            .map((e) => e.id);

                          const allSelected =
                            matchingIds.length > 0 && matchingIds.every((id) => enrollEmployeeIds.includes(id));
                          setEnrollEmployeeIds(allSelected ? [] : matchingIds);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-[#253C7D] hover:bg-slate-50 border-b border-gray-100 transition-colors cursor-pointer"
                      >
                        <i className="ri-checkbox-multiple-line text-sm" />
                        Select All ({employees.length})
                      </button>

                      {employees
                        .filter((emp) => {
                          const q = enrollModalSearch.trim().toLowerCase();
                          if (!q) return true;
                          return `${emp.first_name} ${emp.last_name} ${emp.role || ""}`.toLowerCase().includes(q);
                        })
                        .map((emp) => {
                          const checked = enrollEmployeeIds.includes(emp.id);
                          return (
                            <label
                              key={emp.id}
                              className={`w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                                checked ? "bg-[#253C7D]/5" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setEnrollEmployeeIds((prev) =>
                                    prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                                  );
                                }}
                                className="rounded text-[#253C7D] focus:ring-[#253C7D]"
                              />
                              <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                                {initials(emp.first_name, emp.last_name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="block text-xs font-bold text-gray-900 truncate">
                                  {emp.first_name} {emp.last_name}
                                </span>
                                <span className="block text-[10px] text-gray-400 truncate">
                                  {emp.role} · {emp.department}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEnrollModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || enrollEmployeeIds.length === 0 || !enrollForm.plan_id}
                  className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving
                    ? "Enrolling..."
                    : enrollEmployeeIds.length > 1
                    ? `Enroll ${enrollEmployeeIds.length} Staff`
                    : "Enroll Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE BENEFIT PLAN                                                */}
      {/* ========================================================================= */}
      {planModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setPlanModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className="ri-heart-pulse-line" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Create Benefit Program</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Register new company health or perk policy</p>
                </div>
              </div>

              <button
                onClick={() => setPlanModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Plan Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Executive Platinum Healthcare Plan"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Provider Organization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={planForm.provider}
                    onChange={(e) => setPlanForm({ ...planForm, provider: e.target.value })}
                    placeholder="e.g. Forte Insurance"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Category Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={planForm.type}
                    onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {Object.keys(PLAN_TYPE_CONFIG).map((t) => (
                      <option key={t} value={t}>
                        {PLAN_TYPE_CONFIG[t].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Coverage Limit ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planForm.coverage_amount}
                    onChange={(e) => setPlanForm({ ...planForm, coverage_amount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Employee ($/mo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planForm.employee_contribution}
                    onChange={(e) => setPlanForm({ ...planForm, employee_contribution: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Eligible Seats
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={planForm.eligible_count}
                    onChange={(e) => setPlanForm({ ...planForm, eligible_count: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Plan Description & Coverage Scope
                </label>
                <textarea
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Inpatient, outpatient, deductible, or special network terms..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPlanModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !planForm.name || !planForm.provider}
                  className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT BENEFIT PLAN                                                  */}
      {/* ========================================================================= */}
      {editingPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setEditingPlan(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className="ri-edit-line" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Edit Benefit Program</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Modify policy terms, rates, and coverage limits</p>
                </div>
              </div>

              <button
                onClick={() => setEditingPlan(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSavePlanEdit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Plan Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Provider Organization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={planForm.provider}
                    onChange={(e) => setPlanForm({ ...planForm, provider: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Category Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={planForm.type}
                    onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {Object.keys(PLAN_TYPE_CONFIG).map((t) => (
                      <option key={t} value={t}>
                        {PLAN_TYPE_CONFIG[t].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Coverage Limit ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planForm.coverage_amount}
                    onChange={(e) => setPlanForm({ ...planForm, coverage_amount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Employee ($/mo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={planForm.employee_contribution}
                    onChange={(e) => setPlanForm({ ...planForm, employee_contribution: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Eligible Seats
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={planForm.eligible_count}
                    onChange={(e) => setPlanForm({ ...planForm, eligible_count: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Plan Status
                </label>
                <select
                  value={planForm.status}
                  onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="active">Active Plan</option>
                  <option value="inactive">Inactive / Suspended</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Plan Description & Coverage Scope
                </label>
                <textarea
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}