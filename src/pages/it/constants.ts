import type { AssetFormState, TicketFormState, StationeryItemFormState, StationeryRequestFormState, StationeryItem } from "./types";

export const ASSET_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  Laptop: { label: "Laptop", icon: "ri-macbook-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Display: { label: "Monitor / Display", icon: "ri-tv-2-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Mobile: { label: "Mobile Device", icon: "ri-smartphone-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Phone: { label: "VoIP / Desk Phone", icon: "ri-phone-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Peripheral: { label: "Peripheral & Accessory", icon: "ri-keyboard-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Server: { label: "Server Infrastructure", icon: "ri-server-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Network: { label: "Network & Router", icon: "ri-wifi-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Power: { label: "Power & UPS", icon: "ri-flashlight-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Furniture: { label: "Office Equipment", icon: "ri-armchair-line", color: "text-slate-600", bg: "bg-slate-100" },
  Other: { label: "Other Asset", icon: "ri-box-3-line", color: "text-slate-600", bg: "bg-slate-100" },
};

export const ASSET_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  active: {
    label: "Active / Deployed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  inventory: {
    label: "In Stock / Ready",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-500",
  },
  maintenance: {
    label: "Under Repair",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  retired: {
    label: "Retired / Decommissioned",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

export const TICKET_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  open: {
    label: "Open Request",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    icon: "ri-loader-2-line",
  },
  resolved: {
    label: "Resolved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-fill",
  },
  closed: {
    label: "Closed",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: "ri-archive-line",
  },
};

export const PRIORITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  low: {
    label: "Low",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: "ri-arrow-down-line",
  },
  medium: {
    label: "Medium",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    icon: "ri-equal-line",
  },
  high: {
    label: "High Priority",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-arrow-up-line",
  },
  critical: {
    label: "Critical / Urgent",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-alarm-warning-line",
  },
};

export const TICKET_CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Access",
  "Account",
  "Security",
  "Email",
  "Other",
];

export interface AssetCategoryCardConfig {
  id: string;
  name: string;
  subType: "Electronic Hardware" | "Office Supply" | "Furniture" | string;
  trackingBadges: string[];
  keywords: string[];
}

export const STANDARD_ASSET_CATEGORIES: AssetCategoryCardConfig[] = [
  {
    id: "contact_phone_sim",
    name: "Contact: Phone, Sim Card Number",
    subType: "Electronic Hardware",
    trackingBadges: ["Track Serial Number", "Track Warranty", "Track Tagging"],
    keywords: ["phone", "mobile", "sim", "cell", "contact", "telecom"],
  },
  {
    id: "desktop_bundle",
    name: "Desktop: Mouse, Pad, Keyboard, Monitor, System Unit, Extension Cord",
    subType: "Electronic Hardware",
    trackingBadges: ["Track Serial Number", "Track Warranty", "Track Tagging"],
    keywords: ["desktop", "workstation", "pc", "tower", "system unit"],
  },
  {
    id: "laptop_bundle",
    name: "Laptop: Mouse, Pad, Charger, Bag, Extension",
    subType: "Electronic Hardware",
    trackingBadges: ["Track Serial Number", "Track Warranty", "Track Tagging"],
    keywords: ["laptop", "notebook", "thinkpad", "macbook", "latitude"],
  },
  {
    id: "office_equipment",
    name: "Off. Equipment: Name Tage, Officer Card",
    subType: "Office Supply",
    trackingBadges: ["Track Serial Number", "Track Warranty", "Track Tagging"],
    keywords: ["badge", "card", "tag", "equipment", "stamp", "office supply"],
  },
  {
    id: "peripherals",
    name: "Peripherals: Headset, Mouse, Keyboard, Webcam",
    subType: "Electronic Hardware",
    trackingBadges: ["Track Serial Number", "Track Warranty", "Track Tagging"],
    keywords: ["peripheral", "mouse", "keyboard", "headset", "webcam", "accessory"],
  },
  {
    id: "displays",
    name: "Display: 24\" & 27\" LED Workstation Monitors",
    subType: "Electronic Hardware",
    trackingBadges: ["Track Serial Number", "Track Warranty", "Track Tagging"],
    keywords: ["display", "monitor", "screen"],
  },
  {
    id: "furniture",
    name: "Office Furniture: Ergonomic Chair, Desk, Cabinet",
    subType: "Office Supply",
    trackingBadges: ["Track Serial Number", "Track Warranty", "Track Tagging"],
    keywords: ["furniture", "chair", "desk", "table", "cabinet"],
  },
  {
    id: "server_network",
    name: "Network & Server: Router, Access Point, Switch, Rack",
    subType: "Electronic Hardware",
    trackingBadges: ["Track Serial Number", "Track Warranty", "Track Tagging"],
    keywords: ["server", "network", "router", "switch", "access point"],
  },
];

export const ASSET_CATEGORIES = [
  "Contact: Phone, Sim Card Number",
  "Desktop: Mouse, Pad, Keyboard, Monitor, System Unit, Extension Cord",
  "Laptop: Mouse, Pad, Charger, Bag, Extension",
  "Off. Equipment: Name Tage, Officer Card",
  "Peripherals: Headset, Mouse, Keyboard, Webcam",
  "Display: 24\" & 27\" LED Workstation Monitors",
  "Office Furniture: Ergonomic Chair, Desk, Cabinet",
  "Network & Server: Router, Access Point, Switch, Rack",
  "Other",
];

export const ASSET_CONDITIONS = [
  "New",
  "Good",
  "Fair",
  "Poor",
  "Damaged",
];

export const INITIAL_ASSET_FORM: AssetFormState = {
  name: "",
  asset_tag: "",
  type: "Laptop",
  category: "",
  purchase_date: new Date().toISOString().split("T")[0],
  description: "",
  condition: "New",
  price: 0,
  price_currency: "USD",
  site: "",
  serial_number: "",
  branch_id: "",
  employee_id: "",
  status: "inventory",
  photo_url: null,
  attachments: [],
};

export const INITIAL_TICKET_FORM: TicketFormState = {
  title: "",
  requester_name: "",
  priority: "medium",
  category: "Hardware",
  description: "",
};

export const STATIONERY_CATEGORIES = [
  "Paper & Notebooks",
  "Writing & Pens",
  "Filing & Binders",
  "Desk & Fasteners",
  "Printer & Toner",
  "Accessories & Badges",
  "Other Supplies",
] as const;

export const STATIONERY_CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  "Paper & Notebooks": { label: "Paper & Notebooks", icon: "ri-file-paper-2-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  "Writing & Pens": { label: "Writing & Pens", icon: "ri-edit-line", color: "text-indigo-600", bg: "bg-indigo-50" },
  "Filing & Binders": { label: "Filing & Binders", icon: "ri-folder-shared-line", color: "text-amber-600", bg: "bg-amber-50" },
  "Desk & Fasteners": { label: "Desk & Fasteners", icon: "ri-attachment-line", color: "text-teal-600", bg: "bg-teal-50" },
  "Printer & Toner": { label: "Printer & Toner", icon: "ri-printer-line", color: "text-purple-600", bg: "bg-purple-50" },
  "Accessories & Badges": { label: "Accessories & Badges", icon: "ri-id-card-line", color: "text-cyan-600", bg: "bg-cyan-50" },
  "Other Supplies": { label: "Other Supplies", icon: "ri-box-3-line", color: "text-slate-600", bg: "bg-slate-100" },
};

export const STATIONERY_STATUS_CONFIG = {
  in_stock: { label: "In Stock", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  low_stock: { label: "Low Stock Alert", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  out_of_stock: { label: "Out of Stock", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
};

export const STATIONERY_REQUEST_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  pending: { label: "Pending Approval", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "ri-time-line" },
  approved: { label: "Approved (Ready to Issue)", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "ri-check-line" },
  issued: { label: "Issued & Disbursed", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "ri-checkbox-circle-fill" },
  rejected: { label: "Declined", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: "ri-close-circle-line" },
};

export const INITIAL_STATIONERY_FORM: StationeryItemFormState = {
  name: "",
  category: "Paper & Notebooks",
  sku: "",
  stock_quantity: 10,
  min_stock_level: 5,
  unit: "box",
  unit_cost: "",
  location: "Main Supply Room",
  branch_id: "",
};

export const INITIAL_STATIONERY_REQUEST_FORM: StationeryRequestFormState = {
  item_id: "",
  requested_by_name: "",
  department: "General",
  quantity: 1,
  purpose: "",
  urgency: "normal",
  branch_id: "",
};



