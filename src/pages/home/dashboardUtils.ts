import type { HrKpiState, AttendanceBucket, HiringTrendItem } from "./types";

export function computeHrKpis(
  attRecords: any[],
  trainRecords: any[],
  discRecords: any[],
  employees: any[] = [],
  _leaveRequests: any[] = []
): HrKpiState {
  const activeEmps = (employees || []).filter((e: any) => e.status === "active");
  const totalActive = activeEmps.length || 1;

  const presentAtt = attRecords.filter(
    (r: any) => r.status === "ontime" || r.status === "present" || r.status === "late"
  ).length;
  const lateAtt = attRecords.filter((r: any) => r.status === "late").length;
  const lateRate = presentAtt > 0 ? Math.round((lateAtt / presentAtt) * 100) : 0;

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

  const todayStr = new Date().toISOString().slice(0, 10);

  // 7-day attendance trend based on active BU headcount
  const trendDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const dow = d.getDay(); // 0 = Sunday
    const dayRecs = attRecords.filter((r: any) => r.date === dateStr);
    const presentCount = new Set(
      dayRecs.filter((r: any) => r.status !== "absent").map((r: any) => r.employee_id)
    ).size;

    let rate = 0;
    if (dow === 0) {
      rate = presentCount > 0 ? 100 : 0;
    } else if (presentCount > 0 && totalActive > 0) {
      rate = Math.min(100, Math.round((presentCount / totalActive) * 100));
    }
    return { day: d.toLocaleDateString("en-US", { weekday: "short" }), rate };
  });

  // Calculate overall attendance rate across work dates with attendance
  const distinctWorkDates = Array.from(
    new Set(attRecords.filter((r) => r.date && r.date <= todayStr).map((r) => r.date))
  );
  let attRate = 0;
  if (distinctWorkDates.length > 0 && totalActive > 0) {
    const totalPresentScans = distinctWorkDates.reduce((acc, d) => {
      const p = new Set(
        attRecords.filter((r) => r.date === d && r.status !== "absent").map((r) => r.employee_id)
      ).size;
      return acc + p;
    }, 0);
    attRate = Math.min(100, Math.round((totalPresentScans / (distinctWorkDates.length * totalActive)) * 100));
  } else if (attRecords.length > 0) {
    attRate = Math.round((presentAtt / attRecords.length) * 100);
  }

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

export function computeAttendanceBreakdown(
  attRecords: any[],
  fromDate?: string,
  toDate?: string,
  employees: any[] = [],
  leaveRequests: any[] = []
): AttendanceBucket[] {
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate) : null;
  const daysDiff = from && to ? Math.round((to.getTime() - from.getTime()) / 86400000) : 7;
  const todayStr = new Date().toISOString().slice(0, 10);

  const activeEmps = (employees || []).filter((e: any) => e.status === "active");
  const approvedLeaves = (leaveRequests || []).filter((lr: any) => lr.status === "approved");

  // Group records by calendar date YYYY-MM-DD
  const dateMap = new Map<string, any[]>();
  attRecords.forEach((r: any) => {
    if (!r.date) return;
    const list = dateMap.get(r.date) || [];
    list.push(r);
    dateMap.set(r.date, list);
  });

  // Calculate daily stats per date
  interface DayStat {
    dateStr: string;
    present: number;
    absent: number;
    late: number;
    timestamp: number;
  }
  const dayStats: DayStat[] = [];

  for (const [dateStr, records] of dateMap.entries()) {
    const d = new Date(dateStr + "T00:00:00Z");
    const isFuture = dateStr > todayStr;

    // Unique employees who checked in / were present
    const checkedInEmpIds = new Set<string>();
    let lateCount = 0;
    let explicitAbsentCount = 0;

    records.forEach((r: any) => {
      if (r.status === "absent") {
        explicitAbsentCount++;
      } else {
        if (r.employee_id) checkedInEmpIds.add(r.employee_id);
        if (r.status === "late") lateCount++;
      }
    });

    const presentCount = checkedInEmpIds.size > 0 ? checkedInEmpIds.size : records.filter((r) => r.status !== "absent").length;

    let totalAbsent = explicitAbsentCount;
    // On days where attendance occurred up to today, employees in this BU who did not scan and are not on approved leave are ABSENT
    if (!isFuture && presentCount > 0 && activeEmps.length > 0) {
      const activeOnDate = activeEmps.filter((e: any) => !e.join_date || e.join_date <= dateStr);
      const leaveEmpIds = new Set(
        approvedLeaves
          .filter((lr: any) => lr.start_date <= dateStr && (lr.end_date || lr.start_date) >= dateStr)
          .map((lr: any) => lr.employee_id)
      );
      const unscannedAbsences = activeOnDate.filter(
        (e: any) => !checkedInEmpIds.has(e.id) && !leaveEmpIds.has(e.id)
      ).length;
      totalAbsent = explicitAbsentCount + unscannedAbsences;
    }

    dayStats.push({
      dateStr,
      present: presentCount,
      absent: totalAbsent,
      late: lateCount,
      timestamp: d.getTime(),
    });
  }

  // Sort chronologically
  dayStats.sort((a, b) => a.timestamp - b.timestamp);

  // For ranges <= 7 days, group by weekday label (Mon..Sun)
  if (daysDiff <= 7) {
    const dayBuckets: Record<string, { present: number; absent: number; late: number }> = {};
    dayStats.forEach((stat) => {
      const d = new Date(stat.dateStr + "T00:00:00Z");
      const label = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
      if (!dayBuckets[label]) dayBuckets[label] = { present: 0, absent: 0, late: 0 };
      dayBuckets[label].present += stat.present;
      dayBuckets[label].absent += stat.absent;
      dayBuckets[label].late += stat.late;
    });
    const weekOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return weekOrder.filter((d) => dayBuckets[d]).map((d) => ({ day: d, ...dayBuckets[d] }));
  }

  // For longer ranges, group by daily label ("Sep 16") or weekly buckets
  interface AggBucket {
    day: string;
    present: number;
    absent: number;
    late: number;
    sortKey: number;
  }
  const buckets: Record<string, AggBucket> = {};

  dayStats.forEach((stat) => {
    const d = new Date(stat.dateStr + "T00:00:00Z");
    let label: string;
    let sortKey: number;

    if (daysDiff <= 31) {
      label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      sortKey = d.getTime();
    } else {
      const weekStart = new Date(d);
      const dayOfWeek = weekStart.getUTCDay();
      const diff = (dayOfWeek + 6) % 7;
      weekStart.setUTCDate(weekStart.getUTCDate() - diff);
      label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      sortKey = weekStart.getTime();
    }

    if (!buckets[label]) {
      buckets[label] = { day: label, present: 0, absent: 0, late: 0, sortKey };
    }
    buckets[label].present += stat.present;
    buckets[label].absent += stat.absent;
    buckets[label].late += stat.late;
  });

  return Object.values(buckets)
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ sortKey: _s, ...rest }) => rest);
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
