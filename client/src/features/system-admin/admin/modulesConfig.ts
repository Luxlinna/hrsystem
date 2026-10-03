export interface ModuleConfig {
  key: string;
  label: string;
  icon: string;
  group: typeof MODULE_GROUPS[number];
  description?: string;
}

export const MODULE_GROUPS = ["Core", "Workforce", "Operations", "Insights", "System"] as const;

export const ALL_MODULES: ModuleConfig[] = [
  { key: "self-service", label: "Self-Service", icon: "ri-user-settings-line", group: "Core", description: "Personal profile, requests, and self attendance." },
  { key: "dashboard", label: "Dashboard", icon: "ri-dashboard-line", group: "Core", description: "Operational overview, stats, and pending tasks." },
  { key: "employees", label: "Employees", icon: "ri-user-search-line", group: "Core", description: "Directory, master profile records, and contracts." },
  { key: "analytics", label: "Analytics", icon: "ri-bar-chart-2-line", group: "Core", description: "Workforce demographics, metrics, and org stats." },
  { key: "onboarding", label: "Onboarding", icon: "ri-user-add-line", group: "Workforce", description: "New hire workflows and documentation intake." },
  { key: "onboarding-checklist", label: "Onboarding Checklist", icon: "ri-task-line", group: "Workforce", description: "Task checklists for newly joined team members." },
  { key: "leave", label: "Leave Requests", icon: "ri-calendar-event-line", group: "Workforce", description: "Leave application submission and balance tracking." },
  { key: "leave-calendar", label: "Leave Calendar", icon: "ri-calendar-2-line", group: "Workforce", description: "Company-wide holiday and leave timeline calendar." },
  { key: "hire", label: "Recruitment", icon: "ri-briefcase-line", group: "Workforce", description: "Job vacancies, ATS candidate pipeline, and interviews." },
  { key: "offboard", label: "Offboarding", icon: "ri-user-unfollow-line", group: "Workforce", description: "Staff separation, handovers, and clearance approvals." },
  { key: "exit", label: "Exit Management", icon: "ri-logout-box-r-line", group: "Workforce", description: "Exit interviews and feedback collection." },
  { key: "complaints", label: "Complaints & Suggestions", icon: "ri-feedback-line", group: "Workforce", description: "Confidential employee grievances and feedback." },
  { key: "org-chart", label: "Org Chart", icon: "ri-organization-chart", group: "Workforce", description: "Visual corporate hierarchy and reporting structures." },
  { key: "performance", label: "Performance", icon: "ri-star-line", group: "Workforce", description: "KPI evaluations, 360 appraisals, and goals." },
  { key: "attendance", label: "Time & Attendance", icon: "ri-fingerprint-line", group: "Workforce", description: "Clock in/out records, biometric logs, and overtime." },
  { key: "training", label: "Training", icon: "ri-graduation-cap-line", group: "Workforce", description: "Skill development, course enrollments, and certs." },
  { key: "disciplinary", label: "Disciplinary", icon: "ri-alert-line", group: "Workforce", description: "Warning letters, code of conduct, and investigations." },
  { key: "shifts", label: "Attendance Schedules", icon: "ri-calendar-schedule-line", group: "Workforce", description: "Shift assignments, roster rotations, and schedules." },
  { key: "meeting-rooms", label: "Meeting Rooms", icon: "ri-door-open-line", group: "Workforce", description: "Meeting room booking and facility scheduling." },
  { key: "tasks", label: "Tasks", icon: "ri-checkbox-multiple-line", group: "Workforce", description: "Internal team tasks, assignments, and deadlines." },
  { key: "payroll", label: "Payroll", icon: "ri-money-dollar-circle-line", group: "Operations", description: "Salary slips, tax withholdings, and compensation." },
  { key: "payroll-approval", label: "Payroll Approval", icon: "ri-file-check-line", group: "Operations", description: "Multi-stage payroll verification and disbursement." },
  { key: "finance", label: "Finance", icon: "ri-bank-line", group: "Operations", description: "Expense claims, reimbursement, and corporate budgets." },
  { key: "it-management", label: "IT Management", icon: "ri-computer-line", group: "Operations", description: "Hardware assets, licenses, and IT support tickets." },
  { key: "benefits", label: "Benefits", icon: "ri-heart-pulse-line", group: "Operations", description: "Health insurance, medical claims, and staff perks." },
  { key: "tools", label: "HR Tools", icon: "ri-tools-line", group: "Operations", description: "Utility calculators and document generators." },
  { key: "announcements", label: "Announcements", icon: "ri-megaphone-line", group: "Operations", description: "Company-wide broadcasts and policy updates." },
  { key: "documents", label: "Documents", icon: "ri-folder-line", group: "Operations", description: "Document vault, templates, handbook, and contracts." },
  { key: "reports", label: "Reports", icon: "ri-file-chart-line", group: "Insights", description: "Custom tabular reports and Excel data exports." },
  { key: "audit-log", label: "Audit Log", icon: "ri-shield-check-line", group: "Insights", description: "Security audit trails and system modification logs." },
  { key: "branches", label: "Organization", icon: "ri-building-line", group: "System", description: "Business units, branch locations, and departments." },
  { key: "notifications", label: "Notifications", icon: "ri-notification-3-line", group: "System", description: "Alert triggers, email dispatch rules, and notices." },
  { key: "unity-apps", label: "Unity Apps", icon: "ri-apps-line", group: "System", description: "Connected ecosystem apps and single sign-on links." },
  { key: "settings", label: "Settings", icon: "ri-settings-3-line", group: "System", description: "System configurations, SMTP email, and PIN security." },
];
