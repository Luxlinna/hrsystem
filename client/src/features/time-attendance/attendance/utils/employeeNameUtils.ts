import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

export interface NameFields {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
}

/**
 * Returns the proper employee display name following Cambodian Khmer naming order:
 * [Last Name] [First Name] (e.g. "Te Senglong", "Khoeurn Chem")
 */
export function getAttendanceEmployeeName(
  emp?: NameFields | null,
  fallback = "—"
): string {
  if (!emp) return fallback;
  const formatted = formatKhmerFullName(emp);
  return formatted && formatted !== "—" ? formatted : fallback;
}

/**
 * Computes uppercase 2-letter initials based on the resolved display name.
 */
export function getAttendanceEmployeeInitials(
  emp?: NameFields | null,
  fallback = "?"
): string {
  if (!emp) return fallback;
  const name = getAttendanceEmployeeName(emp, "");
  if (!name) return fallback;
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
