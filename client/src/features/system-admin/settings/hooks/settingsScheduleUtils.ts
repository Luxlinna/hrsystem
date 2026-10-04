export const SCHEDULE_KEYS = [
  "work_start_time",
  "work_end_time",
  "break_start_time",
  "break_end_time",
  "late_grace_minutes",
  "early_leave_grace_minutes",
  "morning_check_in_start",
  "morning_check_in_end",
  "morning_check_out_start",
  "morning_check_out_end",
  "afternoon_check_in_start",
  "afternoon_check_in_end",
  "afternoon_check_out_start",
  "afternoon_check_out_end",
  "is_four_punch_enabled",
] as const;

export const BRANCH_SCHEDULE_KEYS = [
  "work_start_time",
  "work_end_time",
  "late_grace_minutes",
  "early_leave_grace_minutes",
  "morning_check_in_start",
  "morning_check_in_end",
  "morning_check_out_start",
  "morning_check_out_end",
  "afternoon_check_in_start",
  "afternoon_check_in_end",
  "afternoon_check_out_start",
  "afternoon_check_out_end",
] as const;

export const TIME_FIELD_KEYS = [
  "work_start_time",
  "work_end_time",
  "break_start_time",
  "break_end_time",
  "morning_check_in_start",
  "morning_check_in_end",
  "morning_check_out_start",
  "morning_check_out_end",
  "afternoon_check_in_start",
  "afternoon_check_in_end",
  "afternoon_check_out_start",
  "afternoon_check_out_end",
] as const;

export function formatTimeSeconds(t?: string, defaultVal = "08:00:00"): string {
  if (!t || !t.trim()) return defaultVal;
  const parts = t.trim().split(":");
  const h = (parts[0] || "00").padStart(2, "0");
  const m = (parts[1] || "00").padStart(2, "0");
  const s = (parts[2] || "00").padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function resolveScheduleFieldValue(
  currentBranchOrSite: any,
  key: string
): string | null {
  if (!currentBranchOrSite) return null;

  const sliceKeys = [
    "work_start_time",
    "work_end_time",
    "break_start_time",
    "break_end_time",
    "morning_check_in_start",
    "morning_check_in_end",
    "morning_check_out_start",
    "morning_check_out_end",
    "afternoon_check_in_start",
    "afternoon_check_in_end",
    "afternoon_check_out_start",
    "afternoon_check_out_end",
  ];

  if (sliceKeys.includes(key) && currentBranchOrSite[key]) {
    return currentBranchOrSite[key].slice(0, 5);
  }

  if (
    (key === "late_grace_minutes" || key === "early_leave_grace_minutes") &&
    currentBranchOrSite[key] != null
  ) {
    return String(currentBranchOrSite[key]);
  }

  if (key === "is_four_punch_enabled" && currentBranchOrSite.is_four_punch_enabled !== undefined) {
    return String(currentBranchOrSite.is_four_punch_enabled);
  }

  return null;
}
