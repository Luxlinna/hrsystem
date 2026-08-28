export const STATUS_CONFIG: Record<
  string,
  { label: string; short: string; bg: string; text: string; border: string; icon: string; dot: string }
> = {
  ontime: {
    label: "On Time",
    short: "OT",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-line",
    dot: "bg-emerald-500",
  },
  present: {
    label: "On Time",
    short: "OT",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-line",
    dot: "bg-emerald-500",
  },
  late: {
    label: "Late Arrival",
    short: "L",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
    dot: "bg-amber-500",
  },
  remote: {
    label: "Remote / WFH",
    short: "R",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: "ri-home-office-line",
    dot: "bg-sky-500",
  },
  half_day: {
    label: "Half Day",
    short: "H",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: "ri-sun-line",
    dot: "bg-orange-500",
  },
  absent: {
    label: "Absent",
    short: "A",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-close-circle-line",
    dot: "bg-rose-500",
  },
  holiday: {
    label: "Holiday / Off",
    short: "OFF",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "ri-calendar-event-line",
    dot: "bg-purple-500",
  },
};

export function formatTime(t: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export function calcHours(clockIn: string | null, clockOut: string | null): string {
  if (!clockIn || !clockOut) return "—";
  const [ih, im] = clockIn.split(":").map(Number);
  const [oh, om] = clockOut.split(":").map(Number);
  let mins = oh * 60 + om - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60; // overnight shift
  if (mins === 0) return "—";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function calcHoursNum(clockIn: string | null, clockOut: string | null): number {
  if (!clockIn || !clockOut) return 0;
  const [ih, im] = clockIn.split(":").map(Number);
  const [oh, om] = clockOut.split(":").map(Number);
  let mins = oh * 60 + om - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60;
  return +(mins / 60).toFixed(1);
}

export const initials = (first?: string, last?: string) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();
