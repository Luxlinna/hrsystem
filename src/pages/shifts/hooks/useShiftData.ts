import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { toast } from "@/components/Toast";
import type { Shift, ShiftAssignment, Branch, Employee } from "../types";

export function useShiftData() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const { isSuperAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setShifts([]);
      setAssignments([]);
      setBranches([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    try {
      const shiftQuery = supabase
        .from("shifts")
        .select("*, branches(name, location)")
        .is("deleted_at", null)
        .eq("branch_id", targetBranch)
        .order("shift_date")
        .order("start_time");

      const empQuery = supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, branch_id")
        .is("deleted_at", null)
        .eq("branch_id", targetBranch)
        .order("first_name");

      const branchQuery = supabase.from("branches").select("id, name, location").eq("id", targetBranch).order("name");

      const [{ data: s, error: sErr }, { data: a, error: aErr }, { data: b }, { data: e }] = await Promise.all([
        shiftQuery,
        supabase.from("shift_assignments").select("*, employee:employees(first_name, last_name, role, department, avatar_url, branch_id)").is("deleted_at", null),
        branchQuery,
        empQuery,
      ]);

      if (sErr) throw sErr;
      if (aErr) throw aErr;

      const rawShifts = s || [];
      const shiftIds = new Set(rawShifts.map((sh) => sh.id));
      const filteredAssignments = (a || []).filter((x: any) => shiftIds.has(x.shift_id) || x.employee?.branch_id === targetBranch);

      const shiftList = rawShifts.map((sh) => ({
        ...sh,
        assignmentCount: filteredAssignments.filter((x: any) => x.shift_id === sh.id).length,
      }));

      setShifts(shiftList);
      setAssignments(filteredAssignments);
      setBranches(b || []);
      setEmployees(e || []);
    } catch (err) {
      console.error("Failed to load shift data:", err);
      toast("Error", "Could not load shift schedules", "error");
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch]);

  const departments = useMemo(() => {
    const fromShifts = shifts.map((s) => s.department).filter(Boolean);
    const fromEmployees = employees.map((e) => e.department).filter(Boolean);
    return [...new Set([...fromShifts, ...fromEmployees])].sort();
  }, [shifts, employees]);

  useEffect(() => {
    loadData();
  }, [effectiveBranchId, loadData]);

  return {
    shifts,
    setShifts,
    assignments,
    setAssignments,
    branches,
    employees,
    loading,
    departments,
    isSuperAdmin,
    effectiveBranchId,
    userBranchId,
    userBranchName,
    targetBranch,
    isPartnerBranchBlocked,
    loadData,
  };
}
