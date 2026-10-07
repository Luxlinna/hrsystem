import { supabase } from "@/lib/supabase";
import type { BranchScheduleData, WorkingHoursFormState } from "@/features/time-attendance/attendance/tabs/working-hours/types";

export async function fetchBranchSchedule(branchId: string): Promise<Partial<BranchScheduleData> | null> {
  const [branchRes, settingsRes] = await Promise.all([
    supabase
      .from("branches")
      .select("id, name, work_start_time, work_end_time, break_start_time, break_end_time, is_four_punch_enabled, late_grace_minutes, early_leave_grace_minutes, morning_check_in_start, morning_check_in_end, morning_check_out_start, morning_check_out_end, afternoon_check_in_start, afternoon_check_in_end, afternoon_check_out_start, afternoon_check_out_end")
      .eq("id", branchId)
      .maybeSingle(),
    supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        `bu_auto_checkout_time_${branchId}`,
        `bu_auto_checkout_enabled_${branchId}`,
        `bu_four_punch_${branchId}`,
      ]),
  ]);

  if (!branchRes.data) return null;
  const data = branchRes.data as any;

  const settingsMap: Record<string, string> = {};
  (settingsRes.data || []).forEach((row) => {
    if (row.key) settingsMap[row.key] = row.value;
  });

  const customAutoTime = settingsMap[`bu_auto_checkout_time_${branchId}`] || data.auto_checkout_time || "18:00";
  const customAutoEnabled = settingsMap[`bu_auto_checkout_enabled_${branchId}`] !== undefined
    ? settingsMap[`bu_auto_checkout_enabled_${branchId}`] === "true"
    : (data.is_auto_checkout_enabled ?? true);

  return {
    ...data,
    auto_checkout_time: customAutoTime,
    is_auto_checkout_enabled: customAutoEnabled,
  };
}

export async function saveBranchSchedule(
  branchId: string,
  formState: WorkingHoursFormState
): Promise<void> {
  const basePayload = {
    work_start_time: formState.work_start_time,
    work_end_time: formState.work_end_time,
    break_start_time: formState.break_start_time,
    break_end_time: formState.break_end_time,
    is_four_punch_enabled: formState.is_four_punch_enabled,
    late_grace_minutes: parseInt(String(formState.late_grace_minutes), 10) || 0,
    early_leave_grace_minutes: parseInt(String(formState.early_leave_grace_minutes), 10) || 0,
    morning_check_in_start: formState.morning_check_in_start,
    morning_check_in_end: formState.morning_check_in_end,
    morning_check_out_start: formState.morning_check_out_start,
    morning_check_out_end: formState.morning_check_out_end,
    afternoon_check_in_start: formState.afternoon_check_in_start,
    afternoon_check_in_end: formState.afternoon_check_in_end,
    afternoon_check_out_start: formState.afternoon_check_out_start,
    afternoon_check_out_end: formState.afternoon_check_out_end,
  };

  // Sync settings rows for resilient persistence
  await supabase.from("system_settings").upsert(
    [
      { key: `bu_four_punch_${branchId}`, value: String(formState.is_four_punch_enabled), updated_at: new Date().toISOString() },
      { key: `bu_auto_checkout_time_${branchId}`, value: formState.auto_checkout_time || "18:00", updated_at: new Date().toISOString() },
      { key: `bu_auto_checkout_enabled_${branchId}`, value: String(formState.is_auto_checkout_enabled ?? true), updated_at: new Date().toISOString() },
    ],
    { onConflict: "key" }
  );

  // Attempt update with extended columns
  const extendedPayload = {
    ...basePayload,
    auto_checkout_time: formState.auto_checkout_time || "18:00",
    is_auto_checkout_enabled: formState.is_auto_checkout_enabled ?? true,
  };

  const branchUpdate = await supabase.from("branches").update(extendedPayload).eq("id", branchId);
  if (branchUpdate.error) {
    // Fallback if column does not yet exist in remote Postgres table
    const retry = await supabase.from("branches").update(basePayload).eq("id", branchId);
    if (retry.error) throw new Error(retry.error.message);
  }

  // Update work locations (sites) under this branch
  const locUpdate = await supabase.from("work_locations").update(extendedPayload).eq("branch_id", branchId);
  if (locUpdate.error) {
    await supabase.from("work_locations").update(basePayload).eq("branch_id", branchId);
  }
}
