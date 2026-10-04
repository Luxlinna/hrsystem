import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { BranchScheduleData, WorkingHoursFormState } from "./working-hours/types";
import { WorkingHoursKpiCards } from "./working-hours/WorkingHoursKpiCards";
import { WorkingHoursSessionWindows } from "./working-hours/WorkingHoursSessionWindows";
import { AdjustWorkingHoursModal } from "./working-hours/AdjustWorkingHoursModal";

export function StandardWorkingHoursTabView({ canManage = true }: { canManage?: boolean }) {
  const [branches, setBranches] = useState<BranchScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState<WorkingHoursFormState>({
    work_start_time: "08:00",
    work_end_time: "17:00",
    late_grace_minutes: 15,
    early_leave_grace_minutes: 15,
    morning_check_in_start: "06:00",
    morning_check_in_end: "10:00",
    morning_check_out_start: "11:30",
    morning_check_out_end: "13:30",
    afternoon_check_in_start: "12:30",
    afternoon_check_in_end: "14:30",
    afternoon_check_out_start: "16:00",
    afternoon_check_out_end: "22:00",
  });

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, location, work_start_time, work_end_time, late_grace_minutes, early_leave_grace_minutes, morning_check_in_start, morning_check_in_end, morning_check_out_start, morning_check_out_end, afternoon_check_in_start, afternoon_check_in_end, afternoon_check_out_start, afternoon_check_out_end")
        .is("deleted_at", null)
        .order("name");

      if (!error && data) {
        setBranches(data);
        if (!selectedBranchId && data.length > 0) setSelectedBranchId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching branch schedules:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const handleOpenEdit = (branch: BranchScheduleData) => {
    setFormState({
      work_start_time: branch.work_start_time ? branch.work_start_time.slice(0, 5) : "08:00",
      work_end_time: branch.work_end_time ? branch.work_end_time.slice(0, 5) : "17:00",
      late_grace_minutes: branch.late_grace_minutes ?? 15,
      early_leave_grace_minutes: branch.early_leave_grace_minutes ?? 15,
      morning_check_in_start: branch.morning_check_in_start ? branch.morning_check_in_start.slice(0, 5) : "06:00",
      morning_check_in_end: branch.morning_check_in_end ? branch.morning_check_in_end.slice(0, 5) : "10:00",
      morning_check_out_start: branch.morning_check_out_start ? branch.morning_check_out_start.slice(0, 5) : "11:30",
      morning_check_out_end: branch.morning_check_out_end ? branch.morning_check_out_end.slice(0, 5) : "13:30",
      afternoon_check_in_start: branch.afternoon_check_in_start ? branch.afternoon_check_in_start.slice(0, 5) : "12:30",
      afternoon_check_in_end: branch.afternoon_check_in_end ? branch.afternoon_check_in_end.slice(0, 5) : "14:30",
      afternoon_check_out_start: branch.afternoon_check_out_start ? branch.afternoon_check_out_start.slice(0, 5) : "16:00",
      afternoon_check_out_end: branch.afternoon_check_out_end ? branch.afternoon_check_out_end.slice(0, 5) : "22:00",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;
    setSaving(true);
    try {
      const payload = {
        work_start_time: formState.work_start_time,
        work_end_time: formState.work_end_time,
        late_grace_minutes: parseInt(String(formState.late_grace_minutes), 10) || 0,
        early_leave_grace_minutes: parseInt(String(formState.early_leave_grace_minutes), 10) || 0,
        morning_check_in_start: formState.morning_check_in_start,
        morning_check_in_end: formState.morning_check_in_end,
        afternoon_check_out_start: formState.afternoon_check_out_start,
        afternoon_check_out_end: formState.afternoon_check_out_end,
      };
      const { error } = await supabase.from("branches").update(payload).eq("id", currentBranch.id);
      if (error) throw new Error(error.message);

      setBranches((prev) => prev.map((b) => (b.id === currentBranch.id ? { ...b, ...payload } : b)));
      toast(`Working hours & windows updated for ${currentBranch.name}`, "success");
      setIsEditModalOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update working hours", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading && branches.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="inline-flex items-center gap-2 text-slate-500 text-xs">
          <div className="w-3.5 h-3.5 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
          <span>Loading schedules...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sleek Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Standard Working Hours
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Operating schedule, grace rules, &amp; punch window limits
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {branches.length > 1 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {canManage && currentBranch && (
            <button
              type="button"
              onClick={() => handleOpenEdit(currentBranch)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <i className="ri-edit-line text-xs" />
              <span>Edit Policy</span>
            </button>
          )}
        </div>
      </div>

      {currentBranch && (
        <>
          <WorkingHoursKpiCards branch={currentBranch} />
          <WorkingHoursSessionWindows branch={currentBranch} />
        </>
      )}

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
