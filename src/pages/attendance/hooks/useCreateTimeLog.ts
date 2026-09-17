import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/components/Toast";
import { toYMD } from "@/lib/date";
import { saveTimeLogRecord } from "../services/timeLogService";
import type { Employee, WorkLocation } from "../types";
import { matchAttendanceEmployee } from "../searchUtils";

interface UseCreateTimeLogProps {
  employees: Employee[];
  initialWorkLocations?: WorkLocation[];
  initialEmployeeId?: string;
  isEmployeeFixed?: boolean;
  onSaved?: () => Promise<void> | void;
  onBack: () => void;
  activeBranchId?: string | null;
}

export function useCreateTimeLog({
  employees, initialEmployeeId, isEmployeeFixed = false, onSaved, onBack, activeBranchId,
}: UseCreateTimeLogProps) {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role } = usePermissions();

  const [employeeId, setEmployeeId] = useState<string>(initialEmployeeId || "");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);
  const [employeeBuId, setEmployeeBuId] = useState<string | null>(null);
  const [employeeBranchName, setEmployeeBranchName] = useState<string | null>(null);
  const [sites, setSites] = useState<WorkLocation[]>([]);
  const [logSiteId, setLogSiteId] = useState<string>("");
  const [refreshingSites, setRefreshingSites] = useState(false);
  const [date, setDate] = useState<string>(() => toYMD(new Date()));

  // Work Schedule & Late Arrival Controls (e.g. 09:00 AM start, 15 min grace)
  const [workStartTime, setWorkStartTime] = useState<string>("09:00");
  const [graceMinutes, setGraceMinutes] = useState<number>(15);
  const [statusMode, setStatusMode] = useState<"auto" | "ontime" | "late">("auto");

  const initDate = user?.last_sign_in_at ? new Date(user.last_sign_in_at) : new Date();
  const rawH = initDate.getHours();
  const [hour, setHour] = useState<string>(String(rawH % 12 || 12).padStart(2, "0"));
  const [minute, setMinute] = useState<string>(String(initDate.getMinutes()).padStart(2, "0"));
  const [period, setPeriod] = useState<"AM" | "PM">(rawH >= 12 ? "PM" : "AM");
  const [logType, setLogType] = useState<"in" | "out">("in");
  const [remark, setRemark] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);

  const loadSitesForBu = useCallback(async (buId: string, prefLocId?: string | null) => {
    setRefreshingSites(true);
    try {
      const { data, error } = await supabase
        .from("work_locations")
        .select("id, branch_id, name, description, is_default, work_start_time, work_end_time, break_start_time, break_end_time, is_four_punch_enabled")
        .is("deleted_at", null).eq("branch_id", buId)
        .order("is_default", { ascending: false }).order("name");

      if (!error && data) {
        const locs = data as WorkLocation[];
        setSites(locs);
        const matched = prefLocId ? locs.find((s) => s.id === prefLocId) : null;
        setLogSiteId(matched ? matched.id : "");
      }
    } finally {
      setTimeout(() => setRefreshingSites(false), 250);
    }
  }, []);

  useEffect(() => {
    if (!employeeId) {
      setEmployeeBuId(null); setEmployeeBranchName(null); setSites([]); setLogSiteId(""); return;
    }
    const localEmp = employees.find((e) => e.id === employeeId);
    if (localEmp?.branch_id) {
      setEmployeeBuId(localEmp.branch_id);
      setEmployeeBranchName((localEmp.branches as any)?.name || null);
      loadSitesForBu(localEmp.branch_id, localEmp.default_work_location_id);
    }
    let cancelled = false;
    supabase
      .from("employees")
      .select("id, branch_id, default_work_location_id, branches(id, name)")
      .eq("id", employeeId).maybeSingle()
      .then(({ data: empData }) => {
        if (cancelled || !empData) return;
        const buId = empData.branch_id || activeBranchId;
        setEmployeeBuId(buId);
        setEmployeeBranchName((empData.branches as any)?.name || null);
        if (buId) loadSitesForBu(buId, empData.default_work_location_id);
      });
    return () => { cancelled = true; };
  }, [employeeId, employees, activeBranchId, loadSitesForBu]);

  useEffect(() => { if (initialEmployeeId) setEmployeeId(initialEmployeeId); }, [initialEmployeeId]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(e.target as Node)) setIsEmployeeDropdownOpen(false);
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) setSaveMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedEmployee = useMemo(() => employees.find((e) => e.id === employeeId) || null, [employees, employeeId]);
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) =>
      matchAttendanceEmployee(e, employeeSearchQuery, activeBranchId)
    );
  }, [employees, employeeSearchQuery, activeBranchId]);

  const handleHourBlur = () => { const v = parseInt(hour, 10); setHour(String(isNaN(v) || v < 1 ? 1 : v > 12 ? 12 : v).padStart(2, "0")); };
  const handleMinuteBlur = () => { const v = parseInt(minute, 10); setMinute(String(isNaN(v) || v < 0 ? 0 : v > 59 ? 59 : v).padStart(2, "0")); };

  const compute24hTime = (): string => {
    let h = parseInt(hour, 10) || 8;
    const m = parseInt(minute, 10) || 0;
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  };

  // Live evaluation: scan <= 9:15 is ontime; scan > 9:15 counts late starting from 9:15
  const liveEvaluation = useMemo(() => {
    let h = parseInt(hour, 10) || 9;
    const m = parseInt(minute, 10) || 0;
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const punchMin = h * 60 + m;
    const [stH, stM] = workStartTime.split(":").map(Number);
    const startMin = (isNaN(stH) ? 9 : stH) * 60 + (isNaN(stM) ? 0 : stM);
    const graceThresholdMin = startMin + graceMinutes;
    const isLate = punchMin > graceThresholdMin;
    const calcLateMin = isLate ? punchMin - graceThresholdMin : 0;
    const calcStatus: "ontime" | "late" = isLate ? "late" : "ontime";
    const effectiveStatus = statusMode === "auto" ? calcStatus : statusMode;
    const effectiveLateMinutes = effectiveStatus === "late"
      ? (calcLateMin > 0 ? calcLateMin : Math.max(1, punchMin - graceThresholdMin > 0 ? punchMin - graceThresholdMin : 1))
      : 0;
    return { isLate, calcLateMin, calcStatus, effectiveStatus, effectiveLateMinutes };
  }, [hour, minute, period, workStartTime, graceMinutes, statusMode]);

  const handleSave = async (andNew: boolean = false) => {
    if (!employeeId) return toast("Validation Error", "Please select an employee.", "warning");
    if (!date) return toast("Validation Error", "Please select a date.", "warning");

    setSaving(true);
    try {
      await saveTimeLogRecord({
        employeeId, date, time24h: compute24hTime(), logType, logSiteId, sites,
        remark, actorName, actorRole: role?.name || "Staff",
        effectiveBranch: employeeBuId, displayTime: `${hour}:${minute} ${period}`,
        customStatus: liveEvaluation.effectiveStatus,
        customLateMinutes: liveEvaluation.effectiveLateMinutes,
        workStartTime, graceMinutes,
      });
      toast("Time Log Saved", `${logType === "in" ? "Time In" : "Time Out"} (${liveEvaluation.effectiveStatus === "late" ? `Late ${liveEvaluation.effectiveLateMinutes}m` : "On Time"}) recorded.`, "success");
      await onSaved?.();

      if (andNew) {
        const refNow = new Date(), rH = refNow.getHours();
        setPeriod(rH >= 12 ? "PM" : "AM");
        setHour(String(rH % 12 || 12).padStart(2, "0"));
        setMinute(String(refNow.getMinutes()).padStart(2, "0"));
        setRemark("");
        if (!isEmployeeFixed) { setEmployeeId(""); setSites([]); setLogSiteId(""); }
      } else {
        onBack();
      }
    } catch (err: any) {
      toast("Save Error", err?.message || "Failed to record time log.", "error");
    } finally {
      setSaving(false);
    }
  };

  return {
    employeeId, employeeSearchQuery, setEmployeeSearchQuery,
    isEmployeeDropdownOpen, setIsEmployeeDropdownOpen, employeeDropdownRef,
    sites, logSiteId, setLogSiteId, refreshingSites, handleRefreshSites: () => loadSitesForBu(employeeBuId || "", logSiteId),
    date, setDate, hour, setHour, minute, setMinute, period, setPeriod,
    logType, setLogType, remark, setRemark, saving, saveMenuOpen, setSaveMenuOpen,
    saveMenuRef, selectedEmployee, filteredEmployees, handleSelectEmployee: (id: string) => { setEmployeeId(id); setIsEmployeeDropdownOpen(false); },
    handleHourBlur, handleMinuteBlur, handleSave, employeeBranchName, employeeBuId,
    workStartTime, setWorkStartTime, graceMinutes, setGraceMinutes, statusMode, setStatusMode, liveEvaluation,
  };
}
