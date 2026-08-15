export const SATURDAY_WORK_END_TIME = "12:00";

export const isSaturday = (date = new Date()) => date.getDay() === 6;

export const getEffectiveWorkEndTime = (branchWorkEndTime: string | null | undefined, date = new Date()) => {
  if (isSaturday(date)) return SATURDAY_WORK_END_TIME;
  return branchWorkEndTime || null;
};

export const getCheckoutReminderWindow = (date = new Date()) => {
  if (isSaturday(date)) return { startMin: 11 * 60, endMin: 13 * 60 };
  return { startMin: 13 * 60, endMin: 19 * 60 };
};
