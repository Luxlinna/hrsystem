import { supabase } from "@/lib/supabase";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";
import type { EmployeeMovement } from "../types";
import type { MovementEmployeeInput } from "./movementPayloadBuilder";

export async function updateEmployeeOnMovement(
  employeeId: string,
  employeeUpdates: Record<string, any>
) {
  if (Object.keys(employeeUpdates).length === 0) return;
  try {
    await supabase.from("employees").update(employeeUpdates).eq("id", employeeId);
  } catch (empErr) {
    console.warn("Could not live-update employee table:", empErr);
  }
}

export async function persistMovementRecord(
  newMovement: EmployeeMovement,
  employee: MovementEmployeeInput,
  employeeUpdates: Record<string, any>,
  actorName: string
): Promise<string | null> {
  let createdDbId: string | null = null;

  try {
    const { data, error } = await supabase
      .from("employee_movements")
      .insert({
        employee_id: newMovement.employee_id,
        movement_type: newMovement.movement_type,
        title: newMovement.title,
        effective_date: newMovement.effective_date,
        previous_values: newMovement.previous_values || {},
        new_values: newMovement.new_values || {},
        remarks: newMovement.remarks || null,
        document_url: newMovement.document_url || null,
        document_name: newMovement.document_name || null,
        branch_id: newMovement.branch_id || null,
        created_by: newMovement.created_by || null,
        created_by_name: newMovement.created_by_name || null,
      })
      .select("id")
      .single();

    if (!error && data?.id) {
      createdDbId = data.id;
    }
  } catch (err) {
    console.warn("Could not insert to employee_movements table:", err);
  }

  try {
    await supabase.from("audit_logs").insert({
      module: "employees",
      action: "updated",
      entity_type: "movement",
      entity_id: employee.id,
      actor_name: actorName,
      description: `${newMovement.title} for ${formatKhmerFullName(employee)}`,
      branch_id: newMovement.branch_id,
      metadata: {
        id: createdDbId || newMovement.id,
        movement_type: newMovement.movement_type,
        title: newMovement.title,
        effective_date: newMovement.effective_date,
        previous_values: newMovement.previous_values,
        new_values: newMovement.new_values,
        remarks: newMovement.remarks,
        document_url: newMovement.document_url,
        document_name: newMovement.document_name,
        branch_id: newMovement.branch_id,
        employee_snapshot: {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          role: employeeUpdates.role || employee.role,
          position: employeeUpdates.position || employee.position || employeeUpdates.role || employee.role,
          division: employeeUpdates.division || employee.division,
          department: employeeUpdates.department || employee.department,
          avatar_url: employee.avatar_url,
          branches: employee.branches,
        },
      },
    });
  } catch (auditErr) {
    console.warn("Could not insert to audit_logs:", auditErr);
  }

  return createdDbId;
}

export async function recordInitialJoiningMovement(
  employee: any,
  actorName: string = "HR Admin"
): Promise<EmployeeMovement> {
  const site =
    employee.site ||
    employee.code_bu ||
    (Array.isArray(employee.branches) ? employee.branches[0]?.name : employee.branches?.name) ||
    employee.work_locations?.name ||
    "—";
  const department = employee.department || employee.division || "—";
  const role = employee.position || employee.role || employee.employee_level || "Staff";
  const supervisor = employee.line_manager || employee.reports_to || "—";
  const contractType = employee.contract_type || "PERMANENT (UDC)";
  const employeeType = employee.employment_type || "Full Time";
  const rawSalary = employee.basic_salary ?? employee.contract_rate ?? 0;
  const rawSalaryAfter = employee.contract_rate_after ?? 0;
  const remarks = employee.contract_remark || "Initial Employment Joining Record";
  const joinDate = employee.join_date || employee.start_date || new Date().toISOString().split("T")[0];

  const initialMovement: EmployeeMovement = {
    id: `join-${employee.id}`,
    employee_id: employee.id,
    movement_type: "change_contract",
    title: "Join",
    effective_date: joinDate,
    previous_values: {},
    new_values: {
      site,
      department,
      role,
      contract_type: contractType,
      employment_type: employeeType,
      supervisor,
      new_salary: rawSalary,
      salary_after_contract: rawSalaryAfter,
      basic_salary: rawSalary,
    },
    remarks,
    created_by_name: actorName,
    created_at: new Date().toISOString(),
    employees: {
      id: employee.id,
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      role: employee.role || employee.position || "Staff",
      department: employee.department || "",
      avatar_url: employee.avatar_url || null,
      branch_id: employee.branch_id || null,
      branches: employee.branches,
      work_locations: employee.work_locations,
    },
  };

  await persistMovementRecord(initialMovement, employee, {}, actorName);
  return initialMovement;
}
