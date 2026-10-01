export const STATUS_STYLES: Record<string, { label: string; className: string; icon: string }> = {
  active: { label: "Active", className: "text-emerald-700 bg-emerald-50/80 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60", icon: "ri-checkbox-circle-line" },
  on_leave: { label: "On Leave", className: "text-amber-700 bg-amber-50/80 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60", icon: "ri-calendar-event-line" },
  onboarding: { label: "Onboarding", className: "text-blue-700 bg-blue-50/80 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80", icon: "ri-user-follow-line" },
  suspended: { label: "Suspended", className: "text-rose-700 bg-rose-50/80 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60", icon: "ri-error-warning-line" },
  inactive: { label: "Inactive", className: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700", icon: "ri-close-circle-line" },
};

export const SELF_SERVICE_TABS = [
  { id: "attendance", label: "My Attendance", icon: "ri-fingerprint-line" },
  { id: "checkin", label: "Check In/Out", icon: "ri-fingerprint-line" },
  { id: "payslips", label: "My Payslips", icon: "ri-file-list-3-line" },
  { id: "leave", label: "My Leave", icon: "ri-calendar-line" },
  { id: "work-outside", label: "Work Outside", icon: "ri-map-pin-line" },
  { id: "daily-report", label: "Daily Report", icon: "ri-file-chart-line" },
  { id: "benefits", label: "My Benefits", icon: "ri-shield-star-line" },
];

export const LEAVE_STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
  rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60",
};

export const LEAVE_TYPES = ["vacation", "sick", "personal", "maternity", "paternity", "bereavement", "unpaid"];

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ATTENDANCE_STATUS_COLOR: Record<string, string> = {
  ontime: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
  present: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60",
  late: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
  absent: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60",
  holiday: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60",
  remote: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60",
  half_day: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
};
