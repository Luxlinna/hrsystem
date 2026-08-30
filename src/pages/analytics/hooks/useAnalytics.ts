import { useState } from "react";
import type { AnalyticsTabKey } from "../types";
import { useAnalyticsData } from "./useAnalyticsData";
import { useAnalyticsAggregations } from "./useAnalyticsAggregations";
import { useAnalyticsExport } from "./useAnalyticsExport";

export function useAnalytics() {
  const [activeTab, setActiveTab] = useState<AnalyticsTabKey>("overview");
  const [department, setDepartment] = useState("all");

  const data = useAnalyticsData();

  const aggregations = useAnalyticsAggregations({
    employees: data.employees,
    leaveRequests: data.leaveRequests,
    payroll: data.payroll,
    jobs: data.jobs,
    candidates: data.candidates,
    offboarding: data.offboarding,
    expenses: data.expenses,
    itAssets: data.itAssets,
    itTickets: data.itTickets,
    benefitEnrollments: data.benefitEnrollments,
    benefitPlans: data.benefitPlans,
    department,
  });

  const exporter = useAnalyticsExport({
    activeTab,
    deptDistribution: aggregations.deptDistribution,
    expenseByCategory: aggregations.expenseByCategory,
    itAssetsByType: aggregations.itAssetsByType,
  });

  return {
    activeTab,
    setActiveTab,
    department,
    setDepartment,
    data,
    aggregations,
    exporter,
  };
}
