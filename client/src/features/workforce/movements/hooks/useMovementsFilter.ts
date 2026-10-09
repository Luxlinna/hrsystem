import { useMemo } from "react";
import type { EmployeeMovement } from "../types";

interface UseMovementsFilterProps {
  movements: EmployeeMovement[];
  search: string;
  selectedStatus: string;
  filterDateOption?: string;
  filterContractType: string[];
  filterJobStatus: string[];
  filterBranch: string;
  filterWorkLocation: string;
  filterDivision: string;
  filterDept: string;
  filterRole: string;
  filterEmployeeType: string;
  filterEmployeeLevel: string;
}

export function useMovementsFilter({
  movements,
  search,
  selectedStatus,
  filterDateOption = "all",
  filterContractType,
  filterJobStatus,
  filterBranch,
  filterWorkLocation,
  filterDivision,
  filterDept,
  filterRole,
  filterEmployeeType,
  filterEmployeeLevel,
}: UseMovementsFilterProps) {
  return useMemo(() => {
    return movements.filter((m) => {
      const emp = m.employees;

      if (search.trim()) {
        const q = search.toLowerCase();
        const fullName = (emp as any)?.full_name || (emp as any)?.display_name || `${emp?.last_name || ""} ${emp?.first_name || ""}`.trim();
        const nameMatch = fullName.toLowerCase().includes(q) || (emp as any)?.kh_name?.toLowerCase().includes(q) || false;
        const roleMatch = emp?.role?.toLowerCase().includes(q) || false;
        const deptMatch = emp?.department?.toLowerCase().includes(q) || false;
        const idMatch = m.employee_id?.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
        const titleMatch = m.title?.toLowerCase().includes(q);
        const codeMatch = (emp as any)?.employee_code?.toLowerCase().includes(q) || (emp as any)?.candidate_code?.toLowerCase().includes(q);
        if (!nameMatch && !roleMatch && !deptMatch && !idMatch && !titleMatch && !codeMatch) return false;
      }

      if (selectedStatus && (emp as any)?.status !== selectedStatus) return false;

      if (filterDateOption && filterDateOption !== "all") {
        const effDate = m.effective_date ? new Date(m.effective_date) : null;
        if (effDate && !isNaN(effDate.getTime())) {
          if (filterDateOption.startsWith("custom:")) {
            const parts = filterDateOption.split(":");
            const start = parts[1] ? new Date(parts[1]) : null;
            const end = parts[2] ? new Date(parts[2]) : null;
            if (start && effDate < start) return false;
            if (end && effDate > end) return false;
          } else {
            const now = new Date();
            if (filterDateOption === "today") {
              if (effDate.toDateString() !== now.toDateString()) return false;
            } else if (filterDateOption === "this_week") {
              const startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - now.getDay());
              if (effDate < startOfWeek) return false;
            } else if (filterDateOption === "this_month") {
              if (effDate.getMonth() !== now.getMonth() || effDate.getFullYear() !== now.getFullYear()) return false;
            } else if (filterDateOption === "last_month") {
              const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              if (effDate.getMonth() !== lastM.getMonth() || effDate.getFullYear() !== lastM.getFullYear()) return false;
            } else if (filterDateOption === "this_year") {
              if (effDate.getFullYear() !== now.getFullYear()) return false;
            } else if (filterDateOption === "last_year") {
              if (effDate.getFullYear() !== now.getFullYear() - 1) return false;
            }
          }
        }
      }

      if (filterContractType.length > 0) {
        const cType = (m.new_values?.contract_type || (emp as any)?.contract_type || "").toUpperCase();
        if (!filterContractType.some((ct) => ct.toUpperCase() === cType)) return false;
      }

      if (filterJobStatus.length > 0 && !filterJobStatus.includes((emp as any)?.status || "")) return false;

      if (filterBranch && filterBranch !== "all") {
        const branchIds = filterBranch.split(",").map((s) => s.trim()).filter(Boolean);
        const empBranch = (emp as any)?.branch_id || (emp as any)?.branches?.id || (emp as any)?.branches?.name;
        const match = branchIds.some((b) => b === empBranch || b === m.branch_id || (emp as any)?.branches?.name?.toLowerCase() === b.toLowerCase());
        if (!match) return false;
      }

      if (filterWorkLocation && filterWorkLocation !== "all") {
        const locIds = filterWorkLocation.split(",").map((s) => s.trim()).filter(Boolean);
        const empLoc = (emp as any)?.default_work_location_id || (emp as any)?.site || (emp as any)?.work_locations?.name;
        const match = locIds.some((l) => l === empLoc || (emp as any)?.work_locations?.name?.toLowerCase() === l.toLowerCase());
        if (!match) return false;
      }

      if (filterDivision) {
        const divs = filterDivision.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        if (divs.length > 0 && !divs.includes((m.new_values?.division || (emp as any)?.division || "").toLowerCase())) return false;
      }

      if (filterDept) {
        const deptsArr = filterDept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        if (deptsArr.length > 0 && !deptsArr.includes((m.new_values?.department || (emp as any)?.department || "").toLowerCase())) return false;
      }

      if (filterRole) {
        const rolesArr = filterRole.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        const empRole = (m.new_values?.role || m.new_values?.designation || (emp as any)?.position || (emp as any)?.role || "").toLowerCase();
        if (rolesArr.length > 0 && !rolesArr.includes(empRole)) return false;
      }

      if (filterEmployeeType) {
        const typesArr = filterEmployeeType.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        if (typesArr.length > 0 && !typesArr.includes((m.new_values?.employment_type || (emp as any)?.employment_type || "").toLowerCase())) return false;
      }

      if (filterEmployeeLevel) {
        const levelsArr = filterEmployeeLevel.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        if (levelsArr.length > 0 && !levelsArr.includes(((emp as any)?.employee_level || "").toLowerCase())) return false;
      }

      return true;
    });
  }, [
    movements,
    search,
    selectedStatus,
    filterDateOption,
    filterContractType,
    filterJobStatus,
    filterBranch,
    filterWorkLocation,
    filterDivision,
    filterDept,
    filterRole,
    filterEmployeeType,
    filterEmployeeLevel,
  ]);
}
