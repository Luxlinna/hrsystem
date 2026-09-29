export const STATUS_STYLES: Record<string, { label: string; className: string; icon: string }> = {
  active: { label: "Active", className: "text-emerald-700 bg-emerald-50/80 border-emerald-200/80", icon: "ri-checkbox-circle-line" },
  on_leave: { label: "On Leave", className: "text-amber-700 bg-amber-50/80 border-amber-200/80", icon: "ri-calendar-event-line" },
  onboarding: { label: "Onboarding", className: "text-blue-700 bg-blue-50/80 border-blue-200/80", icon: "ri-user-follow-line" },
  suspended: { label: "Suspended", className: "text-rose-700 bg-rose-50/80 border-rose-200/80", icon: "ri-error-warning-line" },
  inactive: { label: "Inactive", className: "text-slate-600 bg-slate-50 border-slate-200", icon: "ri-close-circle-line" },
};

export const SELF_SERVICE_TABS = [
  { id: "payslips", label: "My Payslips", icon: "ri-file-list-3-line" },
  { id: "leave", label: "My Leave", icon: "ri-calendar-line" },
  { id: "attendance", label: "My Attendance", icon: "ri-time-line" },
  { id: "checkin", label: "Check In/Out", icon: "ri-fingerprint-line" },
  { id: "work-outside", label: "Work Outside", icon: "ri-map-pin-line" },
  { id: "daily-report", label: "Daily Report", icon: "ri-file-chart-line" },
  { id: "benefits", label: "My Benefits", icon: "ri-shield-star-line" },
];

export const LEAVE_STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export const LEAVE_TYPES = ["vacation", "sick", "personal", "maternity", "paternity", "bereavement", "unpaid"];

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ATTENDANCE_STATUS_COLOR: Record<string, string> = {
  ontime: "bg-emerald-50 text-emerald-700 border-emerald-200",
  present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  late: "bg-amber-50 text-amber-700 border-amber-200",
  absent: "bg-rose-50 text-rose-700 border-rose-200",
  holiday: "bg-blue-50 text-blue-700 border-blue-200",
  remote: "bg-blue-50 text-blue-700 border-blue-200",
  half_day: "bg-amber-50 text-amber-700 border-amber-200",
};
