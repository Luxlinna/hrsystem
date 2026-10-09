import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { compareBiometricIds } from "@/lib/biometricUtils";
import type { Branch, Employee, DisciplinaryRecord } from "../types";

interface UseDisciplinaryDataProps {
  targetBranch: string | null;
  isPartnerBranchBlocked: boolean;
  isLeader: boolean;
  isSuperAdmin: boolean;
  myEmployeeId?: string;
}

export function useDisciplinaryData({
  targetBranch,
  isPartnerBranchBlocked,
  isLeader,
  isSuperAdmin,
  myEmployeeId,
}: UseDisciplinaryDataProps) {
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Branches
      const { data: bData } = await supabase
        .from("branches")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");

      const branchList = (bData as Branch[]) || [];
      setBranches(branchList);

      // 2. Fetch all employees across the full directory
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select(
          "id, first_name, last_name, display_name, full_name, kh_name, department, role, position, avatar_url, branch_id, biometric_user_id, employee_code, status, branches(id, name)"
        )
        .is("deleted_at", null)
        .order("first_name", { ascending: true })
        .limit(2000);

      if (empErr) console.warn("Disciplinary employees query error:", empErr);

      const rawEmpList = empData || [];
      const empList: Employee[] = rawEmpList.map((e: any) => {
        const fullName =
          e.display_name?.trim() ||
          e.full_name?.trim() ||
          `${e.last_name || ""} ${e.first_name || ""}`.trim() ||
          "Employee";
        return {
          id: e.id,
          first_name: e.first_name,
          last_name: e.last_name,
          display_name: e.display_name,
          full_name: fullName,
          kh_name: e.kh_name,
          department: e.department || "General",
          role: e.position || e.role || "Staff",
          avatar_url: e.avatar_url,
          branch_id: e.branch_id,
          employee_id: e.biometric_user_id || e.employee_code || e.id.substring(0, 8).toUpperCase(),
          branches: Array.isArray(e.branches) ? e.branches[0] : e.branches,
        };
      });

      empList.sort((a, b) => {
        const idComp = compareBiometricIds(a.employee_id, b.employee_id);
        if (idComp !== 0) return idComp;
        return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
      });

      setEmployees(empList);
      const empIds = empList.map((e) => e.id);

      // 3. Fetch Disciplinary & Warning Records
      let recordList: DisciplinaryRecord[] = [];
      const query = supabase
        .from("disciplinary_records")
        .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, biometric_user_id, branches(id, name))")
        .is("deleted_at", null);

      let scopedQuery = query;
      if (isSuperAdmin) {
        // SuperAdmin sees all disciplinary and warning records
      } else if (isLeader && targetBranch && targetBranch !== "all") {
        scopedQuery = scopedQuery.or(`branch_id.is.null,branch_id.eq.${targetBranch}`);
      } else {
        const staffId = myEmployeeId || empIds[0];
        if (staffId) {
          scopedQuery = scopedQuery.eq("employee_id", staffId);
        }
      }

      const { data: rData, error: rErr } = await scopedQuery.order("created_at", { ascending: false });
      if (rErr) {
        console.warn("Scoped disciplinary query fallback:", rErr);
        const { data: fallbackData } = await supabase
          .from("disciplinary_records")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, biometric_user_id, branches(id, name))")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        const rawList = (fallbackData as unknown as DisciplinaryRecord[]) || [];
        if (targetBranch && targetBranch !== "all" && !isSuperAdmin) {
          recordList = rawList.filter((r: any) => !r.branch_id || r.branch_id === targetBranch || r.employees?.branch_id === targetBranch);
        } else {
          recordList = rawList;
        }
      } else {
        recordList = (rData as unknown as DisciplinaryRecord[]) || [];
      }

      setRecords(recordList);
    } catch (err) {
      console.error("Failed to load disciplinary data:", err);
    } finally {
      setLoading(false);
    }
  }, [targetBranch, isLeader, isSuperAdmin, myEmployeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    records,
    setRecords,
    employees,
    branches,
    loading,
    fetchData,
  };
}
