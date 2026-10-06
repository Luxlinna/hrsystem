import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { AttendanceRecord, Employee, NewRecordForm } from "../types";
import { attendanceCache } from "../services/attendanceCacheService";

interface UseAttendanceMutationsProps {
  employees: Employee[];
  records?: AttendanceRecord[];
  todayYMD?: string;
  fetchData: () => Promise<void>;
  setSelectedRecord: React.Dispatch<React.SetStateAction<AttendanceRecord | null>>;
  setEditingRecord: React.Dispatch<React.SetStateAction<AttendanceRecord | null>>;
  selectedRecord: AttendanceRecord | null;
}

export function useAttendanceMutations({
  employees,
  records,
  todayYMD,
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
      break_out: newRecord.break_out || null,
      break_in: newRecord.break_in || null,
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
    attendanceCache.invalidateAttendance(targetBranch);
    fetchData();
    return true;
  }, [employees, saving, actorName, role?.name, targetBranch, fetchData]);

  const handleUpdateRecord = useCallback(async (editingRecord: AttendanceRecord) => {
    if (!editingRecord || saving) return false;
    setSaving(true);

    const selectedEmp = employees.find((e) => e.id === editingRecord.employee_id);
    const workLocationId = editingRecord.work_location_id || selectedEmp?.default_work_location_id || null;

    if (!editingRecord.id || editingRecord.id < 0) {
      // It is a virtual placeholder record with no entry in the database yet: create a new attendance record
      const { data, error } = await supabase
        .from("attendance_records")
        .insert({
          employee_id: editingRecord.employee_id,
          date: editingRecord.date,
          clock_in: editingRecord.clock_in || null,
          clock_out: editingRecord.clock_out || null,
          break_out: editingRecord.break_out || null,
          break_in: editingRecord.break_in || null,
          status: editingRecord.status,
          late_minutes: editingRecord.status === "late" ? (editingRecord.late_minutes || 0) : 0,
          notes: editingRecord.notes ? editingRecord.notes.trim() : null,
          work_location_id: workLocationId,
        })
        .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name), default_work_location_id, biometric_user_id, employee_code, basic_salary, contract_rate, contract_rate_currency, contract_rate_frequency, tax_method, contract_type, employment_type, site), work_location:work_locations(id, name)")
        .single();

      setSaving(false);
      if (error) {
        toast("Error", `Failed to save attendance: ${error.message}`, "error");
        return false;
      }

      toast("Attendance Recorded", `Record created for ${editingRecord.date}.`, "success");
      logActivity({
        module: "attendance",
        action: "created",
        entityType: "attendance_record",
        entityId: String(data?.id || "new"),
        actorName,
        actorRole: role?.name || "Staff",
        description: `Logged attendance record for employee on ${editingRecord.date}`,
        branchId: targetBranch,
      });
      setEditingRecord(null);
      if (selectedRecord && selectedRecord.id === editingRecord.id) {
        setSelectedRecord(data as unknown as AttendanceRecord);
      }
      attendanceCache.invalidateAttendance(targetBranch);
      fetchData();
      return true;
    }

    const { error } = await supabase
      .from("attendance_records")
      .update({
        clock_in: editingRecord.clock_in || null,
        clock_out: editingRecord.clock_out || null,
        break_out: editingRecord.break_out || null,
        break_in: editingRecord.break_in || null,
        status: editingRecord.status,
        late_minutes: editingRecord.status === "late" ? editingRecord.late_minutes : 0,
        notes: editingRecord.notes ? editingRecord.notes.trim() : null,
        work_location_id: workLocationId,
      })
      .eq("id", editingRecord.id);

    setSaving(false);
    if (error) {
      toast("Error", `Failed to update record: ${error.message}`, "error");
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
    attendanceCache.invalidateAttendance(targetBranch);
    fetchData();
    return true;
  }, [saving, employees, selectedRecord, actorName, role?.name, targetBranch, setEditingRecord, setSelectedRecord, fetchData]);

  const handleDeleteRecord = useCallback(async (id: number) => {
    if (!id || id < 0) {
      toast("Info", "This is an unsaved placeholder entry with no recorded attendance in the database to delete.", "info");
      return;
    }

    const rec = records?.find((r) => r.id === id) || (selectedRecord?.id === id ? selectedRecord : null);
    if (rec?.date) {
      const recDate = new Date(`${rec.date}T00:00:00`);
      const now = new Date();
      const diffMs = now.getTime() - recDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Check if older than 24 hours
      if (todayYMD && rec.date < todayYMD && diffHours > 24) {
        toast("Record Locked", "Attendance records older than 24 hours cannot be deleted or reset for re-checking in.", "error");
        return;
      }
    }

    if (!confirm("Delete this attendance record? The employee will be able to check in and out again for this working day.")) return;

    const { error } = await supabase
      .from("attendance_records")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: actorName,
        clock_in: null,
        clock_out: null,
        break_in: null,
        break_out: null,
        status: "absent",
      })
      .eq("id", id);

    if (error) {
      toast("Error", `Failed to delete record: ${error.message}`, "error");
      return;
    }
    toast("Record Deleted", "Attendance entry moved to Recycle Bin. The employee can now check in/out again today.", "success");
    logActivity({
      module: "attendance",
      action: "deleted",
      entityType: "attendance_record",
      entityId: String(id),
      actorName,
      actorRole: role?.name || "Staff",
      description: `Deleted attendance record #${id} on ${rec?.date || "today"} to allow employee re-check in/out`,
      branchId: targetBranch,
    });
    setSelectedRecord(null);
    setEditingRecord(null);
    attendanceCache.invalidateAttendance(targetBranch);
    fetchData();
  }, [actorName, role?.name, targetBranch, setSelectedRecord, setEditingRecord, fetchData, records, selectedRecord, todayYMD]);

  return {
    saving,
    handleSaveNewRecord,
    handleUpdateRecord,
    handleDeleteRecord,
  };
}
