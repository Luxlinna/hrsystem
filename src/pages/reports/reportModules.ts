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
