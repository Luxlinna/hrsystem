export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const PRESET_COLORS = [
  { name: "Navy", value: "#253C7D" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Sky", value: "#0284C7" },
  { name: "Teal", value: "#0D9488" },
  { name: "Emerald", value: "#059669" },
  { name: "Amber", value: "#D97706" },
  { name: "Rose", value: "#E11D48" },
  { name: "Purple", value: "#7C3AED" },
];

export const SHIFT_TEMPLATES = [
  { label: "Morning", name: "Morning Shift", start: "08:00", end: "16:00", color: "#0284C7", capacity: 4 },
  { label: "Standard Day", name: "Standard Day Shift", start: "09:00", end: "17:00", color: "#253C7D", capacity: 5 },
  { label: "Afternoon/Evening", name: "Evening Shift", start: "14:00", end: "22:00", color: "#7C3AED", capacity: 4 },
  { label: "Night Roster", name: "Night Shift", start: "22:00", end: "06:00", color: "#4F46E5", capacity: 3 },
  { label: "Weekend Full", name: "Weekend Shift", start: "10:00", end: "19:00", color: "#D97706", capacity: 6 },
];

export const deptColors: Record<string, string> = {
  Operations: "#253C7D",
  Sales: "#29ABE2",
  IT: "#74C8EC",
  Finance: "#8B5CF6",
  Marketing: "#EC4899",
  "Customer Service": "#E07B39",
  HR: "#EF4444",
  Engineering: "#3B82F6",
  Legal: "#6B7280",
};
