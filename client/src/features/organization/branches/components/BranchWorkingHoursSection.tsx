import { useState, useEffect } from "react";
import type { Branch } from "../types";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { WorkingHoursFormState, BranchScheduleData } from "@/features/time-attendance/attendance/tabs/working-hours/types";
import { WorkingHoursKpiCards } from "@/features/time-attendance/attendance/tabs/working-hours/WorkingHoursKpiCards";
import { WorkingHoursSessionWindows } from "@/features/time-attendance/attendance/tabs/working-hours/WorkingHoursSessionWindows";
import { AdjustWorkingHoursModal } from "@/features/time-attendance/attendance/tabs/working-hours/AdjustWorkingHoursModal";

interface Props {
  branch: Branch;
  canManage?: boolean;
}

export function BranchWorkingHoursSection({ branch, canManage = true }: Props) {
  const [currentBranch, setCurrentBranch] = useState<BranchScheduleData>({
    id: branch.id,
    name: branch.name,
    work_start_time: branch.work_start_time || "08:00",
    work_end_time: branch.work_end_time || "17:00",
    break_start_time: branch.break_start_time || "12:00",
    break_end_time: branch.break_end_time || "13:00",
    is_four_punch_enabled: branch.is_four_punch_enabled ?? true,
    late_grace_minutes: branch.late_grace_minutes ?? 15,
    early_leave_grace_minutes: branch.early_leave_grace_minutes ?? 15,
    morning_check_in_start: branch.morning_check_in_start || "06:00",
    morning_check_in_end: branch.morning_check_in_end || "10:00",
    morning_check_out_start: branch.morning_check_out_start || "11:30",
    morning_check_out_end: branch.morning_check_out_end || "13:30",
    afternoon_check_in_start: branch.afternoon_check_in_start || "12:30",
    afternoon_check_in_end: branch.afternoon_check_in_end || "14:30",
    afternoon_check_out_start: branch.afternoon_check_out_start || "16:00",
    afternoon_check_out_end: branch.afternoon_check_out_end || "22:00",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState<WorkingHoursFormState>({
    work_start_time: currentBranch.work_start_time?.slice(0, 5) || "08:00",
    work_end_time: currentBranch.work_end_time?.slice(0, 5) || "17:00",
    break_start_time: currentBranch.break_start_time?.slice(0, 5) || "12:00",
    break_end_time: currentBranch.break_end_time?.slice(0, 5) || "13:00",
    is_four_punch_enabled: currentBranch.is_four_punch_enabled ?? true,
    late_grace_minutes: currentBranch.late_grace_minutes ?? 15,
    early_leave_grace_minutes: currentBranch.early_leave_grace_minutes ?? 15,
    morning_check_in_start: currentBranch.morning_check_in_start?.slice(0, 5) || "06:00",
    morning_check_in_end: currentBranch.morning_check_in_end?.slice(0, 5) || "10:00",
    morning_check_out_start: currentBranch.morning_check_out_start?.slice(0, 5) || "11:30",
    morning_check_out_end: currentBranch.morning_check_out_end?.slice(0, 5) || "13:30",
    afternoon_check_in_start: currentBranch.afternoon_check_in_start?.slice(0, 5) || "12:30",
    afternoon_check_in_end: currentBranch.afternoon_check_in_end?.slice(0, 5) || "14:30",
    afternoon_check_out_start: currentBranch.afternoon_check_out_start?.slice(0, 5) || "16:00",
    afternoon_check_out_end: currentBranch.afternoon_check_out_end?.slice(0, 5) || "22:00",
  });

  // Re-sync whenever selected branch in Organization changes
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("branches")
        .select("id, name, work_start_time, work_end_time, break_start_time, break_end_time, is_four_punch_enabled, late_grace_minutes, early_leave_grace_minutes, morning_check_in_start, morning_check_in_end, morning_check_out_start, morning_check_out_end, afternoon_check_in_start, afternoon_check_in_end, afternoon_check_out_start, afternoon_check_out_end")
        .eq("id", branch.id)
        .maybeSingle();

      if (data) {
        setCurrentBranch(data);
        setFormState({
          work_start_time: data.work_start_time?.slice(0, 5) || "08:00",
          work_end_time: data.work_end_time?.slice(0, 5) || "17:00",
          break_start_time: data.break_start_time?.slice(0, 5) || "12:00",
          break_end_time: data.break_end_time?.slice(0, 5) || "13:00",
          is_four_punch_enabled: data.is_four_punch_enabled ?? true,
          late_grace_minutes: data.late_grace_minutes ?? 15,
          early_leave_grace_minutes: data.early_leave_grace_minutes ?? 15,
          morning_check_in_start: data.morning_check_in_start?.slice(0, 5) || "06:00",
          morning_check_in_end: data.morning_check_in_end?.slice(0, 5) || "10:00",
          morning_check_out_start: data.morning_check_out_start?.slice(0, 5) || "11:30",
          morning_check_out_end: data.morning_check_out_end?.slice(0, 5) || "13:30",
          afternoon_check_in_start: data.afternoon_check_in_start?.slice(0, 5) || "12:30",
          afternoon_check_in_end: data.afternoon_check_in_end?.slice(0, 5) || "14:30",
          afternoon_check_out_start: data.afternoon_check_out_start?.slice(0, 5) || "16:00",
          afternoon_check_out_end: data.afternoon_check_out_end?.slice(0, 5) || "22:00",
        });
      }
    })();
  }, [branch.id]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
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

      const { error } = await supabase.from("branches").update(payload).eq("id", currentBranch.id);
      if (error) throw new Error(error.message);

      // Sync to all sites of this BU
      await supabase.from("work_locations").update(payload).eq("branch_id", currentBranch.id);

      // Sync system settings
      await supabase.from("system_settings").upsert(
        { key: `bu_four_punch_${currentBranch.id}`, value: String(formState.is_four_punch_enabled), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

      setCurrentBranch((prev) => ({ ...prev, ...payload }));
      toast(`Working hours & policy updated for ${currentBranch.name}`, "success");
      setIsEditModalOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update working hours", "error");
    } finally {
      setSaving(false);
    }
  };

  const isFourPunchCurrent = Boolean(currentBranch.is_four_punch_enabled ?? true);

  return (
    <div className="space-y-4">
      {/* Top BU Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Standard Working Hours — {currentBranch.name}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                isFourPunchCurrent
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-[#253C7D]/10 dark:bg-sky-950/50 text-[#253C7D] dark:text-sky-300 border-[#253C7D]/20 dark:border-sky-800/60"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isFourPunchCurrent ? "bg-emerald-500" : "bg-[#253C7D] dark:bg-sky-400"}`} />
              {isFourPunchCurrent ? "4 Punches / Day (Multi-Session)" : "2 Punches / Day (Standard)"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Operating schedule, lunch break, grace rules, &amp; punch window limits for this Business Unit
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <i className="ri-edit-line text-xs" />
            <span>Edit Policy</span>
          </button>
        )}
      </div>

      <WorkingHoursKpiCards branch={currentBranch} />
      <WorkingHoursSessionWindows branch={currentBranch} />

      <AdjustWorkingHoursModal
        isOpen={isEditModalOpen}
        branch={currentBranch}
        formState={formState}
        setFormState={setFormState}
        saving={saving}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveSchedule}
      />
    </div>
  );
}
