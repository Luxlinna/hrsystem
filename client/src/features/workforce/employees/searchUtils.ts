import { formatPaddedPin, extractMachinePin, formatBiometricId } from "@/lib/biometricUtils";

export interface SearchableEmployee {
  first_name?: string | null;
  last_name?: string | null;
  kh_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  department?: string | null;
  biometric_user_id?: string | null;
  employee_code?: string | null;
  nssf_number?: string | null;
  branches?: { name?: string | null } | null;
}

export function matchEmployeeSearch(e: SearchableEmployee, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const cleanQ = q.replace(/^(id\s*[:#\-]?|#)/i, "").trim();
  const tokens = cleanQ.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const fullName = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
  const khName = (e.kh_name || "").toLowerCase();
  const email = (e.email || "").toLowerCase();
  const phone = (e.phone || "").toLowerCase();
  const role = (e.role || "").toLowerCase();
  const dept = (e.department || "").toLowerCase();
  const buName = (e.branches?.name || "").toLowerCase();
  const nssfNum = (e.nssf_number || "").toLowerCase();

  const rawBio = (e.biometric_user_id || "").trim();
  const rawCode = (e.employee_code || "").trim();
  const paddedBio = formatPaddedPin(rawBio);
  const pinBio = extractMachinePin(rawBio);
  const fullBuId = formatBiometricId(rawBio, e.branches?.name).toLowerCase();

  return tokens.every((tok) => {
    const isDigits = /^\d+$/.test(tok);
    if (isDigits) {
      const paddedTok = tok.padStart(3, "0");
      return (
        pinBio === tok ||
        rawCode === tok ||
        paddedBio === paddedTok ||
        rawBio.includes(tok) ||
        rawCode.includes(tok) ||
        nssfNum.includes(tok) ||
        phone.includes(tok)
      );
    }
    return (
      fullName.includes(tok) ||
      khName.includes(tok) ||
      buName.includes(tok) ||
      fullBuId.includes(tok) ||
      role.includes(tok) ||
      dept.includes(tok) ||
      email.includes(tok) ||
      phone.includes(tok) ||
      rawBio.toLowerCase().includes(tok) ||
      rawCode.toLowerCase().includes(tok)
    );
  });
}

export function compareEmployees(
  a: any,
  b: any,
  sortField: string | null,
  sortDirection: "asc" | "desc"
): number {
  if (!sortField) {
    const idComp = (a.biometric_user_id || "").localeCompare(b.biometric_user_id || "", undefined, { numeric: true });
    if (idComp !== 0) return idComp;
    return `${a.first_name || ""} ${a.last_name || ""}`.localeCompare(`${b.first_name || ""} ${b.last_name || ""}`);
  }
  if (sortField === "biometric_user_id") {
    const diff = (a.biometric_user_id || "").localeCompare(b.biometric_user_id || "", undefined, { numeric: true });
    return sortDirection === "asc" ? diff : -diff;
  }
  let aVal = a[sortField] || "";
  let bVal = b[sortField] || "";
  if (sortField === "first_name") {
    aVal = `${a.first_name || ""} ${a.last_name || ""}`;
    bVal = `${b.first_name || ""} ${b.last_name || ""}`;
  } else if (sortField === "email") {
    aVal = a.email || a.phone || "";
    bVal = b.email || b.phone || "";
  }
  if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
  if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
  return 0;
}

