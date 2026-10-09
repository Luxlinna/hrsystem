import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllMovements } from "../services/movementService";
import type { EmployeeMovement } from "../types";

const EMPLOYEE_SELECT_FIELDS =
  "*, branches(name), work_locations:default_work_location_id(id, name)";

export function useMovementsData() {
  const [movements, setMovements] = useState<EmployeeMovement[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [workLocations, setWorkLocations] = useState<{ id: string; name: string; branch_id: string }[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [employeeTypes, setEmployeeTypes] = useState<string[]>(["FULL-TIME", "HOD", "INTERNSHIP", "PART-TIME"]);
  const [employeeLevels, setEmployeeLevels] = useState<string[]>(["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director", "Executive"]);
  const [contractTypes, setContractTypes] = useState<string[]>([]);
  const [jobStatuses, setJobStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [movementsData, { data: empData, error: empErr }] = await Promise.all([
        fetchAllMovements(),
        supabase
          .from("employees")
          .select(EMPLOYEE_SELECT_FIELDS)
          .is("deleted_at", null)
          .order("first_name"),
      ]);

      if (empErr) console.warn("Failed to fetch employees:", empErr);

      const formattedEmps = (empData || []).map((x: any) => ({
        ...x,
        branches: Array.isArray(x.branches) ? x.branches[0] : x.branches || null,
        work_locations: Array.isArray(x.work_locations) ? x.work_locations[0] : x.work_locations || null,
      }));
      setEmployees(formattedEmps);

      const empMap = new Map(formattedEmps.map((e: any) => [e.id, e]));
      const enrichedMovements = movementsData.map((m) => {
        const liveEmp = empMap.get(m.employee_id) || (m.employees?.id ? empMap.get(m.employees.id) : null);
        return {
          ...m,
          employees: liveEmp || m.employees,
        };
      });

      setMovements(enrichedMovements);

      const { data: branchData } = await supabase
        .from("branches")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      if (branchData) setBranches(branchData);

      const { data: locData } = await supabase
        .from("work_locations")
        .select("id, name, branch_id")
        .is("deleted_at", null)
        .order("name");
      if (locData) setWorkLocations(locData as any);

      const loadLookup = async (tbl: string, setter: (vals: string[]) => void, fallback: string[] = []) => {
        try {
          const { data, error } = await supabase
            .from(tbl)
            .select("name")
            .is("deleted_at", null)
            .order("name", { ascending: true });
          if (!error && data) {
            const vals = Array.from(new Set(data.map((d: any) => d.name).filter(Boolean))) as string[];
            setter(vals.length > 0 ? vals : fallback);
          } else if (fallback.length > 0) {
            setter(fallback);
          }
        } catch {
          if (fallback.length > 0) setter(fallback);
        }
      };

      loadLookup("departments", setDepartments);
      loadLookup("divisions", setDivisions);
      loadLookup("positions", setPositions);
      loadLookup("employee_levels", setEmployeeLevels, ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Manager", "Director", "Executive"]);
      loadLookup("contract_types", setContractTypes);
      loadLookup("job_statuses", setJobStatuses);
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
    departments,
    divisions,
    positions,
    employeeTypes,
    employeeLevels,
    contractTypes,
    jobStatuses,
    loading,
    loadData,
  };
}
