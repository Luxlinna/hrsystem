export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  paid: {
    label: "Paid",
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/30",
    icon: "ri-checkbox-circle-fill",
  },
  processed: {
    label: "Processed",
    bg: "bg-sky-50 dark:bg-sky-500/15",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-500/30",
    icon: "ri-check-line",
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50 dark:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/30",
    icon: "ri-time-line",
  },
};

export const DEFAULT_BRANCH_PAYROLL_POLICY = {
  pay_cycle: "monthly" as const,
  pay_day: 28,
  cutoff_day: 25,
  overtime_rate: 1.5,
  tax_rate: 5.0,
  social_security_rate: 4.0,
  health_insurance_rate: 2.0,
  currency: "USD",
  disbursement_method: "bank_transfer" as const,
  bank_name: "",
  bank_account_number: "",
  requires_two_tier_approval: true,
  auto_calculate_overtime: true,
  auto_deduct_late_penalties: false,
  policy_notes: "",
};
