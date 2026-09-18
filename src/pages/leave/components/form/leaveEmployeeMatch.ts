import type { Employee } from "../../types";
import { formatPaddedPin, extractMachinePin } from "@/lib/biometricUtils";

export function matchLeaveEmployee(e: Employee, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const cleanQ = q.replace(/^(id\s*[:#\-]?|#)/i, "").trim();
  if (!cleanQ) return true;

  const rawBio = (e.biometric_user_id || "").trim();
  const rawCode = (e.employee_code || e.employee_id || "").trim();
  const pinBio = extractMachinePin(rawBio);
  const paddedBio = formatPaddedPin(rawBio);
  const buName = (e.branches?.name || "").toLowerCase();

  if (/^\d+$/.test(cleanQ)) {
    const qNum = cleanQ.replace(/^0+/, "") || "0";
    const paddedQ = cleanQ.padStart(3, "0");
    if (
      pinBio === qNum ||
      paddedBio === paddedQ ||
      rawCode === cleanQ ||
      rawCode.replace(/^0+/, "") === qNum ||
      rawCode.padStart(3, "0") === paddedQ
    ) {
      return true;
    }
    if (paddedBio && paddedBio.startsWith(cleanQ)) return true;
    if (rawCode && rawCode.startsWith(cleanQ)) return true;
  }

  const fullName = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
  const role = (e.role || "").toLowerCase();
  const dept = (e.department || "").toLowerCase();

  return (
    fullName.includes(q) ||
    role.includes(q) ||
    dept.includes(q) ||
    buName.includes(q) ||
    rawCode.toLowerCase().includes(q)
  );
}
