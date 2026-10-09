export interface NameFields {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
}

/**
 * Returns the proper employee display name, prioritizing `display_name` and `full_name`
 * (e.g. Cambodian Khmer naming order: Last First like "Khoeurn Chem") over
 * raw `first_name last_name`.
 */
export function getAttendanceEmployeeName(
  emp?: NameFields | null,
  fallback = "—"
): string {
  if (!emp) return fallback;
  return (
    emp.display_name?.trim() ||
    emp.full_name?.trim() ||
    `${emp.last_name || ""} ${emp.first_name || ""}`.trim() ||
    fallback
  );
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
