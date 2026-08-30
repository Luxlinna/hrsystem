import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Branch, Employee, DisciplinaryRecord } from "../types";

interface UseDisciplinaryDataProps {
  targetBranch: string | null;
  isPartnerBranchBlocked: boolean;
  isLeader: boolean;
  myEmployeeId?: string;
}

export function useDisciplinaryData({
  targetBranch,
  isPartnerBranchBlocked,
  isLeader,
  myEmployeeId,
}: UseDisciplinaryDataProps) {
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setRecords([]);
      setEmployees([]);
      setBranches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: bData } = await supabase
        .from("branches")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");

      setBranches((bData as Branch[]) || []);

      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, branch_id")
        .eq("status", "active")
        .eq("branch_id", targetBranch)
        .is("deleted_at", null)
        .order("first_name");

      if (empErr) console.error("Disciplinary employees query error:", empErr);
      const empList = (empData || []) as Employee[];
      const empIds = empList.map((e) => e.id);
      setEmployees(empList);

      let recordList: DisciplinaryRecord[] = [];
      const query = supabase
        .from("disciplinary_records")
        .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id)")
        .is("deleted_at", null);

      let scopedQuery = query;
      if (isLeader) {
        scopedQuery = scopedQuery.or(`branch_id.is.null,branch_id.eq.${targetBranch}`);
      } else {
        const staffId = myEmployeeId || empIds[0];
        scopedQuery = scopedQuery.eq("employee_id", staffId || "");
      }

      const { data: rData, error: rErr } = await scopedQuery.order("created_at", { ascending: false });
      if (rErr) {
        console.warn("Scoped disciplinary query fallback:", rErr);
        const { data: fallbackData } = await supabase
          .from("disciplinary_records")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        const rawList = (fallbackData as unknown as DisciplinaryRecord[]) || [];
        const empIdSet = new Set(empIds);
        recordList = rawList.filter((r: any) => !r.employee_id || empIdSet.has(r.employee_id) || r.employees?.branch_id === targetBranch);
      } else {
        recordList = (rData as unknown as DisciplinaryRecord[]) || [];
      }

      setRecords(recordList);
    } catch (err) {
      console.error("Failed to load disciplinary data:", err);
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch, isLeader, myEmployeeId]);

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
