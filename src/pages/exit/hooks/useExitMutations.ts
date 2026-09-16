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

function formatExitPayload(form: ExitFormState, actorName?: string) {
  const extraMeta = {
    is_blacklisted: Boolean(form.is_blacklisted),
    remark: form.remark?.trim() || null,
    contract_type: form.contract_type?.trim() || null,
    severance_pay_info: form.severance_pay_info || null,
  };
  const encodedReason = `[EXIT_META:${JSON.stringify(extraMeta)}]${form.reason_description.trim() || ""}`;

  const fallback: any = {
    exit_type: form.exit_type,
    last_working_day: form.last_working_day,
    reason_type: form.reason_type,
    reason_description: encodedReason,
    document_url: form.document_url.trim() || null,
    document_name: form.document_name.trim() || null,
  };
  if (actorName) {
    fallback.employee_id = form.employee_id;
    fallback.recorded_by = actorName;
    fallback.status = "active";
  }

  const full = {
    ...fallback,
    is_blacklisted: Boolean(form.is_blacklisted),
    remark: form.remark?.trim() || null,
    contract_type: form.contract_type?.trim() || null,
    severance_pay_info: form.severance_pay_info || null,
    severance_amount: form.severance_pay_info?.total_amount || 0,
  };

  return { full, fallback };
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
    const { full, fallback } = formatExitPayload(form, actorName);

    let { error } = await supabase.from("employee_exits").insert(full);
    if (error && error.message?.includes("column")) {
      const fallbackRes = await supabase.from("employee_exits").insert(fallback);
      error = fallbackRes.error;
    }

    if (error) {
      toast("Error", error.message || "Failed to record exit.", "error");
      setSaving(false);
      return false;
    }

    await supabase.from("employees").update({ status: "inactive" }).eq("id", form.employee_id);

    toast("Exit Recorded", "Employee exit requirement form saved successfully.", "success");
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
    const { full, fallback } = formatExitPayload(form);

    let { error } = await supabase.from("employee_exits").update(full).eq("id", id);
    if (error && error.message?.includes("column")) {
      const fallbackRes = await supabase.from("employee_exits").update(fallback).eq("id", id);
      error = fallbackRes.error;
    }

    if (error) {
      toast("Error", error.message || "Failed to update exit record.", "error");
      setSaving(false);
      return false;
    }
    toast("Updated", "Exit record updated successfully.", "success");
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

  // ── File upload (Strictly AWS S3) ────────────────────────────────────
  const uploadDocument = useCallback(async (file: File): Promise<{ url: string; name: string } | null> => {
    try {
      const res = await uploadFileToS3(file, "employees/exits");
      return { url: res.url, name: file.name };
    } catch (s3Err: any) {
      console.error("AWS S3 upload error:", s3Err);
      toast("Upload Failed", s3Err?.message || "Failed to upload document to AWS S3.", "error");
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
