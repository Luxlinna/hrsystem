import type { ModuleItem } from "./types";

export const MODULES: ModuleItem[] = [
  { id: "leave", label: "Leave Summary", icon: "ri-calendar-event-line", color: "bg-amber-50 text-amber-700 border-amber-200", desc: "All leave requests by employee, type, and status" },
  { id: "shifts", label: "Shift Scheduling", icon: "ri-time-line", color: "bg-blue-50 text-blue-700 border-blue-200", desc: "Shift rosters, employee allocations, coverage, and scheduled hours" },
  { id: "attendance", label: "Attendance Records", icon: "ri-user-follow-line", color: "bg-indigo-50 text-indigo-700 border-indigo-200", desc: "Daily check-in / check-out logs, hours worked, tardiness and absences" },
  { id: "attendance-summary", label: "Attendance Summary", icon: "ri-pie-chart-line", color: "bg-purple-50 text-purple-700 border-purple-200", desc: "Per-employee attendance rate, logged hours and punctuality scores" },
  { id: "payroll", label: "Payroll Report", icon: "ri-money-dollar-circle-line", color: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "Salary, bonuses, deductions and net pay records" },
  { id: "headcount", label: "Headcount Report", icon: "ri-team-line", color: "bg-sky-50 text-sky-700 border-sky-200", desc: "Employee distribution by branch and department" },
  { id: "expenses", label: "Expense Report", icon: "ri-bank-line", color: "bg-teal-50 text-teal-700 border-teal-200", desc: "All expense records with approval status" },
  { id: "hire", label: "Hire Pipeline", icon: "ri-briefcase-line", color: "bg-violet-50 text-violet-700 border-violet-200", desc: "Candidate pipeline and hiring funnel stages" },
  { id: "onboarding", label: "Onboarding Journeys", icon: "ri-user-star-line", color: "bg-blue-50 text-blue-700 border-blue-200", desc: "New hire onboarding progression, active stages, and verification status" },
  { id: "onboarding-tasks", label: "Onboarding Checklist", icon: "ri-checkbox-multiple-line", color: "bg-cyan-50 text-cyan-700 border-cyan-200", desc: "All onboarding task assignments, deadlines, category breakdown & completion audit" },
  { id: "daily-logs", label: "Daily Work Logs", icon: "ri-file-list-2-line", color: "bg-indigo-50 text-indigo-700 border-indigo-200", desc: "Every employee's daily work entries — what they worked on, when" },
  { id: "meeting-rooms", label: "Meeting Room Bookings", icon: "ri-community-line", color: "bg-rose-50 text-rose-700 border-rose-200", desc: "All meeting room booking records, status, and host details" },
];

export const EMPLOYEE_SCOPED_MODULES = new Set([
  "leave",
  "shifts",
  "payroll",
  "headcount",
  "daily-logs",
  "meeting-rooms",
  "onboarding",
  "onboarding-tasks",
  "attendance",
  "attendance-summary",
]);

export const COLUMN_KEY_MAP: Record<string, string> = {
  "Employee": "employee", "Department": "department", "Type": "leave_type", "Start Date": "start_date",
  "End Date": "end_date", "Days": "days", "Status": "status", "Month": "month",
  "Base Salary": "base_salary", "Bonus": "bonus", "Deductions": "deductions", "Net Pay": "net_pay",
  "Branch": "branch", "Total Headcount": "employee_count", "Active": "active", "Onboarding": "onboarding",
  "Deleted / Inactive": "deleted_count",
  "Description": "description", "Category": "category", "Amount": "amount", "Submitted By": "submitted_by",
  "Date": "date", "Candidate": "candidate", "Position": "position", "Stage": "stage", "Applied Date": "applied_date",
  "Time": "time", "Activity": "activity", "Notes": "notes",
  "Room": "room_name", "Title": "title", "Booked By": "employee", "Attendees": "attendees",
  "Role": "role", "Verified Docs": "verified_docs", "Requested By": "requested_by", "Started Date": "started_date",
  "Task Name": "task_name", "Priority": "priority", "Assigned To": "assigned_to", "Due Date": "due_date",
  "Verified By": "completed_by", "Verified Date & Time": "verified_at", "Verified At": "verified_at", "Completed Date": "completed_at",
  "Shift Date": "shift_date", "Shift Name": "shift_name", "Hours": "hours", "Capacity": "capacity", "Staffing": "staffing",
  "Deleted By": "deleted_by", "Deleted Date & Time": "deleted_at_formatted", "Deleted At": "deleted_at_formatted",
  "Check In": "clock_in", "Check Out": "clock_out", "Late (Min)": "late_minutes",
  "Days Logged": "days_logged", "Present": "present", "Late": "late", "Absent": "absent", "Remote": "remote",
  "Total Hours": "total_hours", "Late Minutes": "late_minutes", "Attendance Rate (%)": "attendance_rate", "Last Logged": "last_logged",
};

export const STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  pending: "bg-amber-50 text-amber-700 border border-amber-200/70",
  rejected: "bg-red-50 text-red-700 border border-red-200/70",
  cancelled: "bg-gray-100 text-gray-600 border border-gray-200/70",
  paid: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  processed: "bg-sky-50 text-sky-700 border border-sky-200/70",
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  open: "bg-amber-50 text-amber-700 border border-amber-200/70",
  scheduled: "bg-blue-50 text-blue-700 border border-blue-200/70",
  filled: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  hired: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  interview: "bg-sky-50 text-sky-700 border border-sky-200/70",
  screening: "bg-violet-50 text-violet-700 border border-violet-200/70",
  document: "bg-amber-50 text-amber-700 border border-amber-200/70",
  it_setup: "bg-blue-50 text-blue-700 border border-blue-200/70",
  training: "bg-purple-50 text-purple-700 border border-purple-200/70",
  complete: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  ontime: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  present: "bg-emerald-50 text-emerald-700 border border-emerald-200/70",
  late: "bg-amber-50 text-amber-700 border border-amber-200/70",
  absent: "bg-rose-50 text-rose-700 border border-rose-200/70",
  remote: "bg-sky-50 text-sky-700 border border-sky-200/70",
  "half day": "bg-orange-50 text-orange-700 border border-orange-200/70",
  holiday: "bg-purple-50 text-purple-700 border border-purple-200/70",
  deleted: "bg-rose-50 text-rose-700 border border-rose-300 font-bold",
};

export const ATTENDANCE_STATUS_LABEL: Record<string, string> = {
  ontime: "on time",
  present: "on time",
  late: "late",
  absent: "absent",
  remote: "remote",
  wfh: "remote",
  half_day: "half day",
  holiday: "holiday",
};

export const EXPORT_FORMAT_LABEL: Record<string, string> = {
  pdf: "PDF",
  csv: "CSV",
  xlsx: "Excel",
};
