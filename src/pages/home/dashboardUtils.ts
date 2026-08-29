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

export function computeAttendanceBreakdown(attRecords: any[], fromDate?: string, toDate?: string): AttendanceBucket[] {
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate) : null;
  const daysDiff = from && to ? Math.round((to.getTime() - from.getTime()) / 86400000) : 7;

  // For ranges > 7 days, group into weekly buckets. For <= 7 days, group by weekday label.
  if (daysDiff <= 7) {
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

  // Group by date for longer ranges, but cap X-axis points to max 30 by aggregating into weekly groups
  const buckets: Record<string, { present: number; absent: number; late: number }> = {};
  attRecords.forEach((r: any) => {
    const d = new Date(r.date + "T00:00:00Z");
    let label: string;
    if (daysDiff <= 31) {
      // Daily labels: "Aug 5"
      label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    } else {
      // Weekly labels: bucket into week starting Monday
      const weekStart = new Date(d);
      const dayOfWeek = weekStart.getUTCDay();
      const diff = (dayOfWeek + 6) % 7; // shift so Monday=0
      weekStart.setUTCDate(weekStart.getUTCDate() - diff);
      label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    }
    if (!buckets[label]) buckets[label] = { present: 0, absent: 0, late: 0 };
    if (r.status === "absent") buckets[label].absent++;
    else {
      buckets[label].present++;
      if (r.status === "late") buckets[label].late++;
    }
  });

  return Object.entries(buckets)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([day, vals]) => ({ day, ...vals }));
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
