import { useMemo } from "react";
import type { LeaveRequest, Employee, DepartmentImpact } from "../types";
import { toYMD } from "../dateUtils";

interface UseLeaveCalendarStatsProps {
  leaves: LeaveRequest[];
  filteredLeaves: LeaveRequest[];
  employees: Employee[];
  departments: string[];
  year: number;
  month: number;
  daysInMonth: number;
  getDayLeaves: (d: number) => LeaveRequest[];
}

export function useLeaveCalendarStats({
  leaves,
  filteredLeaves,
  employees,
  departments,
  year,
  month,
  daysInMonth,
  getDayLeaves,
}: UseLeaveCalendarStatsProps) {
  const todayStr = toYMD(new Date());

  const leavesToday = useMemo(() => {
    return leaves.filter(
      (l) => l.status === "approved" && todayStr >= l.start_date && todayStr <= l.end_date
    );
  }, [leaves, todayStr]);

  const approvedInMonth = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return leaves.filter((l) => l.status === "approved" && l.start_date.startsWith(monthPrefix));
  }, [leaves, year, month]);

  const totalDaysInMonth = useMemo(() => {
    return approvedInMonth.reduce((sum, l) => sum + (l.days || 0), 0);
  }, [approvedInMonth]);

  const pendingLeaves = useMemo(() => {
    return leaves.filter((l) => l.status === "pending");
  }, [leaves]);

  const peakDayInfo = useMemo(() => {
    let maxCount = 0;
    let maxDay = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const count = getDayLeaves(d).length;
      if (count > maxCount) {
        maxCount = count;
        maxDay = d;
      }
    }
    return { day: maxDay, count: maxCount };
  }, [daysInMonth, getDayLeaves]);

  const upcomingLeaves = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return leaves
      .filter((l) => {
        if (l.status !== "approved") return false;
        const s = new Date(l.start_date + "T00:00:00");
        const diff = (s.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
      })
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 8);
  }, [leaves]);

  const departmentStats: DepartmentImpact[] = useMemo(() => {
    const counts: Record<string, { totalDays: number; staffCount: number; peopleAway: Set<string> }> = {};

    departments.forEach((dept) => {
      counts[dept] = {
        totalDays: 0,
        staffCount: employees.filter((e) => e.department === dept).length,
        peopleAway: new Set(),
      };
    });

    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    leaves
      .filter((l) => l.status === "approved" && l.start_date.startsWith(monthPrefix))
      .forEach((l) => {
        const dept = l.employees?.department || "General";
        if (!counts[dept]) {
          counts[dept] = {
            totalDays: 0,
            staffCount: employees.filter((e) => e.department === dept).length || 1,
            peopleAway: new Set(),
          };
        }
        counts[dept].totalDays += l.days || 0;
        if (l.employee_id) counts[dept].peopleAway.add(l.employee_id);
      });

    return Object.entries(counts)
      .map(([dept, data]) => ({
        dept,
        totalDays: data.totalDays,
        staffCount: data.staffCount,
        awayCount: data.peopleAway.size,
        pctAway: data.staffCount > 0 ? Math.min(100, Math.round((data.peopleAway.size / data.staffCount) * 100)) : 0,
      }))
      .sort((a, b) => b.totalDays - a.totalDays);
  }, [leaves, year, month, departments, employees]);

  return {
    todayStr,
    leavesToday,
    approvedInMonth,
    totalDaysInMonth,
    pendingLeaves,
    peakDayInfo,
    upcomingLeaves,
    departmentStats,
  };
}
