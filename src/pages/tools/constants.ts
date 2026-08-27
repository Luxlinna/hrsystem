export const TOOL_ROUTES: Record<string, string> = {
  "Time Tracker": "/attendance",
  "Document Generator": "/documents",
  "Performance Review Builder": "/performance",
  "Expense Submission": "/finance",
  "Meeting Scheduler": "/meeting-rooms",
  "Compliance Auditor": "/audit-log",
  "Feedback & Pulse Surveys": "/announcements",
  "Recruitment & Referral": "/hire",
};

export const CATEGORY_STYLES: Record<
  string,
  { label: string; icon: string; color: string; bg: string; border: string }
> = {
  Productivity: { label: "Productivity", icon: "ri-flashlight-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Documents: { label: "Documents", icon: "ri-file-text-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Reviews: { label: "Performance & Reviews", icon: "ri-star-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Finance: { label: "Finance & Payroll", icon: "ri-wallet-3-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Scheduling: { label: "Scheduling & Shift", icon: "ri-calendar-event-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Compliance: { label: "Legal & Compliance", icon: "ri-shield-check-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Feedback: { label: "Surveys & Feedback", icon: "ri-chat-smile-2-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
  Hiring: { label: "Talent & Hiring", icon: "ri-user-search-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10", border: "border-[#253C7D]/20" },
};

export const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  login: { label: "Signed into Tool", icon: "ri-login-box-line", color: "text-slate-600 bg-slate-100" },
  track_hours: { label: "Logged Work Hours", icon: "ri-time-line", color: "text-slate-600 bg-slate-100" },
  generate_doc: { label: "Generated Document", icon: "ri-file-add-line", color: "text-slate-600 bg-slate-100" },
  create_review: { label: "Initiated Review", icon: "ri-star-smile-line", color: "text-slate-600 bg-slate-100" },
  submit_expense: { label: "Submitted Expense", icon: "ri-money-dollar-circle-line", color: "text-slate-600 bg-slate-100" },
  create_schedule: { label: "Published Schedule", icon: "ri-calendar-check-line", color: "text-slate-600 bg-slate-100" },
  run_audit: { label: "Executed Audit Scan", icon: "ri-shield-flash-line", color: "text-slate-600 bg-slate-100" },
  create_survey: { label: "Created Pulse Survey", icon: "ri-questionnaire-line", color: "text-slate-600 bg-slate-100" },
  submit_referral: { label: "Submitted Candidate", icon: "ri-user-shared-line", color: "text-slate-600 bg-slate-100" },
};
