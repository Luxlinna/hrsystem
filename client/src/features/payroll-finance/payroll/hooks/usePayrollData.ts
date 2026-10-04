import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import type { Employee, PayrollRecord, BranchPayrollPolicy, Branch } from "../types";
import { applyUserEmployeeFilter } from "@/lib/phoneUtils";
import { DEFAULT_BRANCH_PAYROLL_POLICY } from "../constants";

export function usePayrollData(
  currentMonthStr: string,
  setSelectedMonth: (month: string) => void
) {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, targetBranch, isPartnerBranchBlocked } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();

  const roleName = (role?.name || "").toLowerCase();
  const isLeader =
    isSuperAdmin ||
    isBranchAdmin ||
    isAdmin ||
    /manager|lead|head|admin|ceo|director|chief|president|officer/i.test(roleName) ||
    Boolean(role?.payroll_view_all_employees);

  const canManage = isLeader;

  const [allRecords, setAllRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchPolicy, setBranchPolicy] = useState<BranchPayrollPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch branch list
      const { data: bData } = await supabase
        .from("branches")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      const branchList = (bData || []) as Branch[];
      setBranches(branchList);

      // 2. Strict Partner Branch Isolation: Block access if user does not belong to the selected branch
      if (isPartnerBranchBlocked || !targetBranch) {
        setBranchPolicy(null);
        setAllRecords([]);
        setEmployees([]);
        setLoading(false);
        return;
      }

      // 3. Fetch Branch-Specific Payroll Policy for user's own home branch
      const { data: policyData } = await supabase
        .from("branch_payroll_policies")
        .select("*")
        .eq("branch_id", targetBranch)
        .maybeSingle();

      if (policyData) {
        setBranchPolicy(policyData as BranchPayrollPolicy);
      } else {
        setBranchPolicy({
          branch_id: targetBranch,
          ...DEFAULT_BRANCH_PAYROLL_POLICY,
        } as BranchPayrollPolicy);
      }

      // 4. Leader / Admin View: Scoped strictly to user's home branch
      if (isLeader) {
        const { data: empsData } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branch_id, branches(id, name)")
          .eq("status", "active")
          .is("deleted_at", null)
          .eq("branch_id", targetBranch)
          .order("first_name");

        const empList = (empsData as unknown as Employee[]) || [];
        setEmployees(empList);
        const empIds = empList.map((e) => e.id);

        if (empIds.length === 0) {
          setAllRecords([]);
          setLoading(false);
          return;
        }

        const { data: recordsData } = await supabase
          .from("payroll_records")
          .select("id, employee_id, branch_id, month, base_salary, bonus, deductions, net_pay, status, created_at, employees(id, first_name, last_name, role, department, avatar_url, branch_id, branches(id, name))")
          .is("deleted_at", null)
          .in("employee_id", empIds)
          .order("month", { ascending: false })
          .order("created_at", { ascending: false });

        const formatted = (recordsData || []).map((x: any) => ({
          ...x,
          employees: Array.isArray(x.employees) ? x.employees[0] : x.employees || null,
        })) as PayrollRecord[];

        setAllRecords(formatted);

        if (formatted.length > 0) {
          const hasCurrentMonth = formatted.some((r) => r.month === currentMonthStr);
          if (!hasCurrentMonth) {
            setSelectedMonth(formatted[0].month);
          }
        }
      } else {
        // Individual staff self-service view
        let empRecord = myEmployee;
        if (!empRecord && user?.email) {
          const meQuery = applyUserEmployeeFilter(
            supabase
              .from("employees")
              .select("id, first_name, last_name, role, department, avatar_url, branch_id"),
            user.email
          );
          const { data: me } = await meQuery.maybeSingle();
          if (me) empRecord = me as any;
        }

        if (empRecord) {
          setEmployees([empRecord as unknown as Employee]);
          const { data: myRecords } = await supabase
            .from("payroll_records")
            .select("id, employee_id, branch_id, month, base_salary, bonus, deductions, net_pay, status, created_at, employees(id, first_name, last_name, role, department, avatar_url, branch_id, branches(id, name))")
            .eq("employee_id", empRecord.id)
            .is("deleted_at", null)
            .order("month", { ascending: false });

          const formattedMy = (myRecords || []).map((x: any) => ({
            ...x,
            employees: Array.isArray(x.employees) ? x.employees[0] : x.employees || null,
          })) as PayrollRecord[];

          setAllRecords(formattedMy);
          if (formattedMy.length > 0) {
            const hasCurrent = formattedMy.some((r) => r.month === currentMonthStr);
            if (!hasCurrent) {
              setSelectedMonth(formattedMy[0].month);
            }
          }
        } else {
          setAllRecords([]);
          setEmployees([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch payroll data:", err);
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch, isLeader, myEmployee, user?.email, currentMonthStr, setSelectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    canViewAll: canManage && !isPartnerBranchBlocked,
    canManage: canManage && !isPartnerBranchBlocked,
    isSuperAdmin,
    isBranchAdmin,
    effectiveBranchId,
    userBranchId,
    targetBranch,
    isPartnerBranchBlocked,
    branches,
    branchPolicy,
    setBranchPolicy,
    allRecords,
    setAllRecords,
    employees,
    loading,
    loadData,
  };
}
