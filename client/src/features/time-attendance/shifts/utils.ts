/** Local YYYY-MM-DD format */
export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns an array of 7 Date objects (Mon–Sun) for the week containing the given date */
export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

/** Calculate hours between two HH:MM times, handles overnight shifts */
export function calculateHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  return Math.round(((endMinutes - startMinutes) / 60) * 10) / 10;
}

export function getShiftEmployeeName(emp?: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
} | null): string {
  if (!emp) return "Employee";
  return (
    emp.display_name?.trim() ||
    emp.full_name?.trim() ||
    `${emp.last_name || ""} ${emp.first_name || ""}`.trim() ||
    "Employee"
  );
}

export function getShiftEmployeeInitials(emp?: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
} | null): string {
  if (!emp) return "E";
  const name = getShiftEmployeeName(emp);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (name[0] || "E").toUpperCase();
}

