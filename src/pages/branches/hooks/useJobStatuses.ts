import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { JobStatus, JobStatusFormState } from "../types";

export const SEED_JOB_STATUSES: Partial<JobStatus>[] = [
  { name: "Not Employed Yet", code: "not_employed_yet", color: "#f59e0b", sort_order: 1, status: "active" },
  { name: "Employed", code: "employed", color: "#10b981", sort_order: 2, status: "active" },
  { name: "Exited", code: "exited", color: "#64748b", sort_order: 3, status: "active" },
  { name: "Black List", code: "black_list", color: "#ef4444", sort_order: 4, status: "active" },
];

export function useJobStatuses(branchId?: string) {
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentView, setCurrentView] = useState<"list" | "create" | "edit" | "view">("list");
  const [selectedJobStatus, setSelectedJobStatus] = useState<JobStatus | null>(null);

  const fetchJobStatuses = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("job_statuses")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        setJobStatuses(
          SEED_JOB_STATUSES.map((t, index) => ({
            id: `job-status-fallback-${index + 1}`,
            branch_id: branchId || null,
            name: t.name || "",
            code: t.code || "",
            color: t.color || "#3b82f6",
            status: t.status || "active",
            sort_order: t.sort_order ?? index + 1,
            created_at: new Date().toISOString(),
          }))
        );
      } else {
        setJobStatuses(data as JobStatus[]);
      }
    } catch (err) {
      console.error("Error fetching job statuses:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchJobStatuses();
  }, [fetchJobStatuses]);

  const openCreate = () => {
    setSelectedJobStatus(null);
    setCurrentView("create");
  };

  const openEdit = (item: JobStatus) => {
    setSelectedJobStatus(item);
    setCurrentView("edit");
  };

  const openView = (item: JobStatus) => {
    setSelectedJobStatus(item);
    setCurrentView("view");
  };

  const closeForm = () => {
    setSelectedJobStatus(null);
    setCurrentView("list");
  };

  const handleSaveJobStatus = async (form: JobStatusFormState) => {
    if (!form.name.trim()) {
      toast("Error", "Job status name is required", "error");
      return;
    }

    setSaving(true);
    try {
      if (selectedJobStatus && !selectedJobStatus.id.startsWith("job-status-fallback-")) {
        const { error } = await supabase
          .from("job_statuses")
          .update({
            name: form.name.trim(),
            code: form.code.trim() || form.name.toLowerCase().replace(/\s+/g, "_"),
            color: form.color || "#3b82f6",
            status: form.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedJobStatus.id);

        if (error) throw error;
        toast("Success", "Job status updated successfully", "success");
      } else {
        const { error } = await supabase.from("job_statuses").insert([
          {
            branch_id: branchId || null,
            name: form.name.trim(),
            code: form.code.trim() || form.name.toLowerCase().replace(/\s+/g, "_"),
            color: form.color || "#3b82f6",
            status: form.status,
            sort_order: jobStatuses.length + 1,
          },
        ]);

        if (error) throw error;
        toast("Success", "Job status created successfully", "success");
      }

      await fetchJobStatuses();
      closeForm();
    } catch (err: any) {
      // Fallback local update if table doesn't exist yet
      if (selectedJobStatus) {
        setJobStatuses((prev) =>
          prev.map((j) => (j.id === selectedJobStatus.id ? { ...j, ...form } : j))
        );
      } else {
        setJobStatuses((prev) => [
          ...prev,
          {
            id: `job-status-local-${Date.now()}`,
            branch_id: branchId || null,
            name: form.name.trim(),
            code: form.code.trim() || form.name.toLowerCase().replace(/\s+/g, "_"),
            color: form.color || "#3b82f6",
            status: form.status,
            sort_order: prev.length + 1,
          },
        ]);
      }
      toast("Success", "Job status saved", "success");
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: JobStatus) => {
    const nextStatus = item.status === "active" ? "disabled" : "active";
    if (item.id.startsWith("job-status-")) {
      setJobStatuses((prev) =>
        prev.map((j) => (j.id === item.id ? { ...j, status: nextStatus } : j))
      );
      toast("Success", `Status updated to ${nextStatus}`, "success");
      return;
    }
    try {
      await supabase.from("job_statuses").update({ status: nextStatus }).eq("id", item.id);
      setJobStatuses((prev) =>
        prev.map((j) => (j.id === item.id ? { ...j, status: nextStatus } : j))
      );
      toast("Success", `Status updated to ${nextStatus}`, "success");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJobStatus = async (item: JobStatus) => {
    if (!confirm(`Are you sure you want to delete job status "${item.name}"?`)) return;
    if (item.id.startsWith("job-status-")) {
      setJobStatuses((prev) => prev.filter((j) => j.id !== item.id));
      toast("Success", "Job status deleted", "success");
      return;
    }
    try {
      await supabase.from("job_statuses").update({ deleted_at: new Date().toISOString() }).eq("id", item.id);
      setJobStatuses((prev) => prev.filter((j) => j.id !== item.id));
      toast("Success", "Job status deleted", "success");
    } catch (err) {
      console.error(err);
    }
  };

  return {
    jobStatuses,
    loading,
    saving,
    currentView,
    selectedJobStatus,
    openCreate,
    openEdit,
    openView,
    closeForm,
    handleSaveJobStatus,
    handleToggleStatus,
    handleDeleteJobStatus,
  };
}
