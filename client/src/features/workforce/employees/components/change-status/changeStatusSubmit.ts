import { recordEmployeeMovement } from "@/features/workforce/movements/services/movementService";
import type { MovementFormData, MovementType } from "@/features/workforce/movements/types";
import { STATUS_TYPES, type BranchOption } from "./types";

interface SubmitParams {
  selectedEmployee: any;
  statusType: string;
  effectiveDate: string;
  bu?: string;
  site?: string;
  division?: string;
  department: string;
  position?: string;
  designation?: string;
  employeeType: string;
  supervisor: string;
  salaryType: string;
  salary: string;
  remark: string;
  attachmentFile: File | null;
  allBuOptions: BranchOption[];
  dbWorkLocations?: Array<{ id: string; name: string; branch_id: string | null }>;
  user: any;
}

export async function submitChangeStatus({
  selectedEmployee,
  statusType,
  effectiveDate,
  bu,
  site,
  division,
  department,
  position,
  designation,
  employeeType,
  supervisor,
  salaryType,
  salary,
  remark,
  attachmentFile,
  allBuOptions,
  dbWorkLocations = [],
  user,
}: SubmitParams) {
  const matched = STATUS_TYPES.find((s) => s.label === statusType);
  const movementType: MovementType = matched?.type || "transfer";
  const buQuery = (bu || site || "").toLowerCase();
  const matchedBranch = allBuOptions.find((b) => b.name.toLowerCase() === buQuery || b.id === buQuery);
  const siteQuery = (site || "").trim().toLowerCase();
  const matchedLocation = dbWorkLocations.find(
    (w) => w.name.trim().toLowerCase() === siteQuery || w.id === site
  );
  const resolvedPosition = position || designation || "";

  const formData: MovementFormData = {
    employee_id: selectedEmployee.id,
    movement_type: movementType,
    title: statusType,
    effective_date: effectiveDate,
    remarks: remark,
    document_file: attachmentFile,
    bu: bu || matchedBranch?.name || undefined,
    bu_full_name: bu || matchedBranch?.name || undefined,
    site: matchedLocation?.name || site || undefined,
    target_branch_id: matchedBranch?.id || selectedEmployee.branch_id,
    target_work_location_id: matchedLocation?.id || selectedEmployee.default_work_location_id,
    division: division || undefined,
    department: department,
    target_department: department,
    designation: resolvedPosition,
    position: resolvedPosition,
    new_role: resolvedPosition,
    employee_type: employeeType,
    supervisor: supervisor,
    salary: salary ? parseFloat(salary) : undefined,
    salary_freq: "Monthly",
    new_salary: salary ? parseFloat(salary) : undefined,
  };
  (formData as any).salary_type = salaryType;

  return recordEmployeeMovement({
    form: formData,
    employee: selectedEmployee,
    currentUser: {
      id: user?.id,
      email: user?.email,
      displayName: (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "HR Admin",
    },
  });
}
