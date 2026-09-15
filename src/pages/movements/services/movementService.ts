import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";
import type { EmployeeMovement, MovementFormData } from "../types";

const LOCAL_STORAGE_KEY = "hrm_ops_employee_movements";

// Initial seed movements to provide a realistic experience on first load
const INITIAL_DEMO_MOVEMENTS: EmployeeMovement[] = [
  {
    id: "mov-demo-001",
    employee_id: "",
    movement_type: "promote",
    title: "Promoted to Senior Operations Lead",
    effective_date: "2026-08-01",
    previous_values: { role: "Operations Specialist", grade: "L2" },
    new_values: { role: "Senior Operations Lead", grade: "L3", salary_increase: 350 },
    remarks: "Outstanding leadership during Q2 logistics reorganization.",
    document_url: "https://example.com/docs/promotion_letter_sophea.pdf",
    document_name: "Promotion_Letter_Signed.pdf",
    branch_id: null,
    created_by_name: "HR Operations",
    created_at: "2026-08-01T08:30:00Z",
    employees: {
      id: "emp-demo-1",
      first_name: "Sophea",
      last_name: "Chan",
      role: "Senior Operations Lead",
      department: "Operations",
      branches: { name: "Headquarters" },
    },
  },
  {
    id: "mov-demo-002",
    employee_id: "",
    movement_type: "pass_probation",
    title: "Passed Probation Evaluation",
    effective_date: "2026-08-15",
    previous_values: { status: "probation" },
    new_values: { status: "active", rating: "Exceeds Expectations (4.8/5)" },
    remarks: "Completed 3-month probation with stellar performance metrics.",
    document_url: "https://example.com/docs/probation_review_dara.pdf",
    document_name: "Probation_Appraisal_Form.pdf",
    branch_id: null,
    created_by_name: "HR Admin",
    created_at: "2026-08-15T09:00:00Z",
    employees: {
      id: "emp-demo-2",
      first_name: "Dara",
      last_name: "Sok",
      role: "Backend Engineer",
      department: "Technology",
      branches: { name: "Headquarters" },
    },
  },
  {
    id: "mov-demo-003",
    employee_id: "",
    movement_type: "transfer",
    title: "Transferred to Siem Reap Branch",
    effective_date: "2026-09-01",
    previous_values: { branch: "Headquarters", department: "Customer Support" },
    new_values: { branch: "Siem Reap Branch", department: "Regional Operations" },
    remarks: "Relocated to strengthen regional customer care operations.",
    document_url: "https://example.com/docs/branch_transfer_piseth.pdf",
    document_name: "Inter_Branch_Transfer_Authorization.pdf",
    branch_id: null,
    created_by_name: "Executive Management",
    created_at: "2026-09-01T10:15:00Z",
    employees: {
      id: "emp-demo-3",
      first_name: "Piseth",
      last_name: "Vann",
      role: "Regional Coordinator",
      department: "Regional Operations",
      branches: { name: "Siem Reap Branch" },
    },
  },
];

function getStoredLocalMovements(): EmployeeMovement[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_MOVEMENTS));
      return INITIAL_DEMO_MOVEMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_MOVEMENTS;
  }
}

function saveLocalMovement(movement: EmployeeMovement) {
  try {
    const current = getStoredLocalMovements();
    const updated = [movement, ...current];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save movement locally:", err);
  }
}

export async function fetchAllMovements(): Promise<EmployeeMovement[]> {
  try {
    const { data, error } = await supabase
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
      .order("effective_date", { ascending: false });

    if (error) {
      // Table may not exist yet in schema cache -> fallback to local storage
      console.warn("employee_movements query returned error, using local data:", error.message);
      return getStoredLocalMovements();
    }

    if (!data || data.length === 0) {
      const local = getStoredLocalMovements();
      return local;
    }

    return data as EmployeeMovement[];
  } catch (err) {
    console.warn("fetchMovements exception, fallback to local:", err);
    return getStoredLocalMovements();
  }
}

export async function fetchMovementsByEmployeeId(employeeId: string): Promise<EmployeeMovement[]> {
  const all = await fetchAllMovements();
  return all.filter((m) => m.employee_id === employeeId || (!m.employee_id && m.employees?.id === employeeId));
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

  // 3. Update employee table live if applicable
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

  // 4. Construct movement record
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
    created_by_name: currentUser?.displayName || currentUser?.email || "HR Manager",
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

  // 5. Attempt insertion to Supabase employee_movements table
  try {
    const { error: insertErr } = await supabase
      .from("employee_movements")
      .insert({
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

    if (insertErr) {
      console.warn("Supabase insert error on employee_movements, falling back to local:", insertErr.message);
      saveLocalMovement(newMovement);
    }
  } catch (err) {
    console.warn("Supabase exception inserting movement:", err);
    saveLocalMovement(newMovement);
  }

  // Also always update local cache
  saveLocalMovement(newMovement);

  // Dispatch event for any active overview cards / listening components
  window.dispatchEvent(new CustomEvent("employee-movement-created", { detail: newMovement }));

  return newMovement;
}
