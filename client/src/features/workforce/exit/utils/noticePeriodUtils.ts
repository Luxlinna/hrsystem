export interface NoticePeriodValidation {
  isPermanent: boolean;
  tenureYears: number;
  tenureMonths: number;
  tenureDays: number;
  totalMonths: number;
  tenureDisplay: string;
  startDate: string | null;
  requiredNoticeDays: number;
  requiredNoticeLabel: string;
  minCompliantDate: string;
  selectedNoticeDays: number;
  isCompliant: boolean;
  shortfallDays: number;
  warningMessage: string | null;
}

export function isPermanentContract(contractType?: string | null): boolean {
  if (!contractType) return false;
  const c = contractType.trim().toLowerCase();
  return (
    c.includes("permanent") ||
    c.includes("udc") ||
    c.includes("undetermined") ||
    c === "full-time" ||
    c === "full time"
  );
}

export function calculateEmployeeTenure(
  startDateStr?: string | null,
  asOfDate: Date = new Date()
) {
  if (!startDateStr) {
    return { years: 0, months: 0, days: 0, totalMonths: 0, display: "Unknown start date" };
  }

  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) {
    return { years: 0, months: 0, days: 0, totalMonths: 0, display: "Invalid start date" };
  }

  let years = asOfDate.getFullYear() - start.getFullYear();
  let months = asOfDate.getMonth() - start.getMonth();
  let days = asOfDate.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 0).getDate();
    days += prevMonthDays;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) {
    return { years: 0, months: 0, days: 0, totalMonths: 0, display: "Just started" };
  }

  const totalMonths = years * 12 + months + (days >= 15 ? 0.5 : 0);

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  if (days > 0 && years === 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  const display = parts.length > 0 ? parts.join(", ") : "Less than 1 day";

  return { years, months, days, totalMonths, display };
}

export function calculateExitNoticePeriod(
  startDateStr?: string | null,
  contractType?: string | null,
  selectedEffectiveDate?: string | null
): NoticePeriodValidation {
  const isPermanent = isPermanentContract(contractType);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tenure = calculateEmployeeTenure(startDateStr, today);

  if (!isPermanent) {
    return {
      isPermanent: false,
      tenureYears: tenure.years,
      tenureMonths: tenure.months,
      tenureDays: tenure.days,
      totalMonths: tenure.totalMonths,
      tenureDisplay: tenure.display,
      startDate: startDateStr || null,
      requiredNoticeDays: 0,
      requiredNoticeLabel: "Standard notice (Non-Permanent contract)",
      minCompliantDate: today.toISOString().slice(0, 10),
      selectedNoticeDays: 0,
      isCompliant: true,
      shortfallDays: 0,
      warningMessage: null,
    };
  }

  // Tiers for Permanent Contract
  let requiredNoticeDays = 7;
  let requiredNoticeLabel = "At least 7 (seven) days’ advance notice";

  if (tenure.years >= 10) {
    requiredNoticeDays = 90;
    requiredNoticeLabel = "At least 3 (three) months’ advance notice";
  } else if (tenure.years >= 5) {
    requiredNoticeDays = 60;
    requiredNoticeLabel = "At least 2 (two) months’ advance notice";
  } else if (tenure.years >= 2) {
    requiredNoticeDays = 30;
    requiredNoticeLabel = "At least 1 (one) month’s advance notice";
  } else if (tenure.totalMonths >= 6) {
    requiredNoticeDays = 15;
    requiredNoticeLabel = "At least 15 (fifteen) days’ advance notice";
  } else {
    requiredNoticeDays = 7;
    requiredNoticeLabel = "At least 7 (seven) days’ advance notice";
  }

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + requiredNoticeDays);
  const minCompliantDate = minDate.toISOString().slice(0, 10);

  let selectedNoticeDays = 0;
  let isCompliant = true;
  let shortfallDays = 0;
  let warningMessage: string | null = null;

  if (selectedEffectiveDate) {
    const eff = new Date(selectedEffectiveDate);
    eff.setHours(0, 0, 0, 0);
    const diffMs = eff.getTime() - today.getTime();
    selectedNoticeDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (selectedNoticeDays < requiredNoticeDays) {
      isCompliant = false;
      shortfallDays = requiredNoticeDays - Math.max(0, selectedNoticeDays);
      warningMessage = `Notice period shortfall: Selected date is ${selectedNoticeDays <= 0 ? "today or in the past" : `${selectedNoticeDays} day(s) away`}. Permanent contract with tenure of ${tenure.display} requires ${requiredNoticeLabel} (earliest compliant date: ${minCompliantDate}).`;
    }
  }

  return {
    isPermanent: true,
    tenureYears: tenure.years,
    tenureMonths: tenure.months,
    tenureDays: tenure.days,
    totalMonths: tenure.totalMonths,
    tenureDisplay: tenure.display,
    startDate: startDateStr || null,
    requiredNoticeDays,
    requiredNoticeLabel,
    minCompliantDate,
    selectedNoticeDays,
    isCompliant,
    shortfallDays,
    warningMessage,
  };
}
