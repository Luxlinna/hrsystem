import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import { toast } from "@/components/Toast";
import type { Employee, AttendanceRecord, WorkLocation } from "../types";

export function useAttendanceData(isLeader: boolean) {
  const { user } = useAuth();
  const { targetBranch, isPartnerBranchBlocked, userBranchName, userBranchId } = useBranchScope();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setRecords([]);
      setEmployees([]);
      setWorkLocations([]);
      setLoading(false);
      return;
    }

    const { data: wlData } = await supabase
      .from("work_locations")
      .select("id, branch_id, name, description, is_default")
      .eq("branch_id", targetBranch)
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("name");
    setWorkLocations((wlData as WorkLocation[]) || []);

    setLoading(true);
    try {
      if (isLeader) {
        const { data: team, error: empErr } = await supabase
          .from("employees")
          .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name), default_work_location_id")
          .is("deleted_at", null)
          .eq("status", "active")
          .eq("branch_id", targetBranch)
          .order("first_name");
        if (empErr) console.warn("Error fetching attendance employees:", empErr);

        const empList = (team as unknown as Employee[]) || [];
        setEmployees(empList);
        const ids = empList.map((e) => e.id);

        let rawRecords: AttendanceRecord[] = [];
        if (ids.length > 0) {
          const { data: recData, error: recErr } = await supabase
            .from("attendance_records")
            .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name), default_work_location_id), work_location:work_locations(id, name)")
            .is("deleted_at", null)
            .in("employee_id", ids)
            .order("date", { ascending: false })
            .limit(2000);
          if (recErr) console.warn("Error fetching attendance records:", recErr);
          rawRecords = (recData as unknown as AttendanceRecord[]) || [];
        }

        const mapped = rawRecords.map((r) => {
          if (!r.work_location_id && r.employees?.default_work_location_id) {
            const locId = r.employees.default_work_location_id;
            const locObj = wlData?.find((wl) => wl.id === locId);
            return { ...r, work_location_id: locId, work_location: locObj ? { id: locObj.id, name: locObj.name } : null };
          }
          return r;
        });
        setRecords(mapped);
      } else {
        let empRecord = myEmployee;
        if (!empRecord && user?.email) {
          const { data: me } = await supabase
            .from("employees")
            .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name), default_work_location_id")
            .eq("email", user.email)
            .eq("branch_id", targetBranch)
            .is("deleted_at", null)
            .maybeSingle();
          if (me) {
            empRecord = me as unknown as Employee;
            setMyEmployee(empRecord);
          }
        }

        if (empRecord && (empRecord as any).branch_id === targetBranch) {
          setEmployees([empRecord]);
          const { data: recData } = await supabase
            .from("attendance_records")
            .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name), default_work_location_id), work_location:work_locations(id, name)")
            .eq("employee_id", empRecord.id)
            .is("deleted_at", null)
            .order("date", { ascending: false })
            .limit(1000);
          const rawRecords = (recData as unknown as AttendanceRecord[]) || [];
          const mapped = rawRecords.map((r) => {
            if (!r.work_location_id && r.employees?.default_work_location_id) {
              const locId = r.employees.default_work_location_id;
              const locObj = wlData?.find((wl) => wl.id === locId);
              return { ...r, work_location_id: locId, work_location: locObj ? { id: locObj.id, name: locObj.name } : null };
            }
            return r;
          });
          setRecords(mapped);
        } else {
          setEmployees([]);
          setRecords([]);
        }
      }
    } catch (err) {
      console.error("Failed to load attendance data:", err);
      toast("Error", "Could not load attendance data", "error");
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch, isLeader, myEmployee, user?.email]);

  return {
    records,
    setRecords,
    employees,
    setEmployees,
    myEmployee,
    setMyEmployee,
    workLocations,
    loading,
    currentTime,
    targetBranch,
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    fetchData,
  };
}
