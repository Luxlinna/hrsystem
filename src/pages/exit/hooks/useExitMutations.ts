import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { uploadFileToS3 } from "@/lib/s3-storage";
import type { ExitFormState } from "../types";

interface UseExitMutationsProps {
  loadData: () => Promise<void>;
  actorName: string;
  actorRole: string;
}

export function useExitMutations({ loadData, actorName, actorRole }: UseExitMutationsProps) {
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Create ──────────────────────────────────────────────────────────────
  const createExit = useCallback(async (form: ExitFormState): Promise<boolean> => {
    if (!form.employee_id || !form.last_working_day) {
      toast("Validation Error", "Employee and Last Working Day are required.", "error");
      return false;
    }
    setSaving(true);

    const payload = {
      employee_id:        form.employee_id,
      exit_type:          form.exit_type,
      last_working_day:   form.last_working_day,
      reason_type:        form.reason_type,
      reason_description: form.reason_description.trim() || null,
      document_url:       form.document_url.trim() || null,
      document_name:      form.document_name.trim() || null,
      recorded_by:        actorName,
      status:             "active",
    };

    const { error } = await supabase.from("employee_exits").insert(payload);
    if (error) {
      toast("Error", error.message || "Failed to record exit.", "error");
      setSaving(false);
      return false;
    }

    // Auto-set employee status to inactive
    await supabase.from("employees").update({ status: "inactive" }).eq("id", form.employee_id);

    toast("Exit Recorded", "Employee exit has been recorded successfully.", "success");
    logActivity({
      module: "exit",
      action: "created",
      entityType: "employee_exit",
      actorName,
      actorRole,
      description: `Recorded exit for employee ${form.employee_id} (${form.exit_type})`,
    });

    await loadData();
    setSaving(false);
    return true;
  }, [actorName, actorRole, loadData]);

  // ── Update ──────────────────────────────────────────────────────────────
  const updateExit = useCallback(async (id: string, form: ExitFormState): Promise<boolean> => {
    setSaving(true);
    const { error } = await supabase.from("employee_exits").update({
      exit_type:          form.exit_type,
      last_working_day:   form.last_working_day,
      reason_type:        form.reason_type,
      reason_description: form.reason_description.trim() || null,
      document_url:       form.document_url.trim() || null,
      document_name:      form.document_name.trim() || null,
    }).eq("id", id);

    if (error) {
      toast("Error", error.message || "Failed to update exit record.", "error");
      setSaving(false);
      return false;
    }
    toast("Updated", "Exit record updated.", "success");
    logActivity({
      module: "exit",
      action: "updated",
      entityType: "employee_exit",
      entityId: id,
      actorName,
      actorRole,
      description: `Updated exit record ${id}`,
    });
    await loadData();
    setSaving(false);
    return true;
  }, [actorName, actorRole, loadData]);

  // ── Delete ──────────────────────────────────────────────────────────────
  const deleteExit = useCallback(async (id: string): Promise<void> => {
    if (!confirm("Delete this exit record?")) return;
    const { error } = await supabase.from("employee_exits").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    toast("Deleted", "Exit record removed.", "success");
    logActivity({
      module: "exit",
      action: "deleted",
      entityType: "employee_exit",
      entityId: id,
      actorName,
      actorRole,
      description: `Cancelled exit record ${id}`,
    });
    await loadData();
  }, [actorName, actorRole, loadData]);

  // ── File upload (AWS S3 with Supabase Storage fallback) ───────────────
  const uploadDocument = useCallback(async (file: File): Promise<{ url: string; name: string } | null> => {
    try {
      // Attempt AWS S3 upload first (standard in this system)
      const res = await uploadFileToS3(file, "employees/exits");
      return { url: res.url, name: file.name };
    } catch (s3Err: any) {
      console.warn("AWS S3 upload attempt error, trying Supabase Storage fallback:", s3Err);
      // Fallback to Supabase Storage if S3 is not available
      try {
        const ext = file.name.split(".").pop();
        const path = `exits/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("exit-documents").upload(path, file);
        if (!error) {
          const { data } = supabase.storage.from("exit-documents").getPublicUrl(path);
          return { url: data.publicUrl, name: file.name };
        }
      } catch {
        // ignore fallback error and report primary error below
      }
      toast("Upload Failed", s3Err?.message || "Failed to upload document.", "error");
      return null;
    }
  }, []);

  return {
    saving,
    editingId,
    setEditingId,
    createExit,
    updateExit,
    deleteExit,
    uploadDocument,
  };
}
