import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Tool, Employee, ToolAssignment, ToolUsage } from "../types";

export function useToolsData() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [assignments, setAssignments] = useState<ToolAssignment[]>([]);
  const [usages, setUsages] = useState<ToolUsage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [toolsRes, empRes] = await Promise.all([
      supabase.from("tools").select("*").order("id"),
      supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url")
        .is("deleted_at", null)
        .order("first_name"),
    ]);

    const toolList = (toolsRes.data as Tool[]) || [];
    setTools(toolList);
    setEmployees((empRes.data as Employee[]) || []);

    if (toolList.length > 0) {
      const toolIds = toolList.map((t) => t.id);
      const [assignRes, usageRes] = await Promise.all([
        supabase
          .from("tool_assignments")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
          .in("tool_id", toolIds)
          .is("revoked_at", null),
        supabase
          .from("tool_usages")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url)")
          .in("tool_id", toolIds)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      setAssignments((assignRes.data as unknown as ToolAssignment[]) || []);
      setUsages((usageRes.data as unknown as ToolUsage[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    tools,
    assignments,
    usages,
    employees,
    loading,
    loadData,
  };
}
