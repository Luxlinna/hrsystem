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
    id: "default-al",
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
    id: "default-sl",
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
    id: "default-ul",
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
    id: "default-cl",
    code: "CL",
    name: "Compensatory Leave (ផ្ទេរថ្ងៃបុណ្យ/ឈប់សម្រាក)",
    period_type: "daily",
    rate: 1.0,
    allow_compensatory: true,
    is_unpaid: false,
    eligible_for: "both",
    excluded_contract_types: ["Internship"],
    request_in_advance: false,
    require_attachment: false,
    is_active: true,
  },
  {
    id: "default-ml",
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
];

const LOCAL_STORAGE_KEY = "hrsystem_leave_types_settings";

function getLocalSettings(): LeaveTypeSetting[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not parse local leave types settings:", e);
  }
  return DEFAULT_LEAVE_TYPES;
}

function saveLocalSettings(types: LeaveTypeSetting[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(types));
  } catch (e) {
    console.warn("Could not save local leave types settings:", e);
  }
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
