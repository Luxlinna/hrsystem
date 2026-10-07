import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import { toast } from "@/components/Toast";
import type { Employee, AttendanceRecord, WorkLocation, BiometricDevice } from "../types";
import { compareBiometricIds } from "@/lib/biometricUtils";
import { attendanceCache } from "../services/attendanceCacheService";

export function useAttendanceData(
  isLeader: boolean,
  canViewAllBranches: boolean = false,
  fallbackEmployee?: Employee | null,
  isLineManager: boolean = false,
  permsLoading: boolean = false
) {
  const { user } = useAuth();
  const { targetBranch, isPartnerBranchBlocked, userBranchName, userBranchId, visibleBranches } = useBranchScope();

  const cacheKey = `${targetBranch || "none"}_${isLeader ? "leader" : "emp"}_${canViewAllBranches ? "all" : "branch"}_${isLineManager ? "lm" : "norm"}_${user?.email || ""}`;

  // Initial instant cache hydration
  const initialCached = attendanceCache.getCachedAttendance(cacheKey);

  const [records, setRecords] = useState<AttendanceRecord[]>(initialCached?.records || []);
  const [employees, setEmployees] = useState<Employee[]>(initialCached?.employees || []);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(fallbackEmployee || null);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>(() => attendanceCache.getCachedWorkLocations() || []);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>(() => {
    const cached = attendanceCache.getCachedBranches();
    if (cached && cached.length > 0) return cached;
    if (visibleBranches && visibleBranches.length > 0) return visibleBranches.map((b) => ({ id: b.id, name: b.name }));
    return [];
  });
  const [depts, setDepts] = useState<string[]>(() => attendanceCache.getCachedTableValues("departments") || []);
  const [positions, setPositions] = useState<string[]>(() => attendanceCache.getCachedTableValues("positions") || []);
  const [employeeTypes, setEmployeeTypes] = useState<string[]>(["FULL-TIME", "HOD", "INTERNSHIP", "PART-TIME"]);
  const [employeeLevels, setEmployeeLevels] = useState<string[]>(() => attendanceCache.getCachedTableValues("employee_levels") || ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director", "Executive"]);
  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(!initialCached);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadReferenceData = useCallback(async (force = false) => {
    try {
      const [
        cachedBranches,
        cachedWorkLocs,
        cachedDepts,
        cachedPositions,
        cachedTypes,
        cachedLevels,
      ] = await Promise.all([
        attendanceCache.getBranches(force),
        attendanceCache.getWorkLocations(force),
        attendanceCache.getTableValues("departments", [], force),
        attendanceCache.getTableValues("positions", [], force),
        Promise.resolve(["FULL-TIME", "HOD", "INTERNSHIP", "PART-TIME"]),
        attendanceCache.getTableValues("employee_levels", ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director", "Executive"], force),
      ]);
      if (!isMountedRef.current) return;
      if (cachedBranches && cachedBranches.length > 0) setBranches(cachedBranches);
      if (cachedWorkLocs && cachedWorkLocs.length > 0) setWorkLocations(cachedWorkLocs);
      if (cachedDepts && cachedDepts.length > 0) setDepts(cachedDepts);
      if (cachedPositions && cachedPositions.length > 0) setPositions(cachedPositions);
      if (cachedTypes && cachedTypes.length > 0) setEmployeeTypes(cachedTypes);
      if (cachedLevels && cachedLevels.length > 0) setEmployeeLevels(cachedLevels);
    } catch (e) {
      console.warn("Failed loading attendance reference data:", e);
    }
  }, []);

  useEffect(() => {
    loadReferenceData(false);
  }, [loadReferenceData]);

  const fetchData = useCallback(
    async (opts?: { silent?: boolean; force?: boolean }) => {
      const silent = opts?.silent ?? false;
      const force = opts?.force ?? false;

      if (permsLoading || isFetchingRef.current) return;
      isFetchingRef.current = true;

      // Always ensure reference data is populated
      loadReferenceData(force);

      if ((isPartnerBranchBlocked && !canViewAllBranches) || !targetBranch) {
        setRecords([]);
        setEmployees([]);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // Check if we have fresh cached data and not forced
      const cached = attendanceCache.getCachedAttendance(cacheKey);
      if (cached && !force && attendanceCache.isAttendanceFresh(cacheKey)) {
        setRecords(cached.records);
        setEmployees(cached.employees);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      if (!silent && !cached && records.length === 0) {
        setLoading(true);
      }

      try {
        // 1. Fetch Reference Data via Cache (parallel + deduplicated)
        const [
          cachedBranches,
          cachedWorkLocs,
          cachedDepts,
          cachedPositions,
          cachedTypes,
          cachedLevels,
          cachedDevices,
          cachedMe,
        ] = await Promise.all([
          attendanceCache.getBranches(force),
          attendanceCache.getWorkLocations(force),
          attendanceCache.getTableValues("departments", [], force),
          attendanceCache.getTableValues("positions", [], force),
          Promise.resolve(["FULL-TIME", "HOD", "INTERNSHIP", "PART-TIME"]),
          attendanceCache.getTableValues("employee_levels", ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director", "Executive"], force),
          attendanceCache.getBiometricDevices(targetBranch, force),
          user?.email ? attendanceCache.getMyEmployee(user.email, force) : Promise.resolve(null),
        ]);

        if (!isMountedRef.current) return;

        setBranches(cachedBranches);
        setWorkLocations(cachedWorkLocs);
        setDepts(cachedDepts);
        setPositions(cachedPositions);
        setEmployeeTypes(cachedTypes);
        setEmployeeLevels(cachedLevels);
        setBiometricDevices(cachedDevices);

        const empRecord = cachedMe || myEmployee || fallbackEmployee || null;
        if (empRecord && !myEmployee) {
          setMyEmployee(empRecord);
        }

        // 2. Fetch Employee Team & Attendance Records
        if (isLeader) {
          let empQuery = supabase
            .from("employees")
            .select("id, first_name, last_name, department, division, line_manager, reports_to, role, avatar_url, branch_id, status, branches(id, name), default_work_location_id, employee_code, biometric_user_id, basic_salary, contract_rate, contract_rate_currency, contract_rate_frequency, tax_method, contract_type, employment_type, site")
            .is("deleted_at", null)
            .order("first_name");

          if (!canViewAllBranches) {
            empQuery = empQuery.eq("branch_id", targetBranch);
          }

          const exitQuery = supabase
            .from("employee_exits")
            .select("id, employee_id, status");

          const [{ data: team, error: empErr }, { data: exitRows }] = await Promise.all([
            empQuery,
            exitQuery,
          ]);

          if (empErr) console.warn("Error fetching attendance employees:", empErr);

          const exitedEmpIds = new Set(
            (exitRows || [])
              .filter((ex: any) => (ex.status || "").toLowerCase().trim() !== "cancelled")
              .map((ex: any) => ex.employee_id)
              .filter(Boolean)
          );

          const isExitStaff = (emp: any) => {
            const st = (emp.status || "").toLowerCase().trim();
            if (
              st === "inactive" ||
              st === "exited" ||
              st === "terminated" ||
              st === "resigned" ||
              st === "suspended" ||
              st === "deactivate" ||
              st === "deactivated" ||
              st.includes("exit") ||
              st.includes("black") ||
              st.includes("terminat") ||
              st.includes("resign") ||
              st.includes("suspend") ||
              st.includes("inact")
            ) {
              return true;
            }
            return exitedEmpIds.has(emp.id);
          };

          let empList = ((team as unknown as Employee[]) || []).filter((e) => !isExitStaff(e));
          if (isLineManager && empRecord) {
            const myId = empRecord.id;
            const myName = `${empRecord.first_name || ""} ${empRecord.last_name || ""}`.trim().toLowerCase();
            const myEmail = (user?.email || "").toLowerCase().trim();
            const myDept = (empRecord.department || "").trim().toLowerCase();
            const myDiv = ((empRecord as any).division || "").trim().toLowerCase();

            empList = empList.filter((e: any) => {
              if (e.id === myId || e.reports_to === myId) return true;
              const eLm = (e.line_manager || "").trim().toLowerCase();
              if (eLm && (eLm === myName || eLm === myEmail)) return true;
              if (myDept && e.department && e.department.trim().toLowerCase() === myDept) return true;
              if (myDiv && e.division && e.division.trim().toLowerCase() === myDiv) return true;
              return false;
            });
          }

          empList.sort((a, b) => compareBiometricIds(a.biometric_user_id, b.biometric_user_id));

          const ids = empList.map((e) => e.id);
          const empMap = new Map(empList.map((e) => [e.id, e]));

          let rawRecords: AttendanceRecord[] = [];
          if (ids.length > 0) {
            const { data: recData, error: recErr } = await supabase
              .from("attendance_records")
              .select("*, employees(id, first_name, last_name, department, division, role, avatar_url, branch_id, branches(id, name), default_work_location_id, biometric_user_id, employee_code, basic_salary, contract_rate, contract_rate_currency, contract_rate_frequency, tax_method, contract_type, employment_type, site), work_location:work_locations(id, name)")
              .is("deleted_at", null)
              .in("employee_id", ids)
              .order("date", { ascending: false })
              .limit(canViewAllBranches ? 5000 : 2000);
            if (recErr) console.warn("Error fetching attendance records:", recErr);
            rawRecords = (recData as unknown as AttendanceRecord[]) || [];
          }

          const mapped = rawRecords.map((r) => {
            const emp = empMap.get(r.employee_id) || r.employees;
            let rec = { ...r, employees: emp };
            if (!rec.work_location_id && emp?.default_work_location_id) {
              const locId = emp.default_work_location_id;
              const locObj = cachedWorkLocs?.find((wl) => wl.id === locId);
              rec = { ...rec, work_location_id: locId, work_location: locObj ? { id: locObj.id, name: locObj.name } : null };
            }
            return rec;
          });

          mapped.sort((a, b) => {
            const dateComp = (b.date || "").localeCompare(a.date || "");
            if (dateComp !== 0) return dateComp;
            const bioComp = compareBiometricIds(a.employees?.biometric_user_id, b.employees?.biometric_user_id);
            if (bioComp !== 0) return bioComp;
            return (a.employees?.first_name || "").localeCompare(b.employees?.first_name || "");
          });

          if (!isMountedRef.current) return;

          setEmployees(empList);
          setRecords(mapped);

          // Save to cache
          attendanceCache.setCachedAttendance(cacheKey, { records: mapped, employees: empList });
        } else {
          if (empRecord) {
            setEmployees([empRecord]);
            const { data: recData } = await supabase
              .from("attendance_records")
              .select("*, employees(id, first_name, last_name, department, division, role, avatar_url, branch_id, branches(id, name), default_work_location_id, biometric_user_id, employee_code, basic_salary, contract_rate, contract_rate_currency, contract_rate_frequency, tax_method, contract_type, employment_type, site), work_location:work_locations(id, name)")
              .eq("employee_id", empRecord.id)
              .is("deleted_at", null)
              .order("date", { ascending: false })
              .limit(1000);
            const rawRecords = (recData as unknown as AttendanceRecord[]) || [];
            const mapped = rawRecords.map((r) => {
              const emp = empRecord || r.employees;
              let rec = { ...r, employees: emp };
              if (!rec.work_location_id && emp?.default_work_location_id) {
                const locId = emp.default_work_location_id;
                const locObj = cachedWorkLocs?.find((wl) => wl.id === locId);
                rec = { ...rec, work_location_id: locId, work_location: locObj ? { id: locObj.id, name: locObj.name } : null };
              }
              return rec;
            });

            if (!isMountedRef.current) return;

            setRecords(mapped);
            attendanceCache.setCachedAttendance(cacheKey, { records: mapped, employees: [empRecord] });
          } else {
            setEmployees([]);
            setRecords([]);
          }
        }
      } catch (err) {
        console.error("Failed to load attendance data:", err);
        toast("Error", "Could not load attendance data", "error");
      } finally {
        isFetchingRef.current = false;
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [isPartnerBranchBlocked, canViewAllBranches, targetBranch, isLeader, isLineManager, user?.email, fallbackEmployee, myEmployee, cacheKey, permsLoading, records.length]
  );

  useEffect(() => {
    // Initial single fetch or revalidation on branch / user change / permissions loaded
    if (permsLoading) return;
    fetchData({ silent: !!attendanceCache.getCachedAttendance(cacheKey) });
  }, [permsLoading, fetchData, cacheKey]);

  useEffect(() => {
    // Realtime subscription with silent refresh
    const channel = supabase
      .channel("attendance-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, () => {
        attendanceCache.invalidateAttendance(targetBranch);
        fetchData({ silent: true, force: true });
      })
      .subscribe();

    // Background SWR sync every 60s (silent, won't flicker UI or block interaction)
    const interval = setInterval(() => {
      fetchData({ silent: true });
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchData, targetBranch]);

  return {
    records,
    setRecords,
    employees,
    setEmployees,
    myEmployee,
    setMyEmployee,
    workLocations,
    branches,
    depts,
    positions,
    employeeTypes,
    employeeLevels,
    biometricDevices,
    loading,
    currentTime,
    targetBranch,
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    fetchData,
  };
}
