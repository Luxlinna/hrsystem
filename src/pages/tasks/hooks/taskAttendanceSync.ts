import { supabase } from "@/lib/supabase";
import { todayYMD } from "@/lib/date";

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
    .select("id, clock_in")
    .eq("employee_id", employeeId)
    .eq("date", today)
    .maybeSingle();

  if (attRec) {
    const [ciH, ciM, ciS] = (attRec.clock_in || "00:00:00").split(":").map(Number);
    const clockInMs = ciH * 3600000 + ciM * 60000 + ciS * 1000;
    const clockOutMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000;
    const hoursWorked = Math.round(((clockOutMs - clockInMs) / 3600000) * 100) / 100;
    await supabase
      .from("attendance_records")
      .update({
        clock_out: timeStr,
        hours_worked: hoursWorked > 0 ? hoursWorked : null,
      })
      .eq("id", attRec.id);
  }
}
