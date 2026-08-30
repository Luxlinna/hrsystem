import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { AttendanceRecord, Employee, NewRecordForm } from "../types";

interface UseAttendanceMutationsProps {
  employees: Employee[];
  fetchData: () => Promise<void>;
  setSelectedRecord: React.Dispatch<React.SetStateAction<AttendanceRecord | null>>;
  setEditingRecord: React.Dispatch<React.SetStateAction<AttendanceRecord | null>>;
  selectedRecord: AttendanceRecord | null;
}

export function useAttendanceMutations({
  employees,
  fetchData,
  setSelectedRecord,
  setEditingRecord,
  selectedRecord,
}: UseAttendanceMutationsProps) {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role } = usePermissions();
  const { targetBranch } = useBranchScope();

  const [saving, setSaving] = useState(false);

  const handleSaveNewRecord = useCallback(async (newRecord: NewRecordForm) => {
    if (!newRecord.employee_id || !newRecord.date || saving) return false;
    setSaving(true);

    const selectedEmp = employees.find((e) => e.id === newRecord.employee_id);
    const workLocationId = newRecord.work_location_id || selectedEmp?.default_work_location_id || null;

    const { error } = await supabase.from("attendance_records").insert({
      employee_id: newRecord.employee_id,
      date: newRecord.date,
      clock_in: newRecord.clock_in || null,
      clock_out: newRecord.clock_out || null,
      status: newRecord.status,
      late_minutes: newRecord.status === "late" ? newRecord.late_minutes : 0,
      notes: newRecord.notes ? newRecord.notes.trim() : null,
      work_location_id: workLocationId,
    });

    setSaving(false);
    if (error) {
      const msg = error.code === "23505"
        ? `This employee already has an attendance record for ${newRecord.date}. Edit the existing record instead.`
        : "Failed to record attendance";
      toast("Error", msg, "error");
      return false;
    }

    toast("Attendance Logged", `Record added for ${newRecord.date}.`, "success");
    logActivity({
      module: "attendance",
      action: "created",
      entityType: "attendance_record",
      actorName,
      actorRole: role?.name || "Staff",
      description: `Logged attendance for employee on ${newRecord.date} (${newRecord.status})`,
      branchId: targetBranch,
    });
    fetchData();
    return true;
  }, [employees, saving, actorName, role?.name, targetBranch, fetchData]);

  const handleUpdateRecord = useCallback(async (editingRecord: AttendanceRecord) => {
    if (!editingRecord || saving) return false;
    setSaving(true);

    const { error } = await supabase
      .from("attendance_records")
      .update({
        clock_in: editingRecord.clock_in || null,
        clock_out: editingRecord.clock_out || null,
        status: editingRecord.status,
        late_minutes: editingRecord.status === "late" ? editingRecord.late_minutes : 0,
        notes: editingRecord.notes ? editingRecord.notes.trim() : null,
        work_location_id: editingRecord.work_location_id || null,
      })
      .eq("id", editingRecord.id);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to update record", "error");
      return false;
    }

    toast("Attendance Updated", "Changes saved successfully.", "success");
    logActivity({
      module: "attendance",
      action: "updated",
      entityType: "attendance_record",
      entityId: String(editingRecord.id),
      actorName,
      actorRole: role?.name || "Staff",
      description: `Updated attendance record for employee on ${editingRecord.date}`,
      branchId: targetBranch,
    });
    setEditingRecord(null);
    if (selectedRecord && selectedRecord.id === editingRecord.id) {
      setSelectedRecord(editingRecord);
    }
    fetchData();
    return true;
  }, [saving, selectedRecord, actorName, role?.name, targetBranch, setEditingRecord, setSelectedRecord, fetchData]);

  const handleDeleteRecord = useCallback(async (id: number) => {
    if (!confirm("Move this attendance record to the Recycle Bin? It can be restored later.")) return;
    const { error } = await supabase
      .from("attendance_records")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) {
      toast("Error", "Failed to move record to the Recycle Bin", "error");
      return;
    }
    toast("Record Moved", "Attendance entry moved to the Recycle Bin.", "success");
    logActivity({
      module: "attendance",
      action: "deleted",
      entityType: "attendance_record",
      entityId: String(id),
      actorName,
      actorRole: role?.name || "Staff",
      description: `Moved attendance record #${id} to Recycle Bin`,
      branchId: targetBranch,
    });
    setSelectedRecord(null);
    setEditingRecord(null);
    fetchData();
  }, [actorName, role?.name, targetBranch, setSelectedRecord, setEditingRecord, fetchData]);

  return {
    saving,
    handleSaveNewRecord,
    handleUpdateRecord,
    handleDeleteRecord,
  };
}
