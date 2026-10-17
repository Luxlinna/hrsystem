import { supabase } from "@/lib/supabase";

export interface LeaveTypeSetting {
  id: string;
  code: string;
  name: string;
  period_type: "daily" | "hourly";
  rate: number;
  allow_compensatory: boolean;
  is_unpaid: boolean;
  eligible_for: "both" | "male" | "female";
  excluded_contract_types: string[];
  request_in_advance: boolean;
  require_attachment: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_LEAVE_TYPES: LeaveTypeSetting[] = [
  {
    id: "695b219c-0312-4b94-b507-02eece433c49",
    code: "AL",
    name: "Annual Leave (ការឈប់សម្រាកប្រចាំឆ្នាំ)",
    period_type: "daily",
    rate: 1.0,
    allow_compensatory: false,
    is_unpaid: false,
    eligible_for: "both",
    excluded_contract_types: ["Internship", "Probation"],
    request_in_advance: false,
    require_attachment: false,
    is_active: true,
  },
  {
    id: "7d138744-b59d-44c4-963c-0d8dca0a7e00",
    code: "SL",
    name: "Sick Leave (ការឈប់សម្រាកដោយជំងឺ)",
    period_type: "daily",
    rate: 1.0,
    allow_compensatory: false,
    is_unpaid: false,
    eligible_for: "both",
    excluded_contract_types: [],
    request_in_advance: false,
    require_attachment: true,
    is_active: true,
  },
  {
    id: "2eadbf4a-dd1e-41db-a611-fe7e8587a90d",
    code: "UL",
    name: "Unpaid Leave (ការឈប់សម្រាកគ្មានប្រាក់ឈ្នួល)",
    period_type: "daily",
    rate: 1.0,
    allow_compensatory: false,
    is_unpaid: true,
    eligible_for: "both",
    excluded_contract_types: [],
    request_in_advance: true,
    require_attachment: false,
    is_active: true,
  },
  {
    id: "83b0aee3-9627-42e8-adea-0f1e3522d3e3",
    code: "CL",
    name: "Compensatory Leave (ផ្ទេរថ្ងៃបុណ្យ/ឈប់សម្រាក)",
    period_type: "daily",
    rate: 1.0,
    allow_compensatory: true,
    is_unpaid: false,
    eligible_for: "both",
    excluded_contract_types: [],
    request_in_advance: false,
    require_attachment: false,
    is_active: true,
  },
  {
    id: "178c2925-7940-498c-a5f8-f31a8fc5a186",
    code: "ML",
    name: "Maternity Leave (ការឈប់សម្រាកលំហែមាតុភាព)",
    period_type: "daily",
    rate: 1.0,
    allow_compensatory: false,
    is_unpaid: false,
    eligible_for: "female",
    excluded_contract_types: ["Internship"],
    request_in_advance: true,
    require_attachment: true,
    is_active: true,
  },
  {
    id: "81706658-877e-48c4-bb32-88f59b901d44",
    code: "SP",
    name: "Special Leave (ការឈប់សម្រាកពិសេសច្បាប់ការងារ)",
    period_type: "daily",
    rate: 1.0,
    allow_compensatory: false,
    is_unpaid: false,
    eligible_for: "both",
    excluded_contract_types: [],
    request_in_advance: false,
    require_attachment: true,
    is_active: true,
  },
];

const LOCAL_STORAGE_KEY = "hrsystem_leave_types_settings";

/**
 * Normalizes any leave type setting or code/slug string into a consistent form identifier
 */
export function getLeaveTypeSlug(item: { code?: string; name?: string } | string | null | undefined): string {
  if (!item) return "annual";
  const code = (typeof item === "string" ? item : item?.code || "").trim().toUpperCase();

  switch (code) {
    case "AL":
      return "annual";
    case "SL":
      return "sick";
    case "UL":
    case "UP":
      return "unpaid";
    case "CL":
      return "compensatory";
    case "ML":
      return "maternity";
    case "SP":
      return "special";
    case "PL":
      return "paternity";
    case "BL":
      return "bereavement";
    case "STL":
      return "study";
    default: {
      if (typeof item === "string") {
        const lower = item.toLowerCase();
        if (lower.includes("annual")) return "annual";
        if (lower.includes("sick")) return "sick";
        if (lower.includes("unpaid")) return "unpaid";
        if (lower.includes("compensat")) return "compensatory";
        if (lower.includes("maternity")) return "maternity";
        if (lower.includes("special")) return "special";
        if (lower.includes("paternity")) return "paternity";
        if (lower.includes("bereavement")) return "bereavement";
        if (lower.includes("study")) return "study";
        return lower;
      }
      return (item.code || "annual").toLowerCase();
    }
  }
}

/**
 * Returns UI theme colors and icons for a leave type code or slug
 */
export function getLeaveTypeTheme(codeOrSlug: string): {
  icon: string;
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
} {
  const slug = getLeaveTypeSlug(codeOrSlug);
  switch (slug) {
    case "annual":
      return {
        icon: "ri-sun-line",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        badgeBg: "bg-emerald-100 text-emerald-800",
      };
    case "sick":
      return {
        icon: "ri-heart-pulse-line",
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        badgeBg: "bg-rose-100 text-rose-800",
      };
    case "special":
      return {
        icon: "ri-star-line",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        badgeBg: "bg-amber-100 text-amber-800",
      };
    case "maternity":
      return {
        icon: "ri-parent-line",
        bg: "bg-pink-50",
        text: "text-pink-700",
        border: "border-pink-200",
        badgeBg: "bg-pink-100 text-pink-800",
      };
    case "compensatory":
      return {
        icon: "ri-calendar-check-line",
        bg: "bg-teal-50",
        text: "text-teal-700",
        border: "border-teal-200",
        badgeBg: "bg-teal-100 text-teal-800",
      };
    case "unpaid":
      return {
        icon: "ri-pause-circle-line",
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
        badgeBg: "bg-slate-100 text-slate-800",
      };
    case "paternity":
      return {
        icon: "ri-user-heart-line",
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        border: "border-indigo-200",
        badgeBg: "bg-indigo-100 text-indigo-800",
      };
    case "bereavement":
      return {
        icon: "ri-empathize-line",
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        badgeBg: "bg-purple-100 text-purple-800",
      };
    case "study":
      return {
        icon: "ri-book-open-line",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        badgeBg: "bg-blue-100 text-blue-800",
      };
    default:
      return {
        icon: "ri-calendar-event-line",
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
        badgeBg: "bg-slate-100 text-slate-800",
      };
  }
}

function getLocalSettings(): LeaveTypeSetting[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not parse local leave types settings:", e);
  }
  return DEFAULT_LEAVE_TYPES;
}

function saveLocalSettings(types: LeaveTypeSetting[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(types));
    window.dispatchEvent(new CustomEvent("leave_types_settings_updated", { detail: types }));
  } catch (e) {
    console.warn("Could not save local leave types settings:", e);
  }
}

export function getStoredLeaveTypes(): LeaveTypeSetting[] {
  return getLocalSettings();
}

export async function fetchLeaveSettings(): Promise<LeaveTypeSetting[]> {
  try {
    const { data, error } = await supabase
      .from("leave_types")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      saveLocalSettings(data as LeaveTypeSetting[]);
      return data as LeaveTypeSetting[];
    }
  } catch (err) {
    console.info("Using local leave types storage fallback:", err);
  }
  return getLocalSettings();
}

export async function upsertLeaveSetting(
  item: Omit<LeaveTypeSetting, "id"> & { id?: string }
): Promise<LeaveTypeSetting> {
  const payload = {
    ...item,
    id: item.id || crypto.randomUUID(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("leave_types")
      .upsert(payload)
      .select()
      .maybeSingle();

    if (!error && data) {
      const current = getLocalSettings().filter((x) => x.id !== data.id);
      saveLocalSettings([...current, data as LeaveTypeSetting]);
      return data as LeaveTypeSetting;
    }
  } catch (err) {
    console.warn("Remote save failed, falling back to local:", err);
  }

  const current = getLocalSettings().filter((x) => x.id !== payload.id);
  const updated = [...current, payload as LeaveTypeSetting];
  saveLocalSettings(updated);
  return payload as LeaveTypeSetting;
}

export async function deleteLeaveSetting(id: string): Promise<boolean> {
  try {
    await supabase.from("leave_types").delete().eq("id", id);
  } catch (err) {
    console.warn("Remote delete failed:", err);
  }
  const current = getLocalSettings().filter((x) => x.id !== id);
  saveLocalSettings(current);
  return true;
}
