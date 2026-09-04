import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  const hasLoadedOnce = useRef(false);

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

  const loadRecords = useCallback(async (isInitial = false) => {
    if (!employeeId) return;
    if (isInitial && !hasLoadedOnce.current) {
      setLoading(true);
    }
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
    hasLoadedOnce.current = true;
    setLoading(false);
  }, [employeeId, today]);

  useEffect(() => {
    if (!employeeId) return;
    loadRecords(true);

    // Silent background polling fallback every 15 seconds
    const pollInterval = setInterval(() => {
      loadRecords(false);
    }, 15000);

    // Supabase Realtime subscription on attendance_records for this employee
    const channel = supabase
      .channel(`attendance_emp_${employeeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_records",
          filter: `employee_id=eq.${employeeId}`,
        },
        () => {
          loadRecords(false);
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [employeeId, loadRecords]);

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

  // Fetch employee record directly from Employee Directory to determine their assigned branch / work site
  useEffect(() => {
    if (!employeeId) return;
    setBranchLoading(true);
    (async () => {
      const { data: empData } = await supabase
        .from("employees")
        .select(`
          branch_id, default_work_location_id,
          branches(id, name, location, latitude, longitude, geofence_radius_m, work_start_time, work_end_time, late_grace_minutes, early_leave_grace_minutes),
          work_locations:default_work_location_id(id, name, description, latitude, longitude, geofence_radius_m, work_start_time, work_end_time, break_start_time, break_end_time, late_grace_minutes, early_leave_grace_minutes, is_four_punch_enabled)
        `)
        .eq("id", employeeId)
        .maybeSingle();

      const mainBranch = (empData as any)?.branches;
      const assignedSite = (empData as any)?.work_locations;
      const hasSpecificSite = Boolean(empData?.default_work_location_id && assignedSite);

      setDefaultWorkLocationId(hasSpecificSite ? empData.default_work_location_id : null);

      if (hasSpecificSite && assignedSite) {
        // Employee is stationed at a specific Branch Site (e.g. KampongThom)
        setBranch({
          name: `${assignedSite.name} (${mainBranch?.name || "Site"})`,
          latitude: assignedSite.latitude ?? mainBranch?.latitude ?? null,
          longitude: assignedSite.longitude ?? mainBranch?.longitude ?? null,
          geofence_radius_m: assignedSite.geofence_radius_m || 100,
          work_start_time: assignedSite.work_start_time || "07:30",
          work_end_time: assignedSite.work_end_time || "17:00",
          break_start_time: assignedSite.break_start_time || "11:30",
          break_end_time: assignedSite.break_end_time || "13:00",
          late_grace_minutes: assignedSite.late_grace_minutes ?? mainBranch?.late_grace_minutes ?? 15,
          early_leave_grace_minutes: assignedSite.early_leave_grace_minutes ?? mainBranch?.early_leave_grace_minutes ?? 15,
          is_four_punch_enabled: assignedSite.is_four_punch_enabled ?? true,
        });
      } else if (mainBranch) {
        // Employee is stationed at their Main Branch Office (e.g. Pinex Agro)
        setBranch({
          name: mainBranch.name || "Main Branch",
          latitude: mainBranch.latitude ?? null,
          longitude: mainBranch.longitude ?? null,
          geofence_radius_m: mainBranch.geofence_radius_m || 100,
          work_start_time: mainBranch.work_start_time || "08:00",
          work_end_time: mainBranch.work_end_time || "17:00",
          break_start_time: "12:00",
          break_end_time: "13:00",
          late_grace_minutes: mainBranch.late_grace_minutes ?? 15,
          early_leave_grace_minutes: mainBranch.early_leave_grace_minutes ?? 15,
          is_four_punch_enabled: false,
        });
      } else {
        setBranch(null);
      }

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

  const effectiveLateGraceMinutes = branch?.late_grace_minutes != null ? branch.late_grace_minutes : scheduleSettings.lateGraceMinutes;
  const effectiveEarlyLeaveGraceMinutes = branch?.early_leave_grace_minutes != null ? branch.early_leave_grace_minutes : scheduleSettings.earlyLeaveGraceMinutes;

  const effectiveScheduleSettings = useMemo(() => ({
    ...scheduleSettings,
    lateGraceMinutes: effectiveLateGraceMinutes,
    earlyLeaveGraceMinutes: effectiveEarlyLeaveGraceMinutes,
  }), [scheduleSettings, effectiveLateGraceMinutes, effectiveEarlyLeaveGraceMinutes]);

  return {
    records,
    todayRecord,
    loading,
    currentTime,
    branch,
    branchLoading,
    scheduleSettings: effectiveScheduleSettings,
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
