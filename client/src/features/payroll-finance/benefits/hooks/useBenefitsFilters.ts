import { useState, useMemo, useCallback } from "react";
import type { BenefitPlan, Enrollment, BenefitTabKey, ViewMode } from "../types";
import { exportPlansCSV, exportEnrollmentsCSV } from "../exportUtils";

export function useBenefitsFilters(plans: BenefitPlan[], enrollments: Enrollment[], tab: BenefitTabKey) {
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

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (planTypeFilter !== "all" && p.type !== planTypeFilter) return false;
      if (planStatusFilter !== "all" && p.status !== planStatusFilter) return false;
      if (
        planSearchQuery &&
        !p.name.toLowerCase().includes(planSearchQuery.toLowerCase()) &&
        !p.provider.toLowerCase().includes(planSearchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [plans, planTypeFilter, planStatusFilter, planSearchQuery]);

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      if (enrollPlanFilter !== "all" && e.plan_id !== enrollPlanFilter) return false;
      if (enrollStatusFilter !== "all" && e.status !== enrollStatusFilter) return false;
      if (enrollDeptFilter !== "all" && e.employees?.department !== enrollDeptFilter) return false;
      if (enrollSearchQuery) {
        const q = enrollSearchQuery.toLowerCase();
        const empName = `${e.employees?.first_name || ""} ${e.employees?.last_name || ""}`.toLowerCase();
        const roleName = (e.employees?.role || "").toLowerCase();
        const planName = (e.benefit_plans?.name || "").toLowerCase();
        if (!empName.includes(q) && !roleName.includes(q) && !planName.includes(q)) return false;
      }
      return true;
    });
  }, [enrollments, enrollPlanFilter, enrollStatusFilter, enrollDeptFilter, enrollSearchQuery]);

  const handleExportCSV = useCallback(() => {
    if (tab === "plans") exportPlansCSV(filteredPlans, enrollments);
    else exportEnrollmentsCSV(filteredEnrollments);
  }, [tab, filteredPlans, filteredEnrollments, enrollments]);

  return {
    planSearchQuery, setPlanSearchQuery,
    planTypeFilter, setPlanTypeFilter,
    planStatusFilter, setPlanStatusFilter,
    viewMode, setViewMode,
    enrollSearchQuery, setEnrollSearchQuery,
    enrollPlanFilter, setEnrollPlanFilter,
    enrollStatusFilter, setEnrollStatusFilter,
    enrollDeptFilter, setEnrollDeptFilter,
    filteredPlans,
    filteredEnrollments,
    handleExportCSV,
  };
}
