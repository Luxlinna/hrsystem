import type { EmployeeMovement } from "../types";

export const LOCAL_STORAGE_KEY = "hrm_ops_employee_movements";
export const DELETED_MOVEMENTS_KEY = "hrm_ops_deleted_movement_ids";

export function getDeletedMovementIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_MOVEMENTS_KEY);
    if (!raw) return new Set();
    const arr: string[] = JSON.parse(raw);
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function markMovementDeleted(id: string) {
  try {
    const set = getDeletedMovementIds();
    set.add(id);
    localStorage.setItem(DELETED_MOVEMENTS_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error("Failed to mark movement as deleted:", err);
  }
}

export function getStoredLocalMovements(): EmployeeMovement[] {
  try {
    const deleted = getDeletedMovementIds();
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed: EmployeeMovement[] = JSON.parse(raw);
    return parsed.filter((m) => !m.id.startsWith("mov-demo-") && !deleted.has(m.id));
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

export function deleteLocalMovement(id: string) {
  try {
    markMovementDeleted(id);
    const current = getStoredLocalMovements();
    const updated = current.filter((m) => m.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete movement locally:", err);
  }
}

