import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllMovements } from "../services/movementService";
import type { EmployeeMovement } from "../types";

export function useMovementsData() {
  const [movements, setMovements] = useState<EmployeeMovement[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [workLocations, setWorkLocations] = useState<{ id: string; name: string; branch_id?: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const movementsData = await fetchAllMovements();
      setMovements(movementsData);

      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select(`
          id, first_name, last_name, role, department, avatar_url,
          branch_id, status, branches ( name ), work_locations ( name )
        `)
        .is("deleted_at", null)
        .order("first_name");

      if (empErr) console.warn("Failed to fetch employees:", empErr);
      if (empData) setEmployees(empData);

      const { data: branchData } = await supabase
        .from("branches")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      if (branchData) setBranches(branchData);

      const { data: locData } = await supabase
        .from("work_locations")
        .select("id, name, branch_id")
        .order("name");
      if (locData) setWorkLocations(locData);
    } catch (err) {
      console.error("Error loading movements page data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleCreated = () => loadData();
    window.addEventListener("employee-movement-created", handleCreated);
    return () => window.removeEventListener("employee-movement-created", handleCreated);
  }, [loadData]);

  return {
    movements,
    employees,
    branches,
    workLocations,
    loading,
    loadData,
  };
}
