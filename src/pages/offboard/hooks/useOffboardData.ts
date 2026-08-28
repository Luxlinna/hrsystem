import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { Offboarding, EmployeeOption, Branch } from "../types";

export function useOffboardData(setTab: (t: "active" | "completed" | "tasks" | "analytics") => void) {
  const { isSuperAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const [offboardings, setOffboardings] = useState<Offboarding[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setOffboardings([]);
      setEmployees([]);
      setBranches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [{ data: off }, { data: emps }, { data: brs }] = await Promise.all([
      supabase
        .from("offboarding_requests")
        .select("*, employees(first_name, last_name, role, department, branch_id, avatar_url, branches(id, name)), offboarding_tasks(*)")
        .order("last_day", { ascending: true }),
      supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, avatar_url, branch_id")
        .eq("status", "active")
        .eq("branch_id", targetBranch)
        .order("first_name"),
      supabase
        .from("branches")
        .select("id, name")
        .eq("id", targetBranch)
        .order("name"),
    ]);

    const filteredOff = (off || []).filter(
      (o: any) => !o.employees || o.employees.branch_id === targetBranch
    );

    setOffboardings(filteredOff);
    setEmployees((emps || []) as unknown as EmployeeOption[]);
    setBranches(brs || []);
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!highlightId || offboardings.length === 0) return;
    const match = offboardings.find((o) => o.id === highlightId);
    if (!match) return;
    setTab(match.status === "completed" ? "completed" : "active");
    const t = setTimeout(() => {
      const el = document.getElementById(`offboarding-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(t);
  }, [highlightId, offboardings, setTab]);

  return {
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    offboardings,
    employees,
    branches,
    loading,
    loadData,
  };
}
