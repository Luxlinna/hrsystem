export interface WorkScheduleSettings { workingDays: number[]; workStartTime: string; workEndTime: string; saturdayStartTime: string; saturdayEndTime: string; lateGraceMinutes: number; earlyLeaveGraceMinutes: number; checkoutReminderMinutes: number; }
export const DEFAULT_WORK_SCHEDULE: WorkScheduleSettings = { workingDays: [1, 2, 3, 4, 5, 6], workStartTime: "08:00", workEndTime: "17:00", saturdayStartTime: "08:00", saturdayEndTime: "12:00", lateGraceMinutes: 15, earlyLeaveGraceMinutes: 15, checkoutReminderMinutes: 15 };
const toMinutes = (value: string) => { const [h, m] = value.split(":").map(Number); return h * 60 + m; };
export const getScheduleForDate = (settings: WorkScheduleSettings, date = new Date()) => {
  if (!settings.workingDays.includes(date.getDay())) return null;
  const saturday = date.getDay() === 6;
  const startTime = saturday ? settings.saturdayStartTime : settings.workStartTime;
  const endTime = saturday ? settings.saturdayEndTime : settings.workEndTime;
  return { startTime, endTime, startMin: toMinutes(startTime), endMin: toMinutes(endTime) };
};
export const settingsFromRows = (rows: { key: string; value: string }[]): WorkScheduleSettings => {
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  let workingDays = DEFAULT_WORK_SCHEDULE.workingDays;
  try { const parsed = JSON.parse(values.working_days || "[]"); if (Array.isArray(parsed)) workingDays = parsed.map(Number).filter((day) => day >= 0 && day <= 6); } catch { /* defaults */ }
  return { workingDays: workingDays.length ? workingDays : DEFAULT_WORK_SCHEDULE.workingDays, workStartTime: values.work_start_time || "08:00", workEndTime: values.work_end_time || "17:00", saturdayStartTime: values.saturday_start_time || "08:00", saturdayEndTime: values.saturday_end_time || "12:00", lateGraceMinutes: Number(values.late_grace_minutes ?? 15), earlyLeaveGraceMinutes: Number(values.early_leave_grace_minutes ?? 15), checkoutReminderMinutes: Number(values.checkout_reminder_minutes ?? 15) };
};

export const getCheckoutReminderWindow = (date = new Date()) => {
  const endMin = date.getDay() === 6 ? 12 * 60 : 17 * 60;
  return { startMin: endMin - 15, endMin };
};
