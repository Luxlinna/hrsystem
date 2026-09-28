import { supabase } from "@/lib/supabase";
import { todayYMD, zonedParts, zonedTimeToInstant, addDaysYMD, DEFAULT_TIMEZONE } from "@/lib/date";
import { computeHoursWorked, DEFAULT_WORK_SCHEDULE } from "@/lib/workSchedule";

export async function syncMultiDayOutsideWorkAttendance(
  employeeId: string,
  timezone: string = DEFAULT_TIMEZONE
) {
  if (!employeeId) return;

  const { data: outsideTasks } = await supabase
    .from("tasks")
    .select("id, title, work_status, work_checked_in_at, work_checked_out_at, work_address")
    .eq("assigned_to", employeeId)
    .eq("is_outside_work", true)
    .eq("work_status", "checked_in")
    .is("deleted_at", null);

  if (!outsideTasks || outsideTasks.length === 0) return;

  const today = todayYMD(timezone);
  const nowParts = zonedParts(new Date(), timezone);
  const autoCheckoutMinutes = 18 * 60; // 6:00 PM auto checkout

  for (const task of outsideTasks) {
    if (!task.work_checked_in_at) continue;

    const startParts = zonedParts(new Date(task.work_checked_in_at), timezone);
    const startYMD = startParts.ymd;
    let curYMD = startYMD;
    let guardLoop = 0;

    while (curYMD <= today && guardLoop < 60) {
      guardLoop++;

      const { data: existing } = await supabase
        .from("attendance_records")
        .select("id, clock_in, clock_out, notes, hours_worked")
        .eq("employee_id", employeeId)
        .eq("date", curYMD)
        .maybeSingle();

      const isPastDay = curYMD < today;
      const isToday = curYMD === today;

      if (isPastDay) {
        const clockInStr = curYMD === startYMD
          ? `${String(startParts.hh).padStart(2, "0")}:${String(startParts.mm).padStart(2, "0")}:${String(startParts.ss).padStart(2, "0")}`
          : "08:00:00";

        const [ciH, ciM, ciS] = (existing?.clock_in || clockInStr).split(":").map(Number);
        const clockInInstant = zonedTimeToInstant(curYMD, ciH, ciM, ciS, timezone);
        const clockOutInstant = zonedTimeToInstant(curYMD, 18, 0, 0, timezone);
        const hoursWorked = computeHoursWorked(
          clockInInstant,
          clockOutInstant,
          DEFAULT_WORK_SCHEDULE.breakStartTime,
          DEFAULT_WORK_SCHEDULE.breakEndTime
        );

        const autoNote = `Outside work: ${task.title} (Auto checkout at 6:00 PM, shift end 5:00 PM)`;

        if (!existing) {
          await supabase.from("attendance_records").insert({
            employee_id: employeeId,
            date: curYMD,
            clock_in: clockInStr,
            clock_out: "18:00:00",
            status: "ontime",
            late_minutes: 0,
            hours_worked: hoursWorked,
            notes: autoNote,
          });
        } else if (!existing.clock_out) {
          await supabase.from("attendance_records").update({
            clock_out: "18:00:00",
            hours_worked: hoursWorked,
            notes: existing.notes ? `${existing.notes}\n${autoNote}` : autoNote,
          }).eq("id", existing.id);
        }
      } else if (isToday) {
        const isMultiDayContinuation = startYMD < today;
        const clockInStr = isMultiDayContinuation
          ? "08:00:00"
          : `${String(startParts.hh).padStart(2, "0")}:${String(startParts.mm).padStart(2, "0")}:${String(startParts.ss).padStart(2, "0")}`;

        const isPastAutoCheckout = nowParts.minutesOfDay >= autoCheckoutMinutes;

        if (!existing) {
          const effectiveHours = isPastAutoCheckout
            ? computeHoursWorked(
                zonedTimeToInstant(curYMD, Number(clockInStr.split(":")[0]), Number(clockInStr.split(":")[1]), 0, timezone),
                zonedTimeToInstant(curYMD, 18, 0, 0, timezone),
                DEFAULT_WORK_SCHEDULE.breakStartTime,
                DEFAULT_WORK_SCHEDULE.breakEndTime
              )
            : null;

          await supabase.from("attendance_records").insert({
            employee_id: employeeId,
            date: curYMD,
            clock_in: clockInStr,
            clock_out: isPastAutoCheckout ? "18:00:00" : null,
            status: "ontime",
            late_minutes: 0,
            hours_worked: effectiveHours,
            notes: isPastAutoCheckout
              ? `Outside work: ${task.title} (Auto checkout at 6:00 PM, shift end 5:00 PM)`
              : `Outside work: ${task.title} (Outside working)`,
          });
        } else {
          const updates: Record<string, any> = {};

          if (isMultiDayContinuation && existing.clock_in !== "08:00:00" && !existing.clock_out) {
            updates.clock_in = "08:00:00";
            updates.late_minutes = 0;
            if (!existing.notes || !existing.notes.includes("Outside working")) {
              updates.notes = `Outside work: ${task.title} (Outside working)`;
            }
          }

          if (isPastAutoCheckout && !existing.clock_out) {
            const effectiveIn = updates.clock_in || existing.clock_in || clockInStr;
            const [ciH, ciM, ciS] = effectiveIn.split(":").map(Number);
            const clockInInstant = zonedTimeToInstant(curYMD, ciH, ciM, ciS, timezone);
            const clockOutInstant = zonedTimeToInstant(curYMD, 18, 0, 0, timezone);
            updates.clock_out = "18:00:00";
            updates.hours_worked = computeHoursWorked(
              clockInInstant,
              clockOutInstant,
              DEFAULT_WORK_SCHEDULE.breakStartTime,
              DEFAULT_WORK_SCHEDULE.breakEndTime
            );
            const autoNote = `Auto checkout at 6:00 PM (shift end 5:00 PM)`;
            updates.notes = existing.notes ? `${existing.notes}\n${autoNote}` : `Outside work: ${task.title} (${autoNote})`;
          }

          if (Object.keys(updates).length > 0) {
            await supabase.from("attendance_records").update(updates).eq("id", existing.id);
          }
        }
      }

      curYMD = addDaysYMD(curYMD, 1);
    }
  }
}
