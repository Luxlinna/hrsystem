/**
 * Annual Leave (AL) Proration & Entitlement System Utilities
 * Based on Cambodia Labour Law & Company Leave System Specification
 */

export interface ALJoinProrateBracket {
  range: string;
  days: number;
  description: string;
}

export const AL_PRORATE_FORMULA_BRACKETS: ALJoinProrateBracket[] = [
  { range: "1st – 14th", days: 1.5, description: "Full month prorate allowance (1.5 days)" },
  { range: "15th – 20th", days: 1.0, description: "Mid-month prorate allowance (1.0 day)" },
  { range: "21st – 31st", days: 0.0, description: "Late join prorate allowance (0 days)" },
];

export const CONTRACT_TYPES_EXCLUDED_FROM_AL = ["Probation", "Internship", "Trainee"];

/**
 * Calculates the prorated AL days for an employee's join month based on day of month.
 * - 1st - 14th: 1.5 days
 * - 15th - 20th: 1.0 day
 * - 21st - 31st: 0 days
 */
export function calculateJoinMonthProrateAL(joinDate: Date | string): number {
  const d = new Date(joinDate);
  if (isNaN(d.getTime())) return 1.5;
  const day = d.getDate();

  if (day >= 1 && day <= 14) return 1.5;
  if (day >= 15 && day <= 20) return 1.0;
  return 0.0;
}

/**
 * Calculates prorate days for an exiting employee's last month:
 * - If last day on or before 14th: 0 days
 * - If last day on or between 15th - 20th: 1.0 day
 * - If last day on or after 21st: 1.5 days
 */
export function calculateExitMonthProrateAL(lastWorkingDay: Date | string): number {
  const d = new Date(lastWorkingDay);
  if (isNaN(d.getTime())) return 0;
  const day = d.getDate();

  if (day < 15) return 0.0;
  if (day <= 20) return 1.0;
  return 1.5;
}

/**
 * Checks if a contract type is allowed to use Annual Leave.
 * Probation and Internship contracts cannot access AL until probation is passed.
 */
export function isContractAllowedAL(contractType?: string | null): boolean {
  if (!contractType) return true;
  return !CONTRACT_TYPES_EXCLUDED_FROM_AL.some((t) =>
    contractType.toLowerCase().includes(t.toLowerCase())
  );
}

/**
 * Calculates the AL balance accrued upon passing probation:
 * Staff receive AL balance from start month to current month:
 * estimated 4.5 days for standard 3-month probation + start month prorate.
 */
export function calculateProbationCompletionAL(
  joinDate: Date | string,
  passDate?: Date | string
): number {
  const j = new Date(joinDate);
  const p = passDate ? new Date(passDate) : new Date();
  if (isNaN(j.getTime())) return 4.5;

  // Prorated days for start month
  const startMonthProrate = calculateJoinMonthProrateAL(j);

  // Full months between start and pass date
  const monthsDiff =
    (p.getFullYear() - j.getFullYear()) * 12 + (p.getMonth() - j.getMonth());

  // 3 months baseline ~ 4.5 days, adjusted for exact full months
  const baseline = Math.max(0, monthsDiff - 1) * 1.5 + startMonthProrate;
  return Math.max(4.5, Math.round(baseline * 10) / 10);
}
