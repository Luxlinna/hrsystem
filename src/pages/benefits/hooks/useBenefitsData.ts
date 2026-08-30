import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { BenefitPlan, Employee, Enrollment } from "../types";

export function useBenefitsData() {
  const { targetBranch, isPartnerBranchBlocked, userBranchName, userBranchId } = useBranchScope();

  const [plans, setPlans] = useState<BenefitPlan[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setPlans([]);
      setEnrollments([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [{ data: p }, { data: e }, { data: emps }] = await Promise.all([
      supabase
        .from("benefit_plans")
        .select("*")
        .eq("branch_id", targetBranch)
        .order("created_at", { ascending: false }),
      supabase
        .from("benefit_enrollments")
        .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id), benefit_plans(id, name, type, provider, coverage_amount, employee_contribution)")
        .order("created_at", { ascending: false }),
      supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, branch_id")
        .eq("branch_id", targetBranch)
        .is("deleted_at", null)
        .order("first_name"),
    ]);

    const empList = (emps as Employee[]) || [];
    const empIds = new Set(empList.map((x) => x.id));
    const filteredEnrollments = ((e as unknown as Enrollment[]) || []).filter(
      (en: any) => empIds.has(en.employee_id) || en.employees?.branch_id === targetBranch
    );

    setPlans((p as BenefitPlan[]) || []);
    setEnrollments(filteredEnrollments);
    setEmployees(empList);
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    plans,
    setPlans,
    enrollments,
    setEnrollments,
    employees,
    setEmployees,
    loading,
    targetBranch,
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    loadData,
  };
}
