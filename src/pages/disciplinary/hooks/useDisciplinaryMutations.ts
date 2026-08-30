import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { DisciplinaryRecord, NewRecord, Employee } from "../types";

interface UseDisciplinaryMutationsProps {
  actorName: string;
  roleName: string;
  isSuperAdmin: boolean;
  targetBranch: string | null;
  employees: Employee[];
  fetchData: () => Promise<void>;
  setSelectedRecord: React.Dispatch<React.SetStateAction<DisciplinaryRecord | null>>;
  selectedRecord: DisciplinaryRecord | null;
  setShowModal: (open: boolean) => void;
}

export function useDisciplinaryMutations({
  actorName,
  roleName,
  isSuperAdmin,
  targetBranch,
  employees,
  fetchData,
  setSelectedRecord,
  selectedRecord,
  setShowModal,
}: UseDisciplinaryMutationsProps) {
  const [saving, setSaving] = useState(false);

  const handleCreateRecord = useCallback(
    async (record: NewRecord) => {
      if (!record.employee_id || !record.title) {
        toast("Validation Error", "Please select an employee and provide a case title.", "error");
        return false;
      }

      setSaving(true);
      try {
        const emp = employees.find((e) => e.id === record.employee_id);
        const resolvedBranchId = isSuperAdmin
          ? record.is_admin_scope
            ? null
            : record.branch_id || emp?.branch_id || targetBranch
          : targetBranch || emp?.branch_id || null;

        const payload = {
          employee_id: record.employee_id,
          type: record.type,
          severity: record.severity,
          status: "open",
          title: record.title,
          description: record.description || null,
          action_taken: record.action_taken || null,
          incident_date: record.incident_date,
          follow_up_date: record.follow_up_date || null,
          notes: record.notes || null,
          created_by: actorName,
          branch_id: resolvedBranchId,
          is_admin_scope: isSuperAdmin ? record.is_admin_scope : false,
        };

        const { error } = await supabase.from("disciplinary_records").insert(payload);
        if (error) throw error;

        toast("Record Created", `Disciplinary record for ${emp?.first_name || "Employee"} logged.`, "success");
        await logActivity({
          module: "disciplinary",
          action: "created",
          entityType: "disciplinary_record",
          actorName,
          actorRole: roleName,
          description: `Created ${record.severity} severity ${record.type} record: "${record.title}"`,
        });

        setShowModal(false);
        await fetchData();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to create disciplinary record", "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [actorName, roleName, isSuperAdmin, targetBranch, employees, fetchData, setShowModal]
  );

  const handleUpdateStatus = useCallback(
    async (id: string, newStatus: string) => {
      try {
        const updates: any = { status: newStatus };
        if (newStatus === "resolved" || newStatus === "closed") {
          updates.resolved_at = new Date().toISOString();
        }

        const { error } = await supabase.from("disciplinary_records").update(updates).eq("id", id);
        if (error) throw error;

        toast("Status Updated", `Record marked as ${newStatus.replace("_", " ")}.`, "success");
        await logActivity({
          module: "disciplinary",
          action: "updated",
          entityType: "disciplinary_record",
          entityId: id,
          actorName,
          actorRole: roleName,
          description: `Updated record status to ${newStatus}`,
        });

        if (selectedRecord && selectedRecord.id === id) {
          setSelectedRecord((prev) => (prev ? { ...prev, ...updates } : null));
        }
        await fetchData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to update record status", "error");
      }
    },
    [actorName, roleName, selectedRecord, setSelectedRecord, fetchData]
  );

  const handleDeleteRecord = useCallback(
    async (record: DisciplinaryRecord) => {
      if (!confirm(`Are you sure you want to move record "${record.title}" to Recycle Bin?`)) return;
      try {
        const { error } = await supabase
          .from("disciplinary_records")
          .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
          .eq("id", record.id);

        if (error) throw error;

        toast("Moved to Recycle Bin", `Record "${record.title}" moved to Recycle Bin.`, "success");
        await logActivity({
          module: "disciplinary",
          action: "deleted",
          entityType: "disciplinary_record",
          entityId: record.id,
          actorName,
          actorRole: roleName,
          description: `Moved disciplinary record "${record.title}" to Recycle Bin`,
        });

        setSelectedRecord(null);
        await fetchData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete record", "error");
      }
    },
    [actorName, roleName, setSelectedRecord, fetchData]
  );

  const handleSaveNotes = useCallback(
    async (recordId: string, notes: string) => {
      try {
        const { error } = await supabase.from("disciplinary_records").update({ notes }).eq("id", recordId);
        if (error) throw error;
        toast("Notes Saved", "Follow-up notes updated.", "success");
        if (selectedRecord?.id === recordId) {
          setSelectedRecord((prev) => (prev ? { ...prev, notes } : null));
        }
        await fetchData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to save notes", "error");
      }
    },
    [selectedRecord, setSelectedRecord, fetchData]
  );

  return {
    saving,
    handleCreateRecord,
    handleUpdateStatus,
    handleDeleteRecord,
    handleSaveNotes,
  };
}
