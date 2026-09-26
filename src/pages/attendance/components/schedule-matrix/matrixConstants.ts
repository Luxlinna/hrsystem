export const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Public holiday mappings for Cambodian calendar highlights
export const CAMBODIA_OCTOBER_HOLIDAYS: Record<number, { code: string; name: string }> = {
  10: { code: "PB", name: "Pchum Ben Day 1" },
  11: { code: "PB", name: "Pchum Ben Day 2" },
  12: { code: "PB", name: "Pchum Ben Day 3" },
  15: { code: "CDKF", name: "King Father Commemoration Day" },
  29: { code: "CKC", name: "King's Coronation Day" },
};

// Default sample shifts roster cycle if no custom template is assigned yet
export const ROTATION_PATTERNS = [
  { defaultShift: "NMHQ", offDays: [0, 6] }, // HQ office: Mon-Fri NMHQ, Sat-Sun OFF
  { defaultShift: "HQ-2", offDays: [0, 6] }, // HQ Shift 2: Mon-Fri HQ-2, Sat-Sun OFF
  { defaultShift: "TH", weekendShift: "0812", offDays: [0] }, // Town branch: Mon-Fri TH, Sat 0812, Sun OFF
  { defaultShift: "NMO1", offDays: [2] }, // Ops shift: Tue off
  { defaultShift: "TH03", offDays: [0] }, // Store shift
  { defaultShift: "TH06", offDays: [0] },
];
