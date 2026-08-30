import { useMemo } from "react";
import type {
  BenefitEnrollment,
  BenefitPlan,
  Candidate,
  Employee,
  ExpenseRecord,
  ITAsset,
  ITTicket,
  JobPosting,
  LeaveRequest,
  OffboardingRequest,
  PayrollRecord,
} from "../types";
import {
  calculateAvgTenure,
  calculateLeaveStats,
  calculateSalaryByDept,
  calculateExpenseStats,
  calculateITStats,
} from "./analyticsCalculators";

interface UseAnalyticsAggregationsProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  payroll: PayrollRecord[];
  jobs: JobPosting[];
  candidates: Candidate[];
  offboarding: OffboardingRequest[];
  expenses: ExpenseRecord[];
  itAssets: ITAsset[];
  itTickets: ITTicket[];
  benefitEnrollments: BenefitEnrollment[];
  benefitPlans: BenefitPlan[];
  department: string;
}

export function useAnalyticsAggregations({
  employees,
  leaveRequests,
  payroll,
  jobs,
  candidates,
  offboarding,
  expenses,
  itAssets,
  itTickets,
  benefitEnrollments,
  benefitPlans,
  department,
}: UseAnalyticsAggregationsProps) {
  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department))).sort(), [employees]);
  const filteredEmps = useMemo(() => (department === "all" ? employees : employees.filter((e) => e.department === department)), [employees, department]);
  const empMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const totalEmployees = employees.length;
  const activeEmployees = useMemo(() => employees.filter((e) => e.status === "active").length, [employees]);
  const avgTenure = useMemo(() => calculateAvgTenure(employees), [employees]);

  const deptDistribution = useMemo(() => {
    const c: Record<string, number> = {};
    filteredEmps.forEach((e) => { c[e.department] = (c[e.department] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [filteredEmps]);

  const statusBreakdown = useMemo(() => {
    const c: Record<string, number> = {};
    filteredEmps.forEach((e) => { c[e.status] = (c[e.status] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name: name.replace("_", " "), value }));
  }, [filteredEmps]);

  const { leaveByType, leaveByDept } = useMemo(() => calculateLeaveStats(leaveRequests, empMap), [leaveRequests, empMap]);
  const salaryByDept = useMemo(() => calculateSalaryByDept(payroll, empMap), [payroll, empMap]);

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

  const { expenseByCategory, expenseByStatus } = useMemo(() => calculateExpenseStats(expenses), [expenses]);
  const { itAssetsByType, itAssetsByStatus, ticketsByPriority, ticketsByStatus } = useMemo(() => calculateITStats(itAssets, itTickets), [itAssets, itTickets]);

  const benefitEnrollmentByPlan = useMemo(() => {
    return benefitPlans.map((plan) => ({
      name: plan.name,
      enrolled: benefitEnrollments.filter((e) => e.plan_id === plan.id && e.status === "active").length,
      total: employees.length,
    }));
  }, [benefitPlans, benefitEnrollments, employees.length]);

  return {
    departments,
    filteredEmps,
    empMap,
    totalEmployees,
    activeEmployees,
    avgTenure,
    deptDistribution,
    statusBreakdown,
    leaveByType,
    leaveByDept,
    salaryByDept,
    hiringByDept,
    offboardingByReason,
    offboardingByStatus,
    expenseByCategory,
    expenseByStatus,
    itAssetsByType,
    itAssetsByStatus,
    ticketsByPriority,
    ticketsByStatus,
    benefitEnrollmentByPlan,
    totalExpense: useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]),
    paidExpense: useMemo(() => expenses.filter((e) => e.status === "paid").reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]),
    openTickets: useMemo(() => itTickets.filter((t) => t.status === "open").length, [itTickets]),
    assignedAssets: useMemo(() => itAssets.filter((a) => a.assigned_to).length, [itAssets]),
  };
}
