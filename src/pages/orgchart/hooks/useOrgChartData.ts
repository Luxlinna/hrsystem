import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import type { Employee } from "../types";

export function useOrgChartData(
  setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  const { role, isAdmin } = usePermissions();
  const canEditManager = isAdmin || Boolean(role?.employees_manage);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, avatar_url, reports_to, status, branches(name)")
      .order("department")
      .order("first_name");
    const list = (data || []) as unknown as Employee[];
    setEmployees(list);
    const topLevel = list.filter((e) => !e.reports_to);
    setExpandedIds(new Set(topLevel.map((e) => e.id)));
    setLoading(false);
  }, [setExpandedIds]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return {
    canEditManager,
    employees,
    setEmployees,
    loading,
    loadEmployees,
  };
}
