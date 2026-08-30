import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Branch } from "../types";

export function useBranchesData() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBranches = useCallback(async () => {
    const { data } = await supabase
      .from("branches")
      .select(
        "id, name, location, manager_name, employee_count, status, created_at, latitude, longitude, geofence_radius_m, work_start_time, work_end_time, deleted_at, deleted_by"
      )
      .is("deleted_at", null)
      .order("employee_count", { ascending: false });
    setBranches(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBranches();
    const channel = supabase
      .channel("branches-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, () => loadBranches())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBranches]);

  return {
    branches,
    setBranches,
    loading,
    loadBranches,
  };
}
