import type { Employee } from "./types";
import { extractMachinePin, formatPaddedPin, formatBiometricId } from "@/lib/biometricUtils";

/**
 * Searches employees in Attendance forms (Overtime & Time Log).
 *
 * Rules:
 * 1. Scoped to the active branch (BU) if activeBranchId is provided.
 * 2. If the user searches a number like "45" or "1":
 *    - Strictly matches the employee with ID 45 (or 045) / ID 1 (or 001).
 *    - Does NOT match other employees whose IDs, phone numbers, or UUIDs happen to contain "45" or "1".
 * 3. If the user searches text:
 *    - Matches by employee name, BU name, full BU Biometric ID (e.g. "Pinex Agro 045"), department, or role.
 */
export function matchAttendanceEmployee(
  e: Employee,
  query: string,
  activeBranchId?: string | null
): boolean {
  // 1. Branch/BU scoping
  if (activeBranchId && e.branch_id && e.branch_id !== activeBranchId) {
    return false;
  }

  const q = query.trim().toLowerCase();
  if (!q) return true;

  const cleanQ = q.replace(/^(id\s*[:#\-]?|#)/i, "").trim();
  if (!cleanQ) return true;

  const rawBio = (e.biometric_user_id || "").trim();
  const rawCode = (e.employee_code || "").trim();
  const pinBio = extractMachinePin(rawBio); // e.g. "45" or "1"
  const paddedBio = formatPaddedPin(rawBio); // e.g. "045" or "001"
  const buName = (e.branches?.name || "").toLowerCase();
  const fullBuId = formatBiometricId(rawBio, e.branches?.name).toLowerCase(); // e.g. "pinex agro 045"

  // If query is pure digits (e.g. "45", "1", "001")
  if (/^\d+$/.test(cleanQ)) {
    const qNum = cleanQ.replace(/^0+/, "") || "0";
    const paddedQ = cleanQ.padStart(3, "0");

    // Exact numeric match:
    // e.g. "45" or "045" matches 045; "1" or "001" matches 001
    if (
      pinBio === qNum ||
      paddedBio === paddedQ ||
      rawCode === cleanQ ||
      rawCode.replace(/^0+/, "") === qNum ||
      rawCode.padStart(3, "0") === paddedQ
    ) {
      return true;
    }

    // Prefix match while typing (e.g. typing "04" matches "040"-"049")
    if (paddedBio && paddedBio.startsWith(cleanQ)) {
      return true;
    }
    if (rawCode && rawCode.startsWith(cleanQ)) {
      return true;
    }

    return false;
  }

  // Text search: name, BU, full BU ID, role, department
  const tokens = cleanQ.split(/\s+/).filter(Boolean);
  const fullName = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
  const role = (e.role || "").toLowerCase();
  const dept = (e.department || "").toLowerCase();

  return tokens.every((tok) => {
    // If token is digits within a phrase (e.g. "Pinex 45")
    if (/^\d+$/.test(tok)) {
      const tokNum = tok.replace(/^0+/, "") || "0";
      const paddedTok = tok.padStart(3, "0");
      return (
        pinBio === tokNum ||
        paddedBio === paddedTok ||
        rawCode === tok ||
        rawCode.padStart(3, "0") === paddedTok ||
        fullBuId.includes(tok)
      );
    }
    return (
      fullName.includes(tok) ||
      buName.includes(tok) ||
      fullBuId.includes(tok) ||
      role.includes(tok) ||
      dept.includes(tok)
    );
  });
}
