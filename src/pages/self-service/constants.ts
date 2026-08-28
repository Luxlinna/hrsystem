export const STATUS_STYLES: Record<string, { label: string; className: string; icon: string }> = {
  active: { label: "Active", className: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: "ri-checkbox-circle-fill" },
  on_leave: { label: "On Leave", className: "text-amber-700 bg-amber-50 border-amber-200", icon: "ri-calendar-event-fill" },
  onboarding: { label: "Onboarding", className: "text-sky-700 bg-sky-50 border-sky-200", icon: "ri-user-add-fill" },
  suspended: { label: "Suspended", className: "text-rose-700 bg-rose-50 border-rose-200", icon: "ri-error-warning-fill" },
  inactive: { label: "Inactive", className: "text-gray-600 bg-gray-50 border-gray-200", icon: "ri-close-circle-fill" },
};

export const SELF_SERVICE_TABS = [
  { id: "payslips", label: "My Payslips", icon: "ri-file-list-3-line" },
  { id: "leave", label: "My Leave", icon: "ri-calendar-event-line" },
  { id: "attendance", label: "My Attendance", icon: "ri-time-line" },
  { id: "checkin", label: "Check In/Out", icon: "ri-fingerprint-line" },
  { id: "work-outside", label: "Work Outside", icon: "ri-map-pin-user-line" },
  { id: "daily-report", label: "Daily Report", icon: "ri-file-list-2-line" },
  { id: "benefits", label: "My Benefits", icon: "ri-heart-pulse-line" },
];

export const LEAVE_STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
};

export const LEAVE_TYPES = ["vacation", "sick", "personal", "maternity", "paternity", "bereavement", "unpaid"];

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ATTENDANCE_STATUS_COLOR: Record<string, string> = {
  ontime: "bg-emerald-50 text-emerald-700",
  present: "bg-emerald-50 text-emerald-700",
  late: "bg-amber-50 text-amber-700",
  absent: "bg-red-50 text-red-700",
  holiday: "bg-sky-50 text-sky-700",
  remote: "bg-sky-50 text-sky-700",
  half_day: "bg-orange-50 text-orange-700",
};
