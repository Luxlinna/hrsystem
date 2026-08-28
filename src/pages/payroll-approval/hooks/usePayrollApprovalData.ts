import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { PayrollRun, PayrollApproval, EmployeeItemRecord } from "../types";

export interface BranchInfo {
  id: string;
  name: string;
}

export function usePayrollApprovalData(
  setTab: (tab: "pending" | "approved" | "history" | "itemized" | "create") => void,
  setPeriodFilter: (p: string) => void,
  setExpandedRun: (id: string | null) => void
) {
  const { isSuperAdmin, effectiveBranchId, userBranchId } = useBranchScope();
  const targetBranch = effectiveBranchId || (!isSuperAdmin ? userBranchId : null);

  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [approvals, setApprovals] = useState<PayrollApproval[]>([]);
  const [itemizedRecords, setItemizedRecords] = useState<EmployeeItemRecord[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [branchDepartments, setBranchDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch branches
      const { data: bData } = await supabase
        .from("branches")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      setBranches((bData || []) as BranchInfo[]);

      // 2. If no branch selected in Super Admin mode, approvals are locked to protect branch security
      if (!targetBranch) {
        if (isSuperAdmin) {
          setRuns([]);
          setApprovals([]);
          setItemizedRecords([]);
          setBranchDepartments([]);
          setLoading(false);
          return;
        }
      }

      // 3. Fetch branch employees to get valid IDs & departments
      let empQuery = supabase
        .from("employees")
        .select("id, department, branch_id")
        .eq("status", "active")
        .is("deleted_at", null);

      if (targetBranch) {
        empQuery = empQuery.eq("branch_id", targetBranch);
      }

      const { data: branchEmps } = await empQuery;
      const empList = branchEmps || [];
      const empIds = empList.map((e) => e.id);
      const uniqueDepts = Array.from(new Set(empList.map((e) => e.department).filter(Boolean)));
      setBranchDepartments(uniqueDepts as string[]);

      // 4. Fetch payroll runs for this branch
      let runsQuery = supabase.from("payroll_runs").select("*").order("created_at", { ascending: false });
      if (targetBranch) {
        runsQuery = runsQuery.or(`branch_id.eq.${targetBranch},branch_id.is.null`);
      }

      // 5. Fetch approvals and itemized records
      let recordsQuery = supabase
        .from("payroll_records")
        .select("id, employee_id, month, base_salary, bonus, deductions, net_pay, status, employees(first_name, last_name, role, department, avatar_url, branch_id)")
        .order("month", { ascending: false });

      if (targetBranch && empIds.length > 0) {
        recordsQuery = recordsQuery.in("employee_id", empIds);
      } else if (targetBranch && empIds.length === 0) {
        // No employees in this branch yet
        setRuns([]);
        setApprovals([]);
        setItemizedRecords([]);
        setLoading(false);
        return;
      }

      const [{ data: r }, { data: a }, { data: recs }] = await Promise.all([
        runsQuery,
        supabase.from("payroll_approvals").select("*").order("created_at", { ascending: true }),
        recordsQuery,
      ]);

      setRuns((r as PayrollRun[]) || []);
      setApprovals((a as PayrollApproval[]) || []);
      setItemizedRecords((recs as unknown as EmployeeItemRecord[]) || []);
    } catch (err) {
      console.error("Failed to load payroll approval data:", err);
    } finally {
      setLoading(false);
    }
  }, [targetBranch, isSuperAdmin]);

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("payroll-runs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_runs" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_approvals" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_records" }, () => loadData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadData]);

  // Deep link highlight navigation
  useEffect(() => {
    if (!highlightId || runs.length === 0) return;
    const match = runs.find((r) => r.id === highlightId);
    if (!match) return;
    setTab(match.status === "pending_approval" ? "pending" : match.status === "approved" ? "approved" : "history");
    setPeriodFilter("all");
    setExpandedRun(highlightId);
    const t = setTimeout(() => {
      const el = document.getElementById(`payroll-run-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(t);
  }, [highlightId, runs, setTab, setPeriodFilter, setExpandedRun]);

  const getRunApprovals = useCallback(
    (runId: string) => approvals.filter((a) => a.run_id === runId),
    [approvals]
  );

  return {
    isSuperAdmin,
    targetBranch,
    branches,
    branchDepartments,
    runs,
    setRuns,
    approvals,
    setApprovals,
    itemizedRecords,
    loading,
    loadData,
    getRunApprovals,
  };
}
