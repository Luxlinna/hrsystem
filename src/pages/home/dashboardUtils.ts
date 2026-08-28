import type { HrKpiState, AttendanceBucket, HiringTrendItem } from "./types";

export function computeHrKpis(
  attRecords: any[],
  trainRecords: any[],
  discRecords: any[]
): HrKpiState {
  const totalAtt = attRecords.length;
  const presentAtt = attRecords.filter((r: any) => r.status === "ontime" || r.status === "present" || r.status === "late").length;
  const lateAtt = attRecords.filter((r: any) => r.status === "late").length;
  const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
  const lateRate = totalAtt > 0 ? Math.round((lateAtt / totalAtt) * 100) : 0;
  const hoursArr = attRecords.filter((r: any) => r.hours_worked).map((r: any) => r.hours_worked);
  const avgHours =
    hoursArr.length > 0
      ? parseFloat((hoursArr.reduce((s: number, h: number) => s + h, 0) / hoursArr.length).toFixed(1))
      : 0;

  const completedTrainings = trainRecords.filter((r: any) => r.status === "completed").length;
  const inProgressTrainings = trainRecords.filter((r: any) => r.status === "in_progress").length;
  const trainingRate =
    trainRecords.length > 0 ? Math.round((completedTrainings / trainRecords.length) * 100) : 0;
  const openDisc = discRecords.filter((r: any) => r.status !== "resolved" && r.status !== "closed").length;

  const trendDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dayRecs = attRecords.filter((r: any) => r.date === dateStr);
    const rate =
      dayRecs.length > 0
        ? Math.round((dayRecs.filter((r: any) => r.status !== "absent").length / dayRecs.length) * 100)
        : 0;
    return { day: d.toLocaleDateString("en-US", { weekday: "short" }), rate };
  });

  return {
    attendanceRate: attRate,
    avgHoursWorked: avgHours,
    lateRate,
    trainingCompletionRate: trainingRate,
    openDisciplinaryCases: openDisc,
    inProgressTrainings,
    attendanceTrend: trendDays,
  };
}

export function computeAttendanceBreakdown(attRecords: any[]): AttendanceBucket[] {
  const dayBuckets: Record<string, { present: number; absent: number; late: number }> = {};
  attRecords.forEach((r: any) => {
    const label = new Date(r.date).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    if (!dayBuckets[label]) dayBuckets[label] = { present: 0, absent: 0, late: 0 };
    if (r.status === "absent") dayBuckets[label].absent++;
    else {
      dayBuckets[label].present++;
      if (r.status === "late") dayBuckets[label].late++;
    }
  });
  const weekOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return weekOrder.filter((d) => dayBuckets[d]).map((d) => ({ day: d, ...dayBuckets[d] }));
}

export function computeHiringTrend(employees: any[], offList: any[]): HiringTrendItem[] {
  const monthsBack = 5;
  const now = new Date();
  const monthBuckets = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("en-US", { month: "short" }),
    };
  });

  return monthBuckets.map(({ year, month, label }) => ({
    month: label,
    hires: (employees || []).filter((emp: any) => {
      if (!emp.join_date) return false;
      const jd = new Date(emp.join_date);
      return jd.getFullYear() === year && jd.getMonth() === month;
    }).length,
    terminations: (offList || []).filter((o: any) => {
      const dateStr = o.last_day || o.created_at;
      if (!dateStr) return false;
      const td = new Date(dateStr);
      return td.getFullYear() === year && td.getMonth() === month;
    }).length,
  }));
}
