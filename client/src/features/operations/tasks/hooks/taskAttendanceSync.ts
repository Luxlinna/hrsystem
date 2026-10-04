import { supabase } from "@/lib/supabase";
import { todayYMD, zonedTimeToInstant } from "@/lib/date";
import { computeHoursWorked, DEFAULT_WORK_SCHEDULE } from "@/lib/workSchedule";

export { syncMultiDayOutsideWorkAttendance } from "./multiDayOutsideWorkSync";

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number | null;
  address: string | null;
}

export async function syncCheckInAttendance(
  employeeId: string,
  timeStr: string,
  now: Date,
  location: LocationData | null,
  workAddressFallback?: string | null,
  taskTitle?: string | null
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
  const missionDesc = taskTitle ? `Mission: "${taskTitle}"` : "Outside Mission";
  const locDesc = location?.address || workAddressFallback || "field location";
  const missionNote = `${missionDesc} - Check-in at ${locDesc}`;

  // Check if attendance record already exists for today
  const { data: existing } = await supabase
    .from("attendance_records")
    .select("id, clock_in, notes, status")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    const newNotes = existing.notes ? `${existing.notes}\n${missionNote}` : missionNote;
    await supabase
      .from("attendance_records")
      .update({
        clock_in: existing.clock_in || timeStr,
        notes: newNotes,
        work_location_id: workLocationId || undefined,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("attendance_records").insert({
      employee_id: employeeId,
      date: today,
      clock_in: timeStr,
      status,
      late_minutes: lateMinutes,
      notes: missionNote,
      work_location_id: workLocationId,
    });
  }
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
