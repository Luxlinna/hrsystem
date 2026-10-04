import { useMemo } from "react";
import type {
  PayrollRecord,
  Employee,
  PayrollStats,
  CompensationChartItem,
  DeptDistributionItem,
} from "../types";
import { getDeptColors } from "../payrollUtils";

export function usePayrollCalculations(
  allRecords: PayrollRecord[],
  employees: Employee[],
  filteredRecords: PayrollRecord[],
  currentMonthStr: string,
  isDark: boolean
) {
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.month) set.add(r.month);
    });
    set.add(currentMonthStr);
    return Array.from(set).sort().reverse();
  }, [allRecords, currentMonthStr]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.employees?.department) set.add(r.employees.department);
    });
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [allRecords, employees]);

  const totalBase = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + Number(r.base_salary || 0), 0),
    [filteredRecords]
  );
  const totalBonus = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + Number(r.bonus || 0), 0),
    [filteredRecords]
  );
  const totalDeductions = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + Number(r.deductions || 0), 0),
    [filteredRecords]
  );
  const totalNet = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + Number(r.net_pay || 0), 0),
    [filteredRecords]
  );
  const employeeCount = filteredRecords.length;
  const avgNetPay = employeeCount > 0 ? Math.round(totalNet / employeeCount) : 0;
  const pendingCount = useMemo(
    () => filteredRecords.filter((r) => r.status === "pending").length,
    [filteredRecords]
  );

  const stats: PayrollStats = {
    totalBase,
    totalBonus,
    totalDeductions,
    totalNet,
    employeeCount,
    avgNetPay,
    pendingCount,
  };

  const chartData: CompensationChartItem[] = useMemo(() => {
    return filteredRecords.slice(0, 15).map((p) => ({
      name: p.employees ? `${p.employees.first_name} ${p.employees.last_name[0]}.` : "—",
      base: +(p.base_salary / 1000).toFixed(1),
      bonus: +(p.bonus / 1000).toFixed(1),
      deductions: +(p.deductions / 1000).toFixed(1),
      net: +(p.net_pay / 1000).toFixed(1),
    }));
  }, [filteredRecords]);

  const deptDistributionData: DeptDistributionItem[] = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const d = r.employees?.department || "General";
      counts[d] = (counts[d] || 0) + Number(r.net_pay || 0);
    });
    const colors = getDeptColors(isDark);
    return Object.entries(counts).map(([department, value], idx) => ({
      name: department,
      value,
      fill: colors[idx % colors.length],
    }));
  }, [filteredRecords, isDark]);

  return {
    availableMonths,
    departments,
    stats,
    chartData,
    deptDistributionData,
  };
}
