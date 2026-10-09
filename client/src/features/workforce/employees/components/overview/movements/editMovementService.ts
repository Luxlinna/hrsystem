import { supabase } from "@/lib/supabase";
import { uploadFileToS3 } from "@/lib/s3-storage";
import type { Employee } from "../../../types";
import type { EmployeeMovement, MovementType } from "@/features/workforce/movements/types";
import { saveLocalMovement } from "@/features/workforce/movements/services/movementStorage";

export interface MovementEditPayload {
  title: string;
  effectiveDate: string;
  bu?: string;
  site: string;
  division?: string;
  department: string;
  position?: string;
  designation?: string;
  contractType?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  employeeType: string;
  supervisor: string;
  salaryType?: string;
  salary: number | null;
  salaryFreq?: string;
  salaryAfter?: number | null;
  salaryAfterFreq?: string;
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

  const newPos = payload.position || payload.designation || "";
  const newValues = {
    ...(movement?.new_values || {}),
    branch_name: payload.bu || movement?.new_values?.branch_name,
    bu: payload.bu || movement?.new_values?.bu,
    site: payload.site,
    division: payload.division || movement?.new_values?.division,
    department: payload.department,
    position: newPos,
    role: newPos,
    contract_type: payload.contractType || movement?.new_values?.contract_type,
    contract_start_date: payload.contractStartDate || movement?.new_values?.contract_start_date,
    contract_end_date: payload.contractEndDate || movement?.new_values?.contract_end_date,
    employment_type: payload.employeeType,
    employee_type: payload.employeeType,
    supervisor: payload.supervisor,
    salary_type: payload.salaryType || movement?.new_values?.salary_type || "Gross",
    new_salary: payload.salary,
    basic_salary: payload.salary,
    contract_rate_frequency: payload.salaryFreq || "Monthly",
    salary_after_contract: payload.salaryAfter,
    contract_rate_after_frequency: payload.salaryAfterFreq || "Monthly",
  };

  const isUuid = Boolean(movement?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movement.id));
  let savedId = movement?.id || "";

  try {
    if (isUuid && movement?.id) {
      const { data, error } = await supabase
        .from("employee_movements")
        .update({
          movement_type: movement?.movement_type || inferMovementType(payload.title),
          title: payload.title,
          effective_date: payload.effectiveDate,
          new_values: newValues,
          remarks: payload.remarks,
          document_url: docUrl,
          document_name: docName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", movement.id)
        .select("id")
        .single();
      if (!error && data?.id) savedId = data.id;
    } else {
      const { data, error } = await supabase
        .from("employee_movements")
        .insert({
          employee_id: employee.id,
          movement_type: movement?.movement_type || inferMovementType(payload.title),
          title: payload.title,
          effective_date: payload.effectiveDate,
          previous_values: movement?.previous_values || {},
          new_values: newValues,
          remarks: payload.remarks,
          document_url: docUrl,
          document_name: docName,
        })
        .select("id")
        .single();
      if (!error && data?.id) savedId = data.id;
    }
  } catch (err) {
    console.warn("Could not save to employee_movements table:", err);
  }

  const movementRecord: EmployeeMovement = {
    id: savedId || movement?.id || `mov-${Date.now()}`,
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
    const empUpdatePayload: any = {
      site: payload.site || undefined,
      department: payload.department || undefined,
      role: newPos || undefined,
      position: newPos || undefined,
      employment_type: payload.employeeType || undefined,
      line_manager: payload.supervisor || undefined,
      contract_remark: payload.remarks || undefined,
    };
    if (payload.division) empUpdatePayload.division = payload.division;
    if (payload.bu) {
      empUpdatePayload.company = payload.bu;
      empUpdatePayload.bu_full_name = payload.bu;
    }
    if (payload.salary !== null && payload.salary !== undefined) {
      empUpdatePayload.basic_salary = payload.salary;
      empUpdatePayload.contract_rate = payload.salary;
    }
    if (payload.salaryType) {
      empUpdatePayload.contract_rate_type = payload.salaryType;
    }
    await supabase.from("employees").update(empUpdatePayload).eq("id", employee.id);
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
