import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { addDaysYMD, todayYMD, zonedDayOfWeek } from "@/lib/date";
import { DEFAULT_WORK_SCHEDULE, getScheduleForDate, settingsFromRows } from "@/lib/workSchedule";
import type { AttendanceRecord, BranchGeofence, OutsideWorkTask } from "../types";

interface UseCheckInScheduleAndDataProps {
  employeeId: string;
}

export function useCheckInScheduleAndData({ employeeId }: UseCheckInScheduleAndDataProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [branch, setBranch] = useState<BranchGeofence | null>(null);
  const [branchLoading, setBranchLoading] = useState(true);
  const [globalWorkStartTime, setGlobalWorkStartTime] = useState("08:00");
  const [scheduleSettings, setScheduleSettings] = useState(DEFAULT_WORK_SCHEDULE);
  const [activeOutsideWork, setActiveOutsideWork] = useState<OutsideWorkTask | null>(null);
  const [todayOutsideWork, setTodayOutsideWork] = useState<OutsideWorkTask | null>(null);
  const [assignedShift, setAssignedShift] = useState<{ start_time: string; end_time: string; name: string } | null>(null);
  const [defaultWorkLocationId, setDefaultWorkLocationId] = useState<string | null>(null);

  const today = todayYMD();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    supabase.from("system_settings").select("key, value").then(({ data }) => {
      if (data) {
        const next = settingsFromRows(data);
        setScheduleSettings(next);
        setGlobalWorkStartTime(next.workStartTime);
      }
    });
  }, []);

  const loadRecords = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    const fromDate = addDaysYMD(today, -30);
    const { data } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("date", fromDate)
      .order("date", { ascending: false });

    const all = data || [];
    setRecords(all);
    setTodayRecord(all.find((r) => r.date === today) || null);
    setLoading(false);
  }, [employeeId, today]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    if (!employeeId) return;
    supabase
      .from("tasks")
      .select("id, title, due_date, work_status, work_checked_in_at, work_checked_out_at, work_address, created_at")
      .eq("assigned_to", employeeId)
      .eq("is_outside_work", true)
      .is("deleted_at", null)
      .then(async ({ data }) => {
        const list = (data as any[]) || [];
        const task =
          list.find((t) => t.work_status === "checked_in") ||
          list.find((t) => t.due_date === today || (t.work_checked_in_at && t.work_checked_in_at.startsWith(today))) ||
          list.find((t) => t.created_at && t.created_at.startsWith(today) && t.work_status !== "checked_out") ||
          null;

        setTodayOutsideWork(task);
        setActiveOutsideWork(task?.work_status === "checked_in" ? task : null);

        if (task?.work_checked_in_at && task.work_status === "checked_in") {
          const { data: existing } = await supabase
            .from("attendance_records")
            .select("id")
            .eq("employee_id", employeeId)
            .eq("date", today)
            .maybeSingle();

          if (!existing) {
            const ci = new Date(task.work_checked_in_at);
            const timeStr = `${String(ci.getHours()).padStart(2, "0")}:${String(ci.getMinutes()).padStart(2, "0")}:${String(ci.getSeconds()).padStart(2, "0")}`;
            await supabase.from("attendance_records").upsert(
              {
                employee_id: employeeId,
                date: today,
                clock_in: timeStr,
                status: "ontime",
                notes: `Outside work: ${task.title}`,
                work_location_id: defaultWorkLocationId || null,
              },
              { onConflict: "employee_id,date" }
            );
            loadRecords();
          }
        }
      });
  }, [employeeId, today, defaultWorkLocationId, loadRecords]);

  useEffect(() => {
    if (!employeeId) return;
    supabase
      .from("shift_assignments")
      .select("id, shift:shifts(id, start_time, end_time, shift_date, name)")
      .eq("employee_id", employeeId)
      .is("deleted_at", null)
      .then(({ data }) => {
        const list = (data as any[]) || [];
        const match = list.find((a) => a.shift && a.shift.shift_date === today && !a.shift.deleted_at);
        if (match?.shift) {
          setAssignedShift({
            start_time: match.shift.start_time.substring(0, 5),
            end_time: match.shift.end_time.substring(0, 5),
            name: match.shift.name,
          });
        } else {
          setAssignedShift(null);
        }
      });
  }, [employeeId, today]);

  useEffect(() => {
    if (!employeeId) return;
    setBranchLoading(true);
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select(`
          branch_id, default_work_location_id,
          branches(name, latitude, longitude, geofence_radius_m, work_start_time, work_end_time),
          work_locations:default_work_location_id(id, name, description, latitude, longitude, geofence_radius_m, work_start_time, work_end_time, break_start_time, break_end_time, is_four_punch_enabled)
        `)
        .eq("id", employeeId)
        .maybeSingle();

      const mainBranch = (data as any)?.branches;
      let site = (data as any)?.work_locations;

      let wlId = (data as any)?.default_work_location_id || null;
      if (!wlId && (data as any)?.branch_id) {
        const { data: defaultSite } = await supabase
          .from("work_locations")
          .select("id, name, description, latitude, longitude, geofence_radius_m, work_start_time, work_end_time, break_start_time, break_end_time, is_four_punch_enabled")
          .eq("branch_id", (data as any).branch_id)
          .is("deleted_at", null)
          .order("is_default", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (defaultSite) {
          wlId = defaultSite.id;
          site = defaultSite;
        }
      }
      setDefaultWorkLocationId(wlId);

      let lat = site?.latitude ?? mainBranch?.latitude ?? null;
      let lng = site?.longitude ?? mainBranch?.longitude ?? null;

      // If coordinates are not stored in database yet, dynamically geocode site or branch address
      if (!lat || !lng) {
        const addressToGeocode = site?.description || site?.name || mainBranch?.location || "";
        if (addressToGeocode) {
          try {
            const { geocodeAddress } = await import("@/lib/geocode");
            const geoRes = await geocodeAddress(addressToGeocode);
            if (geoRes?.lat && geoRes?.lng) {
              lat = geoRes.lat;
              lng = geoRes.lng;
            }
          } catch {
            // Geocoding fallback handled gracefully
          }
        }
      }

      const effectiveBranch: BranchGeofence = {
        name: site?.name ? `${site.name} (${mainBranch?.name || "Site"})` : mainBranch?.name || "Office",
        latitude: lat,
        longitude: lng,
        geofence_radius_m: site?.geofence_radius_m ?? mainBranch?.geofence_radius_m ?? 100,
        work_start_time: site?.work_start_time || mainBranch?.work_start_time || null,
        work_end_time: site?.work_end_time || mainBranch?.work_end_time || null,
        break_start_time: site?.break_start_time || null,
        break_end_time: site?.break_end_time || null,
        is_four_punch_enabled: site?.is_four_punch_enabled ?? true,
      };

      setBranch(effectiveBranch);
      setBranchLoading(false);
    })();
  }, [employeeId]);

  const isSaturday = zonedDayOfWeek(currentTime, scheduleSettings.timezone) === 6;
  const daySchedule = getScheduleForDate(scheduleSettings);
  const siteOrBranchStartTime = branch?.work_start_time ? branch.work_start_time.slice(0, 5) : null;
  const siteOrBranchEndTime = branch?.work_end_time ? branch.work_end_time.slice(0, 5) : null;
  const workStartTime =
    assignedShift?.start_time || (!isSaturday && siteOrBranchStartTime) || daySchedule?.startTime || globalWorkStartTime || "08:00";
  const workEndTime =
    assignedShift?.end_time || (!isSaturday && siteOrBranchEndTime) || daySchedule?.endTime || (isSaturday ? "12:00" : "17:00");
  const breakStartTime = branch?.break_start_time ? branch.break_start_time.slice(0, 5) : scheduleSettings.breakStartTime;
  const breakEndTime = branch?.break_end_time ? branch.break_end_time.slice(0, 5) : scheduleSettings.breakEndTime;

  return {
    records,
    todayRecord,
    loading,
    currentTime,
    branch,
    branchLoading,
    scheduleSettings,
    activeOutsideWork,
    todayOutsideWork,
    assignedShift,
    defaultWorkLocationId,
    today,
    daySchedule,
    workStartTime,
    workEndTime,
    breakStartTime,
    breakEndTime,
    loadRecords,
  };
}
