import type { EmployeeMovement } from "../types";

export const LOCAL_STORAGE_KEY = "hrm_ops_employee_movements";

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

export function getStoredLocalMovements(): EmployeeMovement[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed: EmployeeMovement[] = JSON.parse(raw);
    return parsed.filter((m) => !m.id.startsWith("mov-demo-"));
  } catch {
    return [];
  }
}

export function saveLocalMovement(movement: EmployeeMovement) {
  try {
    const current = getStoredLocalMovements();
    const updated = [movement, ...current.filter((m) => m.id !== movement.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save movement locally:", err);
  }
}
