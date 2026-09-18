import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";
import type { EmployeeMovement, MovementFormData } from "../types";
import { getStoredLocalMovements, saveLocalMovement } from "./movementStorage";
import { buildMovementChanges, type MovementEmployeeInput } from "./movementPayloadBuilder";
import { updateEmployeeOnMovement, persistMovementRecord } from "./movementDbSync";

export { getStoredLocalMovements, saveLocalMovement };

export async function fetchAllMovements(): Promise<EmployeeMovement[]> {
  try {
    const { data: movData, error: movErr } = await supabase
      .from("employee_movements")
      .select(`
        *,
        employees (
          id, first_name, last_name, role, department, avatar_url, branch_id,
          branches ( name ), work_locations ( name )
        )
      `)
      .is("deleted_at", null)
      .order("effective_date", { ascending: false });

    if (!movErr && movData && movData.length > 0) {
      return movData as EmployeeMovement[];
    }

    const { data: auditData, error: auditErr } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("module", "employees")
      .eq("entity_type", "movement")
      .order("created_at", { ascending: false });

    if (!auditErr && auditData && auditData.length > 0) {
      const employeeIds = Array.from(new Set(auditData.map((a) => a.entity_id).filter(Boolean)));
      const empMap = new Map<string, any>();

      if (employeeIds.length > 0) {
        const { data: emps } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branch_id, branches(name), work_locations(name)")
          .in("id", employeeIds);

        if (emps) emps.forEach((e) => empMap.set(e.id, e));
      }

      const dbMovements: EmployeeMovement[] = auditData.map((a) => {
        const meta = a.metadata || {};
        const emp = a.entity_id ? empMap.get(a.entity_id) : null;
        return {
          id: a.id,
          employee_id: a.entity_id || meta.employee_id || "",
          movement_type: meta.movement_type || "promote",
          title: meta.title || a.description || "Personnel Movement",
          effective_date: meta.effective_date || a.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          previous_values: meta.previous_values || {},
          new_values: meta.new_values || {},
          remarks: meta.remarks || a.description || "",
          document_url: meta.document_url || null,
          document_name: meta.document_name || null,
          branch_id: a.branch_id || meta.branch_id || null,
          created_by: a.actor_name || null,
          created_by_name: a.actor_name || "HR Admin",
          created_at: a.created_at,
          employees: emp || meta.employee_snapshot || null,
        };
      });

      const local = getStoredLocalMovements();
      const combined = [...dbMovements];
      local.forEach((loc) => {
        if (!combined.some((c) => c.id === loc.id)) {
          combined.push(loc);
        }
      });
      return combined;
    }

    return getStoredLocalMovements();
  } catch (err) {
    console.warn("fetchMovements dynamic fallback:", err);
    return getStoredLocalMovements();
  }
}

export async function fetchMovementsByEmployeeId(employeeId: string): Promise<EmployeeMovement[]> {
  const all = await fetchAllMovements();
  return all.filter((m) => m.employee_id === employeeId || m.employees?.id === employeeId);
}

interface CreateMovementParams {
  form: MovementFormData;
  employee: MovementEmployeeInput;
  currentUser?: {
    id?: string;
    email?: string;
    displayName?: string;
  } | null;
}

export async function recordEmployeeMovement({
  form,
  employee,
  currentUser,
}: CreateMovementParams): Promise<EmployeeMovement> {
  let documentUrl: string | null = null;
  let documentName: string | null = null;

  if (form.document_file) {
    try {
      const safeName = form.document_file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `movements/${Date.now()}_${safeName}`;
      documentUrl = await uploadFile("documents", storagePath, form.document_file);
      documentName = form.document_file.name;
    } catch (uploadErr) {
      console.warn("Movement document upload notice:", uploadErr);
      documentName = form.document_file.name;
      documentUrl = URL.createObjectURL(form.document_file);
    }
  }

  const { title, prev, next, employeeUpdates } = buildMovementChanges(form, employee);
  await updateEmployeeOnMovement(employee.id, employeeUpdates);

  const actorName = currentUser?.displayName || currentUser?.email || "HR Admin";
  const newMovement: EmployeeMovement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    employee_id: employee.id,
    movement_type: form.movement_type,
    title,
    effective_date: form.effective_date || new Date().toISOString().split("T")[0],
    previous_values: prev,
    new_values: next,
    remarks: form.remarks || "",
    document_url: documentUrl,
    document_name: documentName,
    branch_id: form.target_branch_id || employee.branch_id || null,
    created_by: currentUser?.id || null,
    created_by_name: actorName,
    created_at: new Date().toISOString(),
    employees: {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      role: employeeUpdates.role || employee.role,
      department: employeeUpdates.department || employee.department,
      avatar_url: employee.avatar_url,
      branch_id: employeeUpdates.branch_id || employee.branch_id,
      branches: employee.branches,
      work_locations: employee.work_locations,
    },
  };

  await persistMovementRecord(newMovement, employee, employeeUpdates, actorName);
  saveLocalMovement(newMovement);
  window.dispatchEvent(new CustomEvent("employee-movement-created", { detail: newMovement }));

  return newMovement;
}
