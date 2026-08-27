import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import type {
  Employee,
  BenefitPlan,
  Enrollment,
  PlanFormState,
  BenefitTabKey,
  ViewMode,
  ProviderItem,
} from "../types";
import { exportPlansCSV, exportEnrollmentsCSV } from "../exportUtils";

export const INITIAL_PLAN_FORM: PlanFormState = {
  name: "",
  provider: "",
  type: "health",
  coverage_amount: "5000",
  employee_contribution: "25",
  eligible_count: "50",
  status: "active",
  description: "",
};

export function useBenefits() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const canManage = isAdmin || (!!role && role.name !== "Chairman");

  const [tab, setTab] = useState<BenefitTabKey>("plans");
  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Plans Tab
  const [planSearchQuery, setPlanSearchQuery] = useState("");
  const [planTypeFilter, setPlanTypeFilter] = useState("all");
  const [planStatusFilter, setPlanStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

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

  // Create / Edit Plan Form State
  const [planForm, setPlanForm] = useState<PlanFormState>(INITIAL_PLAN_FORM);

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        const empRole = (e.employees?.role || "").toLowerCase();
        const plan = (e.benefit_plans?.name || "").toLowerCase();
        const provider = (e.benefit_plans?.provider || "").toLowerCase();
        if (!name.includes(q) && !empRole.includes(q) && !plan.includes(q) && !provider.includes(q)) return false;
      }
      return true;
    });
  }, [enrollments, enrollPlanFilter, enrollStatusFilter, enrollDeptFilter, enrollSearchQuery]);

  // Providers Directory
  const providersList: ProviderItem[] = useMemo(() => {
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
  const toggleEnrollmentStatus = useCallback(
    async (enrollment: Enrollment) => {
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
    },
    [canManage, actorName, role?.name]
  );

  const handleBatchEnroll = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [enrollEmployeeIds, enrollForm.plan_id, saving, plans, actorName, role?.name, loadData]
  );

  const handleCreatePlan = useCallback(
    async (e: React.FormEvent) => {
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
      setPlanForm(INITIAL_PLAN_FORM);
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
    },
    [planForm, canManage, saving, actorName, role?.name, loadData]
  );

  const openEditPlan = useCallback(
    (plan: BenefitPlan) => {
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
    },
    [canManage]
  );

  const handleSavePlanEdit = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [editingPlan, canManage, saving, planForm, selectedPlan, actorName, role?.name, loadData]
  );

  const handleDeletePlan = useCallback(
    async (plan: BenefitPlan) => {
      if (!canManage) return;
      const enrolledMembersCount = enrollments.filter((e) => e.plan_id === plan.id).length;
      const confirmMsg =
        enrolledMembersCount > 0
          ? `Delete benefit plan "${plan.name}"? This will also remove ${enrolledMembersCount} active employee enrollment${
              enrolledMembersCount > 1 ? "s" : ""
            }.`
          : `Are you sure you want to delete the benefit plan "${plan.name}"?`;

      if (!confirm(confirmMsg)) return;

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
    },
    [canManage, enrollments, selectedPlan, actorName, role?.name, loadData]
  );

  const handleExportCSV = useCallback(() => {
    if (tab === "plans") {
      exportPlansCSV(filteredPlans, enrollments);
    } else {
      exportEnrollmentsCSV(filteredEnrollments);
    }
  }, [tab, filteredPlans, enrollments, filteredEnrollments]);

  const openNewPlanModal = useCallback(() => {
    setPlanForm(INITIAL_PLAN_FORM);
    setPlanModal(true);
  }, []);

  const openEnrollWithPlan = useCallback((planId: string) => {
    setEnrollForm({ plan_id: planId });
    setEnrollModal(true);
  }, []);

  return {
    canManage,
    tab,
    setTab,
    plans,
    enrollments,
    employees,
    loading,
    planSearchQuery,
    setPlanSearchQuery,
    planTypeFilter,
    setPlanTypeFilter,
    planStatusFilter,
    setPlanStatusFilter,
    viewMode,
    setViewMode,
    enrollSearchQuery,
    setEnrollSearchQuery,
    enrollPlanFilter,
    setEnrollPlanFilter,
    enrollStatusFilter,
    setEnrollStatusFilter,
    enrollDeptFilter,
    setEnrollDeptFilter,
    selectedPlan,
    setSelectedPlan,
    enrollModal,
    setEnrollModal,
    planModal,
    setPlanModal,
    editingPlan,
    setEditingPlan,
    saving,
    enrollForm,
    setEnrollForm,
    enrollEmployeeIds,
    setEnrollEmployeeIds,
    planForm,
    setPlanForm,
    activePlans,
    totalEnrolled,
    optedOut,
    totalEligible,
    overallRate,
    departments,
    filteredPlans,
    filteredEnrollments,
    providersList,
    toggleEnrollmentStatus,
    handleBatchEnroll,
    handleCreatePlan,
    openEditPlan,
    handleSavePlanEdit,
    handleDeletePlan,
    handleExportCSV,
    openNewPlanModal,
    openEnrollWithPlan,
  };
}
