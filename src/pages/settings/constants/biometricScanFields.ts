export interface ScanWindowField {
  key: string;
  label: string;
  hint: string;
}

export const SCAN_WINDOWS_FIELDS: ScanWindowField[] = [
  {
    key: "morning_check_in_start",
    label: "Morning Check-In Window Start",
    hint: "Earliest biometric check-in accepted (e.g. 06:00 AM).",
  },
  {
    key: "morning_check_in_end",
    label: "Morning Check-In Window End",
    hint: "Latest check-in accepted (e.g. 09:00 AM). Scans after this are late.",
  },
  {
    key: "morning_check_out_start",
    label: "Morning Check-Out Window Start",
    hint: "Earliest morning checkout / lunch break accepted (e.g. 10:00 AM).",
  },
  {
    key: "morning_check_out_end",
    label: "Morning Check-Out Window End",
    hint: "Latest morning checkout accepted (e.g. 12:00 PM).",
  },
  {
    key: "afternoon_check_in_start",
    label: "Afternoon Check-In Window Start",
    hint: "Earliest afternoon return accepted (e.g. 12:00 PM).",
  },
  {
    key: "afternoon_check_in_end",
    label: "Afternoon Check-In Window End",
    hint: "Latest afternoon check-in accepted (e.g. 02:00 PM).",
  },
  {
    key: "afternoon_check_out_start",
    label: "Afternoon Check-Out Window Start",
    hint: "Earliest afternoon checkout accepted (e.g. 04:00 PM).",
  },
  {
    key: "afternoon_check_out_end",
    label: "Afternoon Check-Out Window End",
    hint: "Latest afternoon checkout accepted (e.g. 06:00 PM).",
  },
];
