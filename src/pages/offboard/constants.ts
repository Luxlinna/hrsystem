export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string; hex: string }
> = {
  notice_period: {
    label: "Notice Period",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
    hex: "#F59E0B",
  },
  exit_interview: {
    label: "Exit Interview",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: "ri-chat-voice-line",
    hex: "#0284C7",
  },
  clearance: {
    label: "Clearance & Handover",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: "ri-shield-check-line",
    hex: "#9333EA",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-fill",
    hex: "#10B981",
  },
};

export const STAGE_ORDER = ["notice_period", "exit_interview", "clearance", "completed"];

export const TASK_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  IT: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200/80", icon: "ri-macbook-line" },
  HR: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200/80", icon: "ri-user-shared-line" },
  Finance: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/80", icon: "ri-money-dollar-circle-line" },
  Operations: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200/80", icon: "ri-building-line" },
};

export const DEFAULT_EXIT_TASKS = [
  { title: "Return company laptop & IT hardware", type: "IT", assignee: "IT Team" },
  { title: "Conduct exit interview & feedback survey", type: "HR", assignee: "HR Manager" },
  { title: "Process final paycheck & calculate leave encashment", type: "Finance", assignee: "Payroll Dept" },
  { title: "Revoke corporate email, Slack, and VPN access", type: "IT", assignee: "IT Security" },
  { title: "Handover company keys & security access badge", type: "Operations", assignee: "Facility / Admin" },
];

export const EXIT_REASONS = [
  "Career Advancement / New Offer",
  "Relocation / Personal Reasons",
  "Career Break / Higher Education",
  "Retirement",
  "Health or Family Commitments",
  "Contract Expiration",
  "Involuntary Departure / Restructuring",
  "Other",
];
