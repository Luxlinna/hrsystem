import type { Employee } from "../../types";

export function findLineManager(
  employees: Employee[],
  selectedEmployee: Employee | null,
  activeEmpId: string,
  myEmployee: Employee | null,
  myApproverName: string
): Employee | null {
  if (!selectedEmployee) return null;
  if (selectedEmployee.reports_to) {
    const found = employees.find((e) => e.id === selectedEmployee.reports_to);
    if (found) return found;
  }
  if (activeEmpId === myEmployee?.id && myApproverName) {
    const found = employees.find(
      (e) =>
        `${e.first_name || ""} ${e.last_name || ""}`.trim().toLowerCase() ===
        myApproverName.trim().toLowerCase()
    );
    if (found) return found;
  }
  return (
    employees.find(
      (e) =>
        e.id !== selectedEmployee.id &&
        (e.role?.toLowerCase().includes("manager") ||
          e.role?.toLowerCase().includes("supervisor") ||
          e.role?.toLowerCase().includes("head") ||
          e.role?.toLowerCase().includes("lead") ||
          e.role?.toLowerCase().includes("director")) &&
        (e.branch_id === selectedEmployee.branch_id ||
          (e.department && selectedEmployee.department && e.department === selectedEmployee.department))
    ) || null
  );
}
