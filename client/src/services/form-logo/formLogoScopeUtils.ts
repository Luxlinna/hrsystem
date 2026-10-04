/**
 * Checks if a scope/candidate/offer belongs to the HR Division.
 */
export function isHrDivisionScope(
  businessUnit?: string | null,
  department?: string | null,
  division?: string | null
): boolean {
  const combined = `${businessUnit || ""} ${department || ""} ${division || ""}`.toLowerCase().trim();
  if (
    combined.includes("hr division") ||
    combined.includes("human resources") ||
    combined.includes("human resource") ||
    combined.includes("uni holding") ||
    combined.includes("unique noble") ||
    combined.includes("hr-division") ||
    combined.includes("people & culture") ||
    combined.includes("people and culture") ||
    combined.includes("talent acquisition") ||
    /\bhr\b/i.test(combined)
  ) {
    return true;
  }
  return false;
}

/**
 * Checks if the currently active branch in the application header / local state is the HR Division.
 */
export function isCurrentActiveBranchHrDivision(): boolean {
  try {
    if (typeof window === "undefined") return false;

    // Direct flag set by BranchContext / user role evaluation
    if (localStorage.getItem("hrm_is_hr_division") === "true") {
      return true;
    }

    const branchName = (localStorage.getItem("hrm_selected_branch_name") || "").toLowerCase().trim();
    const branchId = (localStorage.getItem("hrm_selected_branch_id") || "").trim();

    // Check by name
    if (
      branchName.includes("hr division") ||
      branchName.includes("human resource") ||
      branchName.includes("human resources") ||
      branchName.includes("uni holding") ||
      branchName.includes("unique noble") ||
      /\bhr\b/i.test(branchName)
    ) {
      return true;
    }

    // Check by known HR Division ID from Supabase branches table
    if (branchId === "68b6c801-3581-460a-9918-2c6b5434fc7c") {
      return true;
    }

    const currentScope = (localStorage.getItem("hrm_current_scope") || "").toLowerCase().trim();
    if (currentScope === "hr" || currentScope.includes("hr division")) {
      return true;
    }
  } catch (_e) { /* localStorage unavailable – continue with default */ }
  return false;
}

/**
 * Determines whether a document export is taking place at / by the HR Division.
 * When true, the document MUST strictly use the UNI Logo (NO OPS),
 * even if the candidate, employee, or requisition originated from OPS.
 */
export function isExportAtHrDivision(params?: {
  businessUnit?: string | null;
  department?: string | null;
  division?: string | null;
  isHrDivisionContext?: boolean;
}): boolean {
  // 1. Explicit caller context (e.g. from HR Review / HR Division modal)
  if (params?.isHrDivisionContext === true) {
    return true;
  }

  // 2. Active top-bar branch or active user role is HR Division
  if (isCurrentActiveBranchHrDivision()) {
    return true;
  }

  // 3. The candidate / employee / requisition itself belongs directly to the HR Division
  if (isHrDivisionScope(params?.businessUnit, params?.department, params?.division)) {
    return true;
  }

  return false;
}
