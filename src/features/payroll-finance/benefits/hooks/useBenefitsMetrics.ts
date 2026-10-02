import { useMemo } from "react";
import type { BenefitPlan, Employee, Enrollment, ProviderItem } from "../types";

interface UseBenefitsMetricsProps {
  plans: BenefitPlan[];
  enrollments: Enrollment[];
  employees: Employee[];
}

export function useBenefitsMetrics({ plans, enrollments, employees }: UseBenefitsMetricsProps) {
  const activePlans = useMemo(() => plans.filter((p) => p.status === "active").length, [plans]);
  const totalEnrolled = useMemo(() => enrollments.filter((e) => e.status === "enrolled").length, [enrollments]);
  const optedOut = useMemo(() => enrollments.filter((e) => e.status === "opted_out").length, [enrollments]);
  const totalEligible = useMemo(() => plans.reduce((s, p) => s + (p.eligible_count || 0), 0), [plans]);
  const overallRate = totalEligible > 0 ? ((totalEnrolled / totalEligible) * 100).toFixed(1) : "0.0";

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => emp.department && set.add(emp.department));
    return ["All Departments", ...Array.from(set).sort()];
  }, [employees]);

  const providersList = useMemo(() => {
    const map = new Map<string, ProviderItem>();
    plans.forEach((p) => {
      const existing = map.get(p.provider);
      const enrCount = enrollments.filter((e) => e.plan_id === p.id && e.status === "enrolled").length;
      if (existing) {
        existing.planCount += 1;
        existing.totalEnrolled += enrCount;
        existing.plans.push(p);
      } else {
        map.set(p.provider, {
          provider: p.provider,
          name: p.provider,
          planCount: 1,
          totalEnrolled: enrCount,
          plans: [p],
        });
      }
    });
    return Array.from(map.values());
  }, [plans, enrollments]);

  return {
    activePlans,
    totalEnrolled,
    optedOut,
    totalEligible,
    overallRate,
    departments,
    providersList,
  };
}
