import type { EmployeeMovement } from "../types";
import { MOVEMENT_TYPES } from "../constants";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

const getXLSX = async () => {
  return await import("xlsx");
};

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

export async function exportMovementsXLSX(movements: EmployeeMovement[]): Promise<boolean> {
  const data =
    movements.length > 0
      ? movements.map((m, idx) => {
          const emp = m.employees;
          const typeConfig = MOVEMENT_TYPES[m.movement_type];
          const fullName = formatKhmerFullName(emp);
          const buName = m.new_values?.bu || (emp as any)?.bu_full_name || emp?.branches?.name || (emp as any)?.company || "—";
          const employeeCode = (emp as any)?.employee_code || (emp as any)?.candidate_code || (emp as any)?.id?.slice(0, 8) || m.employee_id?.slice(0, 8) || "—";
          const position = m.new_values?.role || m.new_values?.designation || emp?.role || (emp as any)?.position || "—";
          const division = m.new_values?.division || (emp as any)?.division || "—";
          const department = (m.new_values?.department || emp?.department || "—").toUpperCase();
          const site = m.new_values?.site || (emp as any)?.work_locations?.name || (emp as any)?.site || "—";
          const joiningDate = formatDate((emp as any)?.join_date || (emp as any)?.start_date);
          const contractType = (m.new_values?.contract_type || (emp as any)?.contract_type || "—").toUpperCase();
          const contractStart = formatDate((emp as any)?.contract_start_date || (emp as any)?.start_date || m.effective_date);
          const contractEnd = (emp as any)?.contract_end_date ? formatDate((emp as any)?.contract_end_date) : "Ongoing";
          const contractPeriod = `${contractStart} - ${contractEnd}`;
          const rateVal = m.new_values?.salary ?? m.new_values?.new_salary ?? (emp as any)?.contract_rate ?? (emp as any)?.basic_salary ?? "0";
          const rateFreq = m.new_values?.contract_rate_frequency || (emp as any)?.tax_salary_frequency || "Monthly";
          const rateStruct = (emp as any)?.payroll_structure === "Standard Monthly" ? "Gross" : ((emp as any)?.payroll_structure || "Gross");
          const rate = `${rateVal} USD (${rateFreq} ${rateStruct})`;

          return {
            "No.": idx + 1,
            "Effective Date": formatDate(m.effective_date),
            "Status Type": typeConfig?.label || m.movement_type?.replace(/_/g, " ") || "Change Status",
            "Employee Name": fullName,
            "Employee Code": employeeCode,
            "Business Unit (BU)": buName,
            "Position": position,
            "Division": division,
            "Department": department,
            "Site": site,
            "Joining Date": joiningDate,
            "Contract Type": contractType,
            "Contract Period": contractPeriod,
            "Rate": rate,
            "Status": "Recorded",
          };
        })
      : [
          {
            "No.": "—",
            "Effective Date": "—",
            "Status Type": "—",
            "Employee Name": "No records found",
            "Employee Code": "—",
            "Business Unit (BU)": "—",
            "Position": "—",
            "Division": "—",
            "Department": "—",
            "Site": "—",
            "Joining Date": "—",
            "Contract Type": "—",
            "Contract Period": "—",
            "Rate": "—",
            "Status": "—",
          },
        ];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employee Change Statuses");
  XLSX.writeFile(wb, `employee_change_statuses_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
