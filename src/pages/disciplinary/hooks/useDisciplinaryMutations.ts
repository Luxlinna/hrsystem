import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { uploadFileToS3 } from "@/lib/s3-storage";
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
      const effectiveWarningType = record.warning_type || record.type || "first_written_warning";
      const effectiveWarningDate = record.warning_date || record.incident_date || new Date().toISOString().slice(0, 10);
      const effectiveTitle =
        record.title?.trim() ||
        `${effectiveWarningType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} - ${effectiveWarningDate}`;

      if (!record.employee_id) {
        toast("Validation Error", "Please select an employee.", "error");
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

        let uploadedDocUrl = record.document_url || null;
        let uploadedDocName = record.document_name || null;

        if (record.document_file) {
          try {
            const s3Item = await uploadFileToS3(record.document_file, "disciplinary/warnings");
            uploadedDocUrl = s3Item.url;
            uploadedDocName = s3Item.name;
          } catch (uploadErr) {
            console.error("Warning attachment upload to AWS S3 failed:", uploadErr);
            toast("Attachment Error", "Failed to upload document file to AWS S3.", "error");
          }
        }

        const effectiveAction = record.action_to_take || record.action_taken || null;
        const effectiveRemark = record.remark || record.notes || null;
        const isEdit = Boolean(record.id);

        const payload: Record<string, any> = {
          employee_id: record.employee_id,
          type: effectiveWarningType,
          severity: record.severity || "medium",
          title: effectiveTitle,
          description: record.description || null,
          action_taken: effectiveAction,
          incident_date: effectiveWarningDate,
          follow_up_date: record.follow_up_date || null,
          branch_id: resolvedBranchId,
          warning_type: effectiveWarningType,
          warning_date: effectiveWarningDate,
          action_to_take: effectiveAction,
          employee_promise: record.employee_promise || null,
          remark: effectiveRemark,
          document_url: uploadedDocUrl,
          document_name: uploadedDocName,
        };

        if (!isEdit) {
          payload.status = "open";
          payload.created_by = actorName;
        }

        const query = isEdit
          ? supabase.from("disciplinary_records").update(payload).eq("id", record.id)
          : supabase.from("disciplinary_records").insert(payload);

        const { error } = await query;
        if (error) throw error;

        toast(isEdit ? "Record Updated" : "Record Created", `Disciplinary record for ${emp?.first_name || "Employee"} saved.`, "success");
        await logActivity({
          module: "disciplinary",
          action: isEdit ? "updated" : "created",
          entityType: "disciplinary_record",
          actorName,
          actorRole: roleName,
          description: `${isEdit ? "Updated" : "Created"} warning: "${effectiveTitle}"`,
        });

        setShowModal(false);
        await fetchData();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save record", "error");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [actorName, roleName, isSuperAdmin, targetBranch, employees, fetchData, setShowModal]
  );

  const handleVoidRecord = useCallback(
    async (record: DisciplinaryRecord) => {
      if (!confirm(`Are you sure you want to void this employee warning?`)) return;
      try {
        const { error } = await supabase.from("disciplinary_records").update({ status: "voided" }).eq("id", record.id);
        if (error) {
          await supabase.from("disciplinary_records").update({ status: "closed", remark: `${record.remark || ""} [VOIDED]`.trim() }).eq("id", record.id);
        }
        toast("Warning Voided", "Employee warning has been voided.", "success");
        await logActivity({
          module: "disciplinary",
          action: "updated",
          entityType: "disciplinary_record",
          entityId: record.id,
          actorName,
          actorRole: roleName,
          description: `Voided employee warning: "${record.title || record.warning_type}"`,
        });
        await fetchData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to void warning", "error");
      }
    },
    [actorName, roleName, fetchData]
  );

  const handleDeleteRecord = useCallback(
    async (record: DisciplinaryRecord) => {
      if (!confirm(`Are you sure you want to delete this employee warning?`)) return;
      try {
        const { error } = await supabase
          .from("disciplinary_records")
          .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
          .eq("id", record.id);
        if (error) throw error;
        toast("Record Deleted", `Warning "${record.title || record.warning_type}" deleted.`, "success");
        await logActivity({
          module: "disciplinary",
          action: "deleted",
          entityType: "disciplinary_record",
          entityId: record.id,
          actorName,
          actorRole: roleName,
          description: `Deleted employee warning: "${record.title || record.warning_type}"`,
        });
        setSelectedRecord(null);
        await fetchData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete record", "error");
      }
    },
    [actorName, roleName, setSelectedRecord, fetchData]
  );

  return {
    saving,
    handleCreateRecord,
    handleVoidRecord,
    handleDeleteRecord,
  };
}
