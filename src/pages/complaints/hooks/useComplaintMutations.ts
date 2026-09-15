import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { uploadFileToS3 } from "@/lib/s3-storage";
import type { ComplaintFormState, ComplaintStatus } from "../types";

interface UseComplaintMutationsProps {
  loadData: () => Promise<void>;
  actorName: string;
  actorRole: string;
}

export function useComplaintMutations({
  loadData,
  actorName,
  actorRole,
}: UseComplaintMutationsProps) {
  const [saving, setSaving] = useState(false);

  // ── 1. Create Complaint / Suggestion ─────────────────────────────────────
  const createComplaint = useCallback(
    async (form: ComplaintFormState, branchId: string): Promise<boolean> => {
      if (!form.target_to.trim() || !form.subject.trim() || !form.details.trim()) {
        toast("Validation Error", "Target recipient, subject, and details are required.", "error");
        return false;
      }
      if (!branchId) {
        toast("Error", "No Business Unit assigned.", "error");
        return false;
      }

      setSaving(true);
      const payload = {
        branch_id:       branchId,
        employee_id:     form.employee_id || null,
        type:            form.type,
        entry_date:      form.entry_date,
        target_to:       form.target_to.trim(),
        subject:         form.subject.trim(),
        details:         form.details.trim(),
        suggestion:      form.suggestion.trim() || null,
        remark:          form.remark.trim() || null,
        status:          form.status,
        attachment_url:  form.attachment_url.trim() || null,
        attachment_name: form.attachment_name.trim() || null,
        recorded_by:     actorName,
      };

      const { error } = await supabase.from("complaints_suggestions").insert(payload);
      if (error) {
        toast("Error", error.message || "Failed to record entry.", "error");
        setSaving(false);
        return false;
      }

      toast("Recorded", "Record has been created successfully.", "success");
      logActivity({
        module: "complaints",
        action: "created",
        entityType: "complaint_suggestion",
        actorName,
        actorRole,
        description: `Logged ${form.type}: "${form.subject}" to ${form.target_to}`,
      });

      await loadData();
      setSaving(false);
      return true;
    },
    [actorName, actorRole, loadData]
  );

  // ── 2. Update Complaint / Suggestion ─────────────────────────────────────
  const updateComplaint = useCallback(
    async (id: string, form: ComplaintFormState): Promise<boolean> => {
      if (!form.target_to.trim() || !form.subject.trim() || !form.details.trim()) {
        toast("Validation Error", "Target recipient, subject, and details are required.", "error");
        return false;
      }

      setSaving(true);
      const payload = {
        employee_id:     form.employee_id || null,
        type:            form.type,
        entry_date:      form.entry_date,
        target_to:       form.target_to.trim(),
        subject:         form.subject.trim(),
        details:         form.details.trim(),
        suggestion:      form.suggestion.trim() || null,
        remark:          form.remark.trim() || null,
        status:          form.status,
        attachment_url:  form.attachment_url.trim() || null,
        attachment_name: form.attachment_name.trim() || null,
        updated_at:      new Date().toISOString(),
      };

      const { error } = await supabase.from("complaints_suggestions").update(payload).eq("id", id);
      if (error) {
        toast("Error", error.message || "Failed to update record.", "error");
        setSaving(false);
        return false;
      }

      toast("Updated", "Record updated successfully.", "success");
      logActivity({
        module: "complaints",
        action: "updated",
        entityType: "complaint_suggestion",
        entityId: id,
        actorName,
        actorRole,
        description: `Updated ${form.type} "${form.subject}"`,
      });

      await loadData();
      setSaving(false);
      return true;
    },
    [actorName, actorRole, loadData]
  );

  // ── 3. Quick Status / Remark Update ─────────────────────────────────────
  const updateStatus = useCallback(
    async (id: string, status: ComplaintStatus, remark?: string): Promise<boolean> => {
      const payload: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (remark !== undefined) {
        payload.remark = remark.trim() || null;
      }

      const { error } = await supabase.from("complaints_suggestions").update(payload).eq("id", id);
      if (error) {
        toast("Error", error.message || "Failed to update status.", "error");
        return false;
      }

      toast("Status Updated", `Record marked as ${status}.`, "success");
      logActivity({
        module: "complaints",
        action: "updated",
        entityType: "complaint_suggestion",
        entityId: id,
        actorName,
        actorRole,
        description: `Updated complaint status to ${status}`,
      });

      await loadData();
      return true;
    },
    [actorName, actorRole, loadData]
  );

  // ── 4. Delete ────────────────────────────────────────────────────────────
  const deleteComplaint = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("complaints_suggestions").delete().eq("id", id);
      if (error) {
        toast("Error", error.message || "Failed to delete record.", "error");
        return false;
      }

      toast("Deleted", "Record removed.", "success");
      logActivity({
        module: "complaints",
        action: "deleted",
        entityType: "complaint_suggestion",
        entityId: id,
        actorName,
        actorRole,
        description: `Deleted complaint record ${id}`,
      });

      await loadData();
      return true;
    },
    [actorName, actorRole, loadData]
  );

  // ── 5. File Upload (AWS S3) ──────────────────────────────────────────────
  const uploadDocument = useCallback(
    async (file: File): Promise<{ url: string; name: string } | null> => {
      try {
        const res = await uploadFileToS3(file, "complaints");
        return { url: res.url, name: file.name };
      } catch (s3Err: any) {
        console.warn("AWS S3 upload attempt error:", s3Err);
        toast("Upload Failed", s3Err?.message || "Failed to upload file to AWS S3.", "error");
        return null;
      }
    },
    []
  );

  return {
    saving,
    createComplaint,
    updateComplaint,
    updateStatus,
    deleteComplaint,
    uploadDocument,
  };
}
