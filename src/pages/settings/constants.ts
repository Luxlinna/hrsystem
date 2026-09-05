export const PERMISSION_COLUMNS = [
  { key: "employees", label: "Employees" },
  { key: "payroll", label: "Payroll" },
  { key: "finance", label: "Finance" },
  { key: "settings", label: "Settings" },
];

export const SETTINGS_SECTIONS = [
  { key: "general", label: "General" },
  { key: "appearance", label: "Appearance" },
  { key: "notifications", label: "Notifications" },
  { key: "permissions", label: "Permissions" },
  { key: "branches", label: "BU" },
  { key: "integrations", label: "Integrations" },
];

export const keyLabels: Record<string, string> = {
  company_name: "Company Name",
  default_currency: "Default Currency",
  timezone: "Timezone",
  fiscal_year_start: "Fiscal Year Start",
  week_start_day: "Week Start Day",
  work_start_time: "Work Start Time",
  work_end_time: "Work End Time",
  working_days: "Working Days",
  break_start_time: "Break Start Time",
  break_end_time: "Break End Time",
  saturday_start_time: "Saturday Start Time",
  saturday_end_time: "Saturday End Time",
  late_grace_minutes: "Late Grace Period (Mins)",
  early_leave_grace_minutes: "Early Checkout Grace Period (Mins)",
  morning_check_in_start: "Morning Check-In Window Start",
  morning_check_in_end: "Morning Check-In Window End",
  morning_check_out_start: "Morning Check-Out Window Start",
  morning_check_out_end: "Morning Check-Out Window End",
  afternoon_check_in_start: "Afternoon Check-In Window Start",
  afternoon_check_in_end: "Afternoon Check-In Window End",
  afternoon_check_out_start: "Afternoon Check-Out Window Start",
  afternoon_check_out_end: "Afternoon Check-Out Window End",
  checkout_reminder_minutes: "Checkout Reminder Window",
  default_work_hours: "Default Work Hours / Week",
  overtime_threshold: "Overtime Threshold (hours)",
  leave_approval_required: "Leave Approval Required",
  auto_payroll_reminder: "Auto Payroll Reminder",
  attendance_notify_scope:
    "Attendance Check-in/Check-out Notification Scope",
  telegram_notify_enabled: "Telegram Group Notifications",
};

export const notificationKeys = [
  { key: "notification_email_new_leave", label: "New leave request", channel: "email" },
  { key: "notification_push_new_leave", label: "New leave request", channel: "push" },
  { key: "notification_email_payroll", label: "Payroll processed", channel: "email" },
  { key: "notification_push_payroll", label: "Payroll processed", channel: "push" },
  { key: "notification_email_onboarding", label: "Onboarding milestone", channel: "email" },
  { key: "notification_push_onboarding", label: "Onboarding milestone", channel: "push" },
  { key: "notification_email_security", label: "Security alert", channel: "email" },
  { key: "notification_push_security", label: "Security alert", channel: "push" },
  { key: "notification_email_weekly", label: "Weekly summary", channel: "email" },
  { key: "notification_push_weekly", label: "Weekly summary", channel: "push" },
];

export const EVENT_LABELS = [
  "New leave request",
  "Payroll processed",
  "Onboarding milestone",
  "Security alert",
  "Weekly summary",
];

export const ATTENDANCE_SCHEDULE_KEYS = [
  "work_start_time",
  "morning_check_in_start",
  "morning_check_in_end",
  "late_grace_minutes",
  "break_start_time",
  "morning_check_out_start",
  "morning_check_out_end",
  "early_leave_grace_minutes",
  "break_end_time",
  "afternoon_check_in_start",
  "afternoon_check_in_end",
  "work_end_time",
  "afternoon_check_out_start",
  "afternoon_check_out_end",
  "working_days",
  "saturday_start_time",
  "saturday_end_time",
  "checkout_reminder_minutes",
];

export const timezoneOptions = [
  "Asia/Phnom_Penh",
  "Asia/Bangkok",
  "Asia/Ho_Chi_Minh",
  "Asia/Vientiane",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Jakarta",
  "Asia/Manila",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Australia/Sydney",
  "UTC",
];

export const currencyOptions = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "CNY",
  "CHF",
];

export const INTEGRATIONS = [
  { name: "Slack", connected: true, desc: "Send HR notifications to Slack channels", lastSync: "2 hours ago" },
  { name: "Google Workspace", connected: true, desc: "Sync employee accounts and calendars", lastSync: "1 day ago" },
  { name: "Zoom", connected: false, desc: "Schedule interviews and meetings", lastSync: "Never" },
  { name: "QuickBooks", connected: true, desc: "Sync payroll and financial data", lastSync: "3 hours ago" },
  { name: "Stripe", connected: false, desc: "Process reimbursements and bonuses", lastSync: "Never" },
];
