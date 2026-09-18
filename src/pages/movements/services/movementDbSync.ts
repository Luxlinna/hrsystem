import { supabase } from "@/lib/supabase";
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
) {
  try {
    await supabase.from("audit_logs").insert({
      module: "employees",
      action: "updated",
      entity_type: "movement",
      entity_id: employee.id,
      actor_name: actorName,
      description: `${newMovement.title} for ${employee.first_name} ${employee.last_name}`,
      branch_id: newMovement.branch_id,
      metadata: {
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
          department: employeeUpdates.department || employee.department,
          avatar_url: employee.avatar_url,
          branches: employee.branches,
        },
      },
    });
  } catch (auditErr) {
    console.warn("Could not insert to audit_logs:", auditErr);
  }

  try {
    await supabase.from("employee_movements").insert({
      employee_id: newMovement.employee_id,
      movement_type: newMovement.movement_type,
      title: newMovement.title,
      effective_date: newMovement.effective_date,
      previous_values: newMovement.previous_values,
      new_values: newMovement.new_values,
      remarks: newMovement.remarks,
      document_url: newMovement.document_url,
      document_name: newMovement.document_name,
      branch_id: newMovement.branch_id,
      created_by: newMovement.created_by,
      created_by_name: newMovement.created_by_name,
    });
  } catch {
    // Table may be awaiting migration
  }
}
