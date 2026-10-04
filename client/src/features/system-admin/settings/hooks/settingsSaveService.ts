import { supabase } from "@/lib/supabase";
import { formatTimeSeconds, TIME_FIELD_KEYS } from "./settingsScheduleUtils";

export async function saveSiteSingleSetting(siteId: string, key: string, val: string) {
  const updatePayload: Record<string, any> = {};
  if (key === "is_four_punch_enabled") {
    updatePayload.is_four_punch_enabled = val === "true";
  } else if (key === "late_grace_minutes" || key === "early_leave_grace_minutes") {
    updatePayload[key] = parseInt(val, 10) || 15;
  } else {
    updatePayload[key] = formatTimeSeconds(val);
  }

  return supabase.from("work_locations").update(updatePayload).eq("id", siteId);
}

export async function saveBranchSingleSetting(branchId: string, key: string, val: string) {
  const updateVal =
    key === "late_grace_minutes" || key === "early_leave_grace_minutes"
      ? parseInt(val, 10) || 15
      : formatTimeSeconds(val);

  return supabase.from("branches").update({ [key]: updateVal }).eq("id", branchId);
}

export async function saveSystemSingleSetting(key: string, val: string) {
  return supabase.from("system_settings").upsert(
    { key, value: val, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
}

export async function saveSiteBatch(
  siteId: string,
  changedKeys: string[],
  edited: Record<string, string>
) {
  const sitePayload: Record<string, any> = {};
  const systemKeys: string[] = [];

  for (const key of changedKeys) {
    if (key === "is_four_punch_enabled") {
      sitePayload.is_four_punch_enabled = edited[key] === "true";
    } else if (key === "late_grace_minutes" || key === "early_leave_grace_minutes") {
      sitePayload[key] = parseInt(edited[key], 10) || 15;
    } else if ((TIME_FIELD_KEYS as readonly string[]).includes(key)) {
      sitePayload[key] = formatTimeSeconds(edited[key]);
    } else {
      systemKeys.push(key);
    }
  }

  if (Object.keys(sitePayload).length > 0) {
    const { error } = await supabase.from("work_locations").update(sitePayload).eq("id", siteId);
    if (error) throw error;
  }

  for (const key of systemKeys) {
    const { error } = await supabase
      .from("system_settings")
      .update({ value: edited[key], updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) throw error;
  }
}

export async function saveBranchBatch(
  branchId: string,
  changedKeys: string[],
  edited: Record<string, string>
) {
  const branchPayload: Record<string, any> = {};
  const systemKeys: string[] = [];

  for (const key of changedKeys) {
    if (key === "late_grace_minutes" || key === "early_leave_grace_minutes") {
      branchPayload[key] = parseInt(edited[key], 10) || 15;
    } else if ((TIME_FIELD_KEYS as readonly string[]).includes(key)) {
      branchPayload[key] = formatTimeSeconds(edited[key]);
    } else {
      systemKeys.push(key);
    }
  }

  if (Object.keys(branchPayload).length > 0) {
    const { error } = await supabase.from("branches").update(branchPayload).eq("id", branchId);
    if (error) throw error;
  }

  for (const key of systemKeys) {
    const { error } = await supabase
      .from("system_settings")
      .update({ value: edited[key], updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) throw error;
  }
}

export async function saveSystemBatch(
  changedKeys: string[],
  edited: Record<string, string>
) {
  for (const key of changedKeys) {
    const { error } = await supabase.from("system_settings").upsert(
      { key, value: edited[key], updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    if (error) throw error;
  }
}
