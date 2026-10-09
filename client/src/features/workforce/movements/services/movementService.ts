import { supabase } from "@/lib/supabase";
import { uploadFileToS3 } from "@/lib/s3-storage";
import type { EmployeeMovement, MovementFormData } from "../types";
import {
  getStoredLocalMovements,
  saveLocalMovement,
  deleteLocalMovement,
  getDeletedMovementIds,
} from "./movementStorage";
import { buildMovementChanges, type MovementEmployeeInput } from "./movementPayloadBuilder";
import { updateEmployeeOnMovement, persistMovementRecord, recordInitialJoiningMovement } from "./movementDbSync";

export { getStoredLocalMovements, saveLocalMovement, deleteLocalMovement, recordInitialJoiningMovement };

export async function fetchAllMovements(): Promise<EmployeeMovement[]> {
  const deletedIds = getDeletedMovementIds();
  try {
    const { data: movData, error: movErr } = await supabase
      .from("employee_movements")
      .select("*, employees(*, branches(name), work_locations:default_work_location_id(id, name))")
      .is("deleted_at", null)
      .order("effective_date", { ascending: false });

    if (!movErr && movData && movData.length > 0) {
      return (movData as EmployeeMovement[]).filter((m) => !deletedIds.has(m.id));
    }

    const { data: auditData, error: auditErr } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("module", "employees")
      .eq("entity_type", "movement")
      .order("created_at", { ascending: false });

    if (!auditErr && auditData && auditData.length > 0) {
      const filteredAudit = auditData.filter((a) => !deletedIds.has(a.id) && !deletedIds.has(a.metadata?.id));
      const employeeIds = Array.from(new Set(filteredAudit.map((a) => a.entity_id).filter(Boolean)));
      const empMap = new Map<string, any>();

      if (employeeIds.length > 0) {
        const { data: emps } = await supabase
          .from("employees")
          .select("*, branches(name), work_locations:default_work_location_id(id, name)")
          .in("id", employeeIds);
        emps?.forEach((e) => {
          empMap.set(e.id, {
            ...e,
            branches: Array.isArray(e.branches) ? e.branches[0] : e.branches || null,
            work_locations: Array.isArray(e.work_locations) ? e.work_locations[0] : e.work_locations || null,
          });
        });
      }

      const dbMovements: EmployeeMovement[] = filteredAudit.map((a) => {
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
        if (!combined.some((c) => c.id === loc.id)) combined.push(loc);
      });
      return combined.filter((m) => !deletedIds.has(m.id));
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

export async function deleteMovement(id: string): Promise<boolean> {
  try {
    deleteLocalMovement(id);
    await Promise.allSettled([
      supabase.from("employee_movements").delete().eq("id", id),
      supabase.from("employee_movements").update({ deleted_at: new Date().toISOString() }).eq("id", id),
      supabase.from("audit_logs").delete().eq("id", id),
    ]);
    window.dispatchEvent(new CustomEvent("employee-movement-created"));
    return true;
  } catch (err) {
    console.warn("Delete movement fallback:", err);
    deleteLocalMovement(id);
    window.dispatchEvent(new CustomEvent("employee-movement-created"));
    return true;
  }
}

interface CreateMovementParams {
  form: MovementFormData;
  employee: MovementEmployeeInput;
  currentUser?: { id?: string; email?: string; displayName?: string } | null;
}

export async function recordEmployeeMovement({
  form, employee, currentUser,
}: CreateMovementParams): Promise<EmployeeMovement> {
  let documentUrl: string | null = null;
  let documentName: string | null = null;

  if (form.document_file) {
    try {
      const s3Item = await uploadFileToS3(form.document_file, `employees/${employee.id}/movements`);
      documentUrl = s3Item.url;
      documentName = form.document_file.name;
    } catch {
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

