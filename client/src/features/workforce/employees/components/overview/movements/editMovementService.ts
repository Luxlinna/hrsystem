import { supabase } from "@/lib/supabase";
import { uploadFileToS3 } from "@/lib/s3-storage";
import type { Employee } from "../../../types";
import type { EmployeeMovement, MovementType } from "@/features/workforce/movements/types";
import { saveLocalMovement } from "@/features/workforce/movements/services/movementStorage";

export interface MovementEditPayload {
  title: string;
  effectiveDate: string;
  site: string;
  department: string;
  designation: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate: string;
  employeeType: string;
  supervisor: string;
  salary: number | null;
  salaryFreq: string;
  salaryAfter: number | null;
  salaryAfterFreq: string;
  remarks: string;
  file?: File | null;
}

function inferMovementType(title: string): MovementType {
  const t = title.toLowerCase();
  if (t.includes("promot")) return "promote";
  if (t.includes("transfer") || t.includes("branch") || t.includes("site")) return "transfer";
  if (t.includes("salary") || t.includes("wage") || t.includes("compensation")) return "salary_adjustment";
  if (t.includes("pass") || t.includes("probation")) return "pass_probation";
  if (t.includes("contract") || t.includes("renew") || t.includes("extend")) return "change_contract";
  if (t.includes("demot")) return "demote";
  return "transfer";
}

export async function saveMovementInfo(
  employee: Employee,
  movement: EmployeeMovement | null,
  payload: MovementEditPayload
): Promise<EmployeeMovement> {
  let docUrl = movement?.document_url || null;
  let docName = movement?.document_name || null;

  if (payload.file) {
    try {
      const s3Item = await uploadFileToS3(payload.file, `employees/${employee.id}/movements`);
      docUrl = s3Item.url;
      docName = payload.file.name;
    } catch (err) {
      console.warn("Could not upload file to AWS S3:", err);
    }
  }

  const newValues = {
    ...(movement?.new_values || {}),
    site: payload.site,
    department: payload.department,
    role: payload.designation,
    contract_type: payload.contractType,
    contract_start_date: payload.contractStartDate,
    contract_end_date: payload.contractEndDate,
    employment_type: payload.employeeType,
    supervisor: payload.supervisor,
    new_salary: payload.salary,
    contract_rate_frequency: payload.salaryFreq,
    salary_after_contract: payload.salaryAfter,
    contract_rate_after_frequency: payload.salaryAfterFreq,
  };

  const isInitialMock = !movement?.id || movement.id.startsWith("initial-");
  const movId = isInitialMock ? `mov-${Date.now()}` : movement.id;

  const movementRecord: EmployeeMovement = {
    id: movId,
    employee_id: employee.id,
    movement_type: movement?.movement_type || inferMovementType(payload.title),
    title: payload.title,
    effective_date: payload.effectiveDate,
    previous_values: movement?.previous_values || {},
    new_values: newValues,
    remarks: payload.remarks,
    document_url: docUrl,
    document_name: docName,
    created_at: movement?.created_at || new Date().toISOString(),
  };

  try {
    await supabase.from("employee_movements").upsert([{
      id: movId,
      employee_id: employee.id,
      movement_type: movementRecord.movement_type,
      title: movementRecord.title,
      effective_date: movementRecord.effective_date,
      previous_values: movementRecord.previous_values,
      new_values: movementRecord.new_values,
      remarks: movementRecord.remarks,
      document_url: docUrl,
      document_name: docName,
    }]);
  } catch (err) {
    console.warn("Could not save to employee_movements table:", err);
  }

  try {
    await supabase.from("employees").update({
      site: payload.site,
      department: payload.department,
      role: payload.designation,
      position: payload.designation,
      contract_type: payload.contractType,
      contract_effective_date: payload.contractStartDate || null,
      contract_end_date: payload.contractEndDate || null,
      employment_type: payload.employeeType,
      line_manager: payload.supervisor,
      basic_salary: payload.salary,
      contract_rate: payload.salary,
      contract_rate_frequency: payload.salaryFreq,
      contract_rate_after: payload.salaryAfter,
      contract_rate_after_frequency: payload.salaryAfterFreq,
      contract_remark: payload.remarks,
    }).eq("id", employee.id);
  } catch (err) {
    console.warn("Could not sync employee profile fields:", err);
  }

  return movementRecord;
}

export async function applyNewMovement(
  employee: Employee,
  payload: MovementEditPayload
): Promise<EmployeeMovement> {
  const prevValues = {
    site: employee.site || employee.code_bu || "",
    department: employee.department || "",
    role: employee.role || employee.position || "",
    contract_type: employee.contract_type || "",
    contract_start_date: employee.contract_effective_date || employee.join_date || "",
    contract_end_date: employee.contract_end_date || "",
    employment_type: employee.employment_type || "FULL-TIME",
    supervisor: employee.line_manager || "",
    salary: employee.basic_salary || employee.contract_rate || null,
    contract_rate_frequency: employee.contract_rate_frequency || "Monthly",
  };

  const newMovement = await saveMovementInfo(
    employee,
    {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employee_id: employee.id,
      movement_type: inferMovementType(payload.title),
      title: payload.title,
      effective_date: payload.effectiveDate,
      previous_values: prevValues,
      new_values: {},
      remarks: payload.remarks,
      created_at: new Date().toISOString(),
    },
    payload
  );

  saveLocalMovement(newMovement);
  window.dispatchEvent(new CustomEvent("employee-movement-created", { detail: newMovement }));
  return newMovement;
}
