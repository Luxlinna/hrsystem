import { supabase } from "@/lib/supabase";
import { todayYMD, zonedParts, zonedTimeToInstant, addDaysYMD, DEFAULT_TIMEZONE } from "@/lib/date";
import { computeHoursWorked, DEFAULT_WORK_SCHEDULE } from "@/lib/workSchedule";

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number | null;
  address: string | null;
}

export async function syncMultiDayOutsideWorkAttendance(
  employeeId: string,
  timezone: string = DEFAULT_TIMEZONE
) {
  if (!employeeId) return;

  // Query active outside work tasks assigned to this employee
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
        // Any elapsed past day where outside work was not completed must be auto-recorded with checkout at 6:00 PM
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
        // Current day: If task started on a previous day, work time starts at 8:00 AM on the new day
        const isMultiDayContinuation = startYMD < today;
        const clockInStr = isMultiDayContinuation
          ? "08:00:00"
          : `${String(startParts.hh).padStart(2, "0")}:${String(startParts.mm).padStart(2, "0")}:${String(startParts.ss).padStart(2, "0")}`;

        const isPastAutoCheckout = nowParts.minutesOfDay >= autoCheckoutMinutes;

        if (!existing) {
          if (isPastAutoCheckout) {
            const [ciH, ciM, ciS] = clockInStr.split(":").map(Number);
            const clockInInstant = zonedTimeToInstant(curYMD, ciH, ciM, ciS, timezone);
            const clockOutInstant = zonedTimeToInstant(curYMD, 18, 0, 0, timezone);
            const hoursWorked = computeHoursWorked(
              clockInInstant,
              clockOutInstant,
              DEFAULT_WORK_SCHEDULE.breakStartTime,
              DEFAULT_WORK_SCHEDULE.breakEndTime
            );

            await supabase.from("attendance_records").insert({
              employee_id: employeeId,
              date: curYMD,
              clock_in: clockInStr,
              clock_out: "18:00:00",
              status: "ontime",
              late_minutes: 0,
              hours_worked: hoursWorked,
              notes: `Outside work: ${task.title} (Auto checkout at 6:00 PM, shift end 5:00 PM)`,
            });
          } else {
            await supabase.from("attendance_records").insert({
              employee_id: employeeId,
              date: curYMD,
              clock_in: clockInStr,
              clock_out: null,
              status: "ontime",
              late_minutes: 0,
              hours_worked: null,
              notes: `Outside work: ${task.title} (Outside working)`,
            });
          }
        } else {
          // If record exists for today, ensure correct 8:00 AM start time for continuation days
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

export async function syncCheckInAttendance(
  employeeId: string,
  timeStr: string,
  now: Date,
  location: LocationData | null,
  workAddressFallback?: string | null
) {
  const today = todayYMD();
  let workLocationId: string | null = null;

  // Query assigned shift for today
  const { data: shiftAssignments } = await supabase
    .from("shift_assignments")
    .select("id, shift:shifts(start_time, shift_date)")
    .eq("employee_id", employeeId)
    .is("deleted_at", null);

  const match = (shiftAssignments as any[])?.find(
    (a) => a.shift && a.shift.shift_date === today
  );

  let startH = 8;
  let startM = 0;
  if (match?.shift?.start_time) {
    const [sh, sm] = match.shift.start_time.split(":").map(Number);
    startH = sh;
    startM = sm;
  } else {
    // Check employee's assigned work site or branch work_start_time
    const { data: empData } = await supabase
      .from("employees")
      .select("branch_id, default_work_location_id, branches(work_start_time), work_locations:default_work_location_id(id, work_start_time)")
      .eq("id", employeeId)
      .maybeSingle();

    let siteStartTime = (empData as any)?.work_locations?.work_start_time;
    let wlId = (empData as any)?.default_work_location_id || null;

    if (!wlId && (empData as any)?.branch_id) {
      const { data: defaultSite } = await supabase
        .from("work_locations")
        .select("id, work_start_time")
        .eq("branch_id", (empData as any).branch_id)
        .eq("is_default", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (defaultSite) {
        wlId = defaultSite.id;
        siteStartTime = defaultSite.work_start_time;
      } else {
        const { data: firstSite } = await supabase
          .from("work_locations")
          .select("id, work_start_time")
          .eq("branch_id", (empData as any).branch_id)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();
        if (firstSite) {
          wlId = firstSite.id;
          siteStartTime = firstSite.work_start_time;
        }
      }
    }
    workLocationId = wlId;

    const effectiveStartTime = siteStartTime || (empData as any)?.branches?.work_start_time;
    if (effectiveStartTime) {
      const [bh, bm] = effectiveStartTime.split(":").map(Number);
      startH = bh;
      startM = bm;
    }
  }

  const lateMinutes = Math.max(0, now.getHours() * 60 + now.getMinutes() - (startH * 60 + startM));
  const status = lateMinutes > 0 ? "late" : "ontime";

  await supabase.from("attendance_records").upsert(
    {
      employee_id: employeeId,
      date: today,
      clock_in: timeStr,
      status,
      late_minutes: lateMinutes,
      notes: `Outside work: check-in at ${location?.address || workAddressFallback || "unknown location"}`,
      work_location_id: workLocationId,
    },
    { onConflict: "employee_id,date" }
  );
}

export async function syncCheckOutAttendance(employeeId: string, timeStr: string, now: Date) {
  const today = todayYMD();
  const { data: attRec } = await supabase
    .from("attendance_records")
    .select("id, clock_in, notes")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .maybeSingle();

  if (attRec) {
    const [ciH, ciM, ciS] = (attRec.clock_in || "08:00:00").split(":").map(Number);
    const clockInInstant = zonedTimeToInstant(today, ciH, ciM, ciS);
    const clockOutInstant = zonedTimeToInstant(today, now.getHours(), now.getMinutes(), now.getSeconds());
    const hoursWorked = computeHoursWorked(
      clockInInstant,
      clockOutInstant,
      DEFAULT_WORK_SCHEDULE.breakStartTime,
      DEFAULT_WORK_SCHEDULE.breakEndTime
    );

    await supabase
      .from("attendance_records")
      .update({
        clock_out: timeStr,
        hours_worked: hoursWorked > 0 ? hoursWorked : null,
      })
      .eq("id", attRec.id);
  }
}
