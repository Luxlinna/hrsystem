import type { EmployeeMovement } from "../types";
import { MOVEMENT_TYPES } from "../constants";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  } catch {
    return d;
  }
};

const formatSupervisor = (sup?: string | null) => {
  if (!sup || sup === "—") return "—";
  let s = String(sup).trim();
  if (s.toLowerCase() === "pisey pin") return "Pin Pisey";
  if (s.toLowerCase() === "senglong te") return "Te Senglong";
  if (s.toLowerCase() === "chem khoeurn") return "Khoeurn Chem";
  return s;
};

export function exportMovementsCSV(movements: EmployeeMovement[]): void {
  const headers = [
    "No",
    "Effective date",
    "Status Type",
    "Employee Code",
    "Employee Name",
    "Division",
    "Department",
    "Position",
    "Business Unit",
    "Site",
    "Contract Type",
    "Contract Date",
    "Employee Level",
    "Employee Type",
    "Supervisor",
    "Salary",
    "Salary After Probation",
    "Remark",
    "Status",
  ];

  const rows = movements.map((m, idx) => {
    const emp = m.employees;
    const typeConfig = MOVEMENT_TYPES[m.movement_type];
    const fullName = formatKhmerFullName(emp);
    const empCode = (emp as any)?.employee_code || (emp as any)?.biometric_user_id || (emp as any)?.candidate_code || "—";
    const division = m.new_values?.division || (emp as any)?.division || "—";
    const department = (m.new_values?.department || emp?.department || "—").toUpperCase();
    const position = m.new_values?.position || m.new_values?.role || (emp as any)?.position || emp?.role || "—";
    const buName = m.new_values?.bu || m.new_values?.branch_name || (emp as any)?.bu_full_name || emp?.branches?.name || (emp as any)?.company || "—";
    const site = m.new_values?.site || (emp as any)?.work_locations?.name || (emp as any)?.site || "—";
    const contractType = (m.new_values?.contract_type || (emp as any)?.contract_type || "—").toUpperCase();
    
    const contractStart = formatDate((emp as any)?.contract_start_date || (emp as any)?.contract_effective_date || (emp as any)?.join_date || (emp as any)?.start_date || m.effective_date);
    const contractEnd = (emp as any)?.contract_end_date ? formatDate((emp as any)?.contract_end_date) : "Ongoing";
    const contractDate = `${contractStart} - ${contractEnd}`;

    const employeeLevel = m.new_values?.employee_level || (emp as any)?.employee_level || (emp as any)?.level || "—";
    const employeeType = m.new_values?.employment_type || (emp as any)?.employment_type || "Full Time";
    const supervisor = formatSupervisor(m.new_values?.supervisor || m.new_values?.target_reports_to || (emp as any)?.line_manager || (emp as any)?.reports_to);

    const salVal = m.new_values?.salary ?? m.new_values?.new_salary ?? (emp as any)?.contract_rate ?? (emp as any)?.basic_salary;
    const salFreq = m.new_values?.contract_rate_frequency || (emp as any)?.tax_salary_frequency || "Monthly";
    const salary = salVal !== null && salVal !== undefined && !isNaN(Number(salVal)) ? `$${Number(salVal).toFixed(2)} (${salFreq})` : "—";

    const salAfterVal = m.new_values?.salary_after_contract ?? (emp as any)?.contract_rate_after;
    const salAfterFreq = m.new_values?.contract_rate_after_frequency || (emp as any)?.contract_rate_after_frequency || "Monthly";
    const salaryAfterProbation = salAfterVal !== null && salAfterVal !== undefined && !isNaN(Number(salAfterVal)) && Number(salAfterVal) > 0 ? `$${Number(salAfterVal).toFixed(2)} (${salAfterFreq})` : "—";

    const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    return [
      idx + 1,
      escapeCsv(formatDate(m.effective_date)),
      escapeCsv(typeConfig?.label || m.movement_type?.replace(/_/g, " ") || "Change Status"),
      escapeCsv(empCode),
      escapeCsv(fullName),
      escapeCsv(division),
      escapeCsv(department),
      escapeCsv(position),
      escapeCsv(buName),
      escapeCsv(site),
      escapeCsv(contractType),
      escapeCsv(contractDate),
      escapeCsv(employeeLevel),
      escapeCsv(employeeType),
      escapeCsv(supervisor),
      escapeCsv(salary),
      escapeCsv(salaryAfterProbation),
      escapeCsv(m.remarks || "—"),
      escapeCsv("Recorded"),
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `employee_change_statuses_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

