import { useState, useCallback } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { BenefitPlan, BenefitTabKey, PlanFormState } from "../types";
import { useBenefitsData } from "./useBenefitsData";
import { useBenefitsMetrics } from "./useBenefitsMetrics";
import { useBenefitsFilters } from "./useBenefitsFilters";
import { useBenefitsMutations } from "./useBenefitsMutations";

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
  const { role, isAdmin } = usePermissions();
  const { isPartnerBranchBlocked, userBranchName, userBranchId } = useBranchScope();

  const canManage =
    (isAdmin || (!!role && !["Employee", "Staff", "Chairman"].includes(role.name))) &&
    !isPartnerBranchBlocked;

  const [tab, setTab] = useState<BenefitTabKey>("plans");
  const [selectedPlan, setSelectedPlan] = useState<BenefitPlan | null>(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BenefitPlan | null>(null);

  const [enrollForm, setEnrollForm] = useState({ plan_id: "" });
  const [enrollEmployeeIds, setEnrollEmployeeIds] = useState<string[]>([]);
  const [planForm, setPlanForm] = useState<PlanFormState>(INITIAL_PLAN_FORM);

  const data = useBenefitsData();
  const metrics = useBenefitsMetrics({
    plans: data.plans,
    enrollments: data.enrollments,
    employees: data.employees,
  });
  const filters = useBenefitsFilters(data.plans, data.enrollments, tab);
  const mutations = useBenefitsMutations({
    canManage,
    loadData: data.loadData,
    setSelectedPlan,
    setEditingPlan,
    setPlanModal,
    setEnrollModal,
    plans: data.plans,
  });

  const openNewPlanModal = useCallback(() => {
    setPlanForm(INITIAL_PLAN_FORM);
    setEditingPlan(null);
    setPlanModal(true);
  }, []);

  const openEditPlan = useCallback((p: BenefitPlan) => {
    setPlanForm({
      name: p.name,
      provider: p.provider,
      type: p.type,
      coverage_amount: String(p.coverage_amount || 0),
      employee_contribution: String(p.employee_contribution || 0),
      eligible_count: String(p.eligible_count || 0),
      status: p.status,
      description: p.description || "",
    });
    setEditingPlan(p);
    setPlanModal(true);
  }, []);

  const openEnrollWithPlan = useCallback((planId: string) => {
    setEnrollForm({ plan_id: planId });
    setEnrollEmployeeIds([]);
    setEnrollModal(true);
  }, []);

  const handleBatchEnrollSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    return mutations.handleBatchEnroll(enrollForm.plan_id, enrollEmployeeIds);
  }, [mutations, enrollForm.plan_id, enrollEmployeeIds]);

  const handleCreatePlanSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    return mutations.handleCreatePlan(planForm);
  }, [mutations, planForm]);

  const handleSavePlanEditSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    return mutations.handleSavePlanEdit(planForm, editingPlan);
  }, [mutations, planForm, editingPlan]);

  return {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    canManage,
    tab,
    setTab,
    data,
    metrics,
    filters,
    mutations,
    selectedPlan,
    setSelectedPlan,
    enrollModal,
    setEnrollModal,
    planModal,
    setPlanModal,
    editingPlan,
    setEditingPlan,
    enrollForm,
    setEnrollForm,
    enrollEmployeeIds,
    setEnrollEmployeeIds,
    planForm,
    setPlanForm,
    openNewPlanModal,
    openEditPlan,
    openEnrollWithPlan,
    handleBatchEnrollSubmit,
    handleCreatePlanSubmit,
    handleSavePlanEditSubmit,
  };
}
