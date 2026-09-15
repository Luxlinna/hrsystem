import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";
import type { EmployeeMovement, MovementFormData } from "../types";

const LOCAL_STORAGE_KEY = "hrm_ops_employee_movements";

// Clear out any old static/demo seed data from previous versions
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw && (raw.includes("mov-demo-") || raw.includes("Sophea Chan"))) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

function getStoredLocalMovements(): EmployeeMovement[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed: EmployeeMovement[] = JSON.parse(raw);
    // Filter out any demo data
    return parsed.filter((m) => !m.id.startsWith("mov-demo-"));
  } catch {
    return [];
  }
}

function saveLocalMovement(movement: EmployeeMovement) {
  try {
    const current = getStoredLocalMovements();
    const updated = [movement, ...current.filter((m) => m.id !== movement.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save movement locally:", err);
  }
}

/**
 * Dynamically fetch all movements from the database.
 * 1. Attempts employee_movements table.
 * 2. Falls back to audit_logs where module='employees' and entity_type='movement'.
 * 3. Merges with any locally created movements (no static dummy data).
 */
export async function fetchAllMovements(): Promise<EmployeeMovement[]> {
  try {
    // 1. Try dedicated employee_movements table
    const { data: movData, error: movErr } = await supabase
      .from("employee_movements")
      .select(`
        *,
        employees (
          id,
          first_name,
          last_name,
          role,
          department,
          avatar_url,
          branch_id,
          branches ( name ),
          work_locations ( name )
        )
      `)
      .is("deleted_at", null)
      .order("effective_date", { ascending: false });

    if (!movErr && movData && movData.length > 0) {
      return movData as EmployeeMovement[];
    }

    // 2. Query dynamic movement records stored in audit_logs
    const { data: auditData, error: auditErr } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("module", "employees")
      .eq("entity_type", "movement")
      .order("created_at", { ascending: false });

    if (!auditErr && auditData && auditData.length > 0) {
      // Fetch the corresponding real employees dynamically
      const employeeIds = Array.from(new Set(auditData.map((a) => a.entity_id).filter(Boolean)));
      let empMap = new Map<string, any>();

      if (employeeIds.length > 0) {
        const { data: emps } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branch_id, branches(name), work_locations(name)")
          .in("id", employeeIds);

        if (emps) {
          emps.forEach((e) => empMap.set(e.id, e));
        }
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

      // Merge with any local user-created records
      const local = getStoredLocalMovements();
      const combined = [...dbMovements];
      local.forEach((loc) => {
        if (!combined.some((c) => c.id === loc.id)) {
          combined.push(loc);
        }
      });
      return combined;
    }

    // 3. If no DB records yet, return real user-created local records or empty array
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
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    role?: string | null;
    department?: string | null;
    branch_id?: string | null;
    default_work_location_id?: string | null;
    status?: string | null;
    branches?: { name: string } | null;
    work_locations?: { name: string } | null;
    avatar_url?: string | null;
  };
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
  // 1. Handle file upload if present
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

  // 2. Prepare previous vs new values & title according to movement type
  let title = "";
  const prev: Record<string, any> = {};
  const next: Record<string, any> = {};
  const employeeUpdates: Record<string, any> = {};

  switch (form.movement_type) {
    case "probation":
      title = `Probation Period Set (${form.probation_months || 3} Months)`;
      prev.status = employee.status || "active";
      next.status = "probation";
      next.probation_months = form.probation_months || 3;
      next.probation_end_date = form.probation_end_date;
      employeeUpdates.status = "probation";
      break;

    case "pass_probation":
      title = `Passed Probation Confirmation`;
      prev.status = employee.status || "probation";
      next.status = "active";
      next.rating = form.rating || "Good Performance";
      employeeUpdates.status = "active";
      break;

    case "transfer":
      title = `Inter-Branch / Department Transfer`;
      prev.branch_id = employee.branch_id;
      prev.branch_name = employee.branches?.name || "Main Branch";
      prev.department = employee.department || "General";
      next.branch_id = form.target_branch_id || employee.branch_id;
      next.department = form.target_department || employee.department;
      next.work_location_id = form.target_work_location_id;
      if (form.target_branch_id) employeeUpdates.branch_id = form.target_branch_id;
      if (form.target_department) employeeUpdates.department = form.target_department;
      if (form.target_work_location_id) employeeUpdates.default_work_location_id = form.target_work_location_id;
      break;

    case "promote":
      title = `Promotion to ${form.new_role || "Higher Role"}`;
      prev.role = employee.role || "Staff";
      next.role = form.new_role;
      if (form.new_grade) next.grade = form.new_grade;
      if (form.salary_increase) next.salary_increase = form.salary_increase;
      if (form.new_role) employeeUpdates.role = form.new_role;
      break;

    case "demote":
      title = `Reclassification to ${form.demote_new_role || "Adjusted Role"}`;
      prev.role = employee.role || "Staff";
      next.role = form.demote_new_role;
      next.reason = form.demote_reason;
      if (form.demote_new_role) employeeUpdates.role = form.demote_new_role;
      break;

    case "salary_adjustment":
      title = `Salary Adjustment (${form.adjustment_type || "Merit Review"})`;
      prev.salary = form.current_salary;
      next.salary = form.new_salary;
      next.currency = form.currency || "USD";
      next.adjustment_type = form.adjustment_type;
      break;

    case "change_contract":
      title = `Contract Renewal / Type Change (${form.contract_type || "Standard"})`;
      prev.contract_type = "Previous Contract";
      next.contract_type = form.contract_type;
      next.start_date = form.contract_start_date;
      next.end_date = form.contract_end_date;
      break;
  }

  // 3. Update employee table live in the database
  if (Object.keys(employeeUpdates).length > 0) {
    try {
      await supabase
        .from("employees")
        .update(employeeUpdates)
        .eq("id", employee.id);
    } catch (empErr) {
      console.warn("Could not live-update employee table:", empErr);
    }
  }

  // 4. Construct new movement record
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

  // 5. Insert directly into Supabase audit_logs (which exists in the database)
  try {
    await supabase.from("audit_logs").insert({
      module: "employees",
      action: "updated",
      entity_type: "movement",
      entity_id: employee.id,
      actor_name: actorName,
      description: `${title} for ${employee.first_name} ${employee.last_name}`,
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

  // 6. Also attempt insert into employee_movements table
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

  // Save to active local cache
  saveLocalMovement(newMovement);

  // Dispatch live event to notify all listening components
  window.dispatchEvent(new CustomEvent("employee-movement-created", { detail: newMovement }));

  return newMovement;
}
