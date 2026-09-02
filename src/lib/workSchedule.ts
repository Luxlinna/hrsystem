import { DEFAULT_TIMEZONE, zonedDayOfWeek } from "./date";

export interface WorkScheduleSettings { workingDays: number[]; workStartTime: string; workEndTime: string; saturdayStartTime: string; saturdayEndTime: string; breakStartTime: string; breakEndTime: string; lateGraceMinutes: number; earlyLeaveGraceMinutes: number; checkoutReminderMinutes: number; timezone: string; }
export const DEFAULT_WORK_SCHEDULE: WorkScheduleSettings = { workingDays: [1, 2, 3, 4, 5, 6], workStartTime: "08:00", workEndTime: "17:00", saturdayStartTime: "08:00", saturdayEndTime: "12:00", breakStartTime: "12:00", breakEndTime: "13:00", lateGraceMinutes: 15, earlyLeaveGraceMinutes: 15, checkoutReminderMinutes: 15, timezone: DEFAULT_TIMEZONE };
const toMinutes = (value: string) => { const [h, m] = value.split(":").map(Number); return h * 60 + m; };

// Paid hours between two instants, minus any overlap with the daily unpaid
// break window (e.g. the 12:00–13:00 lunch) on the check-in day — so an
// 08:00–17:00 shift logs 8h worked, not 9h.
export const computeHoursWorked = (clockInAt: Date, clockOutAt: Date, breakStart = DEFAULT_WORK_SCHEDULE.breakStartTime, breakEnd = DEFAULT_WORK_SCHEDULE.breakEndTime): number => {
  const spanMs = clockOutAt.getTime() - clockInAt.getTime();
  if (spanMs <= 0) return 0;
  const dayStart = new Date(clockInAt);
  dayStart.setHours(0, 0, 0, 0);
  const breakStartMs = dayStart.getTime() + toMinutes(breakStart) * 60000;
  const breakEndMs = dayStart.getTime() + toMinutes(breakEnd) * 60000;
  const breakMs = breakEndMs > breakStartMs ? Math.max(0, Math.min(clockOutAt.getTime(), breakEndMs) - Math.max(clockInAt.getTime(), breakStartMs)) : 0;
  return parseFloat(((spanMs - breakMs) / 3600000).toFixed(2));
};
export const getScheduleForDate = (settings: WorkScheduleSettings, date = new Date()) => {
  const dow = zonedDayOfWeek(date, settings.timezone);
  if (!settings.workingDays.includes(dow)) return null;
  const saturday = dow === 6;
  const startTime = saturday ? settings.saturdayStartTime : settings.workStartTime;
  const endTime = saturday ? settings.saturdayEndTime : settings.workEndTime;
  return { startTime, endTime, startMin: toMinutes(startTime), endMin: toMinutes(endTime) };
};
export const settingsFromRows = (rows: { key: string; value: string }[]): WorkScheduleSettings => {
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  let workingDays = DEFAULT_WORK_SCHEDULE.workingDays;
  try { const parsed = JSON.parse(values.working_days || "[]"); if (Array.isArray(parsed)) workingDays = parsed.map(Number).filter((day) => day >= 0 && day <= 6); } catch { /* defaults */ }
  return { workingDays: workingDays.length ? workingDays : DEFAULT_WORK_SCHEDULE.workingDays, workStartTime: values.work_start_time || "08:00", workEndTime: values.work_end_time || "17:00", saturdayStartTime: values.saturday_start_time || "08:00", saturdayEndTime: values.saturday_end_time || "12:00", breakStartTime: values.break_start_time || "12:00", breakEndTime: values.break_end_time || "13:00", lateGraceMinutes: Number(values.late_grace_minutes ?? 15), earlyLeaveGraceMinutes: Number(values.early_leave_grace_minutes ?? 15), checkoutReminderMinutes: Number(values.checkout_reminder_minutes ?? 15), timezone: values.timezone || DEFAULT_TIMEZONE };
};

export const getCheckoutReminderWindow = (date = new Date(), timezone = DEFAULT_TIMEZONE, customEndTime?: string | null) => {
  const dow = zonedDayOfWeek(date, timezone);
  let endMin = dow === 6 ? 12 * 60 : 17 * 60;
  if (dow !== 6 && customEndTime) {
    const [h, m] = customEndTime.split(":").map(Number);
    endMin = (h || 17) * 60 + (m || 0);
  }
  return { startMin: endMin, endMin: endMin + 60 };
};

export const getAutoCheckoutThresholdMinutes = (date = new Date(), timezone = DEFAULT_TIMEZONE, customEndTime?: string | null) => {
  const dow = zonedDayOfWeek(date, timezone);
  if (dow === 6) return 13 * 60;
  if (customEndTime) {
    const [h, m] = customEndTime.split(":").map(Number);
    return (h || 17) * 60 + (m || 0) + 60;
  }
  return 18 * 60;
};

export const getShiftEndLabel = (date = new Date(), timezone = DEFAULT_TIMEZONE, customEndTime?: string | null) => {
  const dow = zonedDayOfWeek(date, timezone);
  if (dow === 6) return "12:00 PM";
  if (customEndTime) {
    const [h, m] = customEndTime.split(":").map(Number);
    const ampm = (h || 17) >= 12 ? "PM" : "AM";
    const h12 = (h || 17) % 12 || 12;
    return `${h12}:${String(m || 0).padStart(2, "0")} ${ampm}`;
  }
  return "5:00 PM";
};
