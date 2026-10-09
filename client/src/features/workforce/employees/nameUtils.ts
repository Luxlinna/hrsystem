/**
 * Utility functions for employee name formatting.
 *
 * Formats employee full names following the Khmer Identity Card standard:
 * [Last Name] [First Name]
 *
 * Example:
 * - Last Name: "Khoeurn", First Name: "Chem" -> "Khoeurn Chem"
 * - Last Name: "Chanheng", First Name: "Chhen" -> "Chanheng Chhen"
 */

export function formatKhmerFullName(
  emp?: {
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    display_name?: string | null;
  } | null
): string {
  if (!emp) return "—";
  const last = (emp.last_name || "").trim();
  const first = (emp.first_name || "").trim();

  if (last && first) {
    return `${last} ${first}`;
  }
  if (last) return last;
  if (first) return first;
  if (emp.display_name?.trim()) return emp.display_name.trim();
  if (emp.full_name?.trim()) return emp.full_name.trim();
  return "—";
}
