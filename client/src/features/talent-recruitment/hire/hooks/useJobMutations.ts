import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface UseJobMutationsProps {
  actorName: string;
  loadData: () => Promise<void>;
}

export function useJobMutations({ actorName, loadData }: UseJobMutationsProps) {
  const [postingJob, setPostingJob] = useState(false);

  const closeJob = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("job_postings").update({ status: "closed" }).eq("id", id);
      if (error) {
        toast("Error", "Failed to close job posting", "error");
        return;
      }
      toast("Job closed", "The job posting has been archived.", "success");
      loadData();
    },
    [loadData]
  );

  const reopenJob = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("job_postings").update({ status: "active" }).eq("id", id);
      if (error) {
        toast("Error", "Failed to reopen job posting", "error");
        return;
      }
      toast("Job reopened", "The job posting is now active.", "success");
      loadData();
    },
    [loadData]
  );

  const deleteJob = useCallback(
    async (id: string, title: string) => {
      if (!confirm(`Move job "${title}" to Recycle Bin? It can be restored anytime.`)) return;
      const { error } = await supabase
        .from("job_postings")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", id);
      if (error) {
        toast("Error", "Failed to delete job posting", "error");
        return;
      }
      toast("Moved to Bin", `Job "${title}" sent to Recycle Bin.`, "success");
      loadData();
    },
    [actorName, loadData]
  );

  return {
    postingJob,
    setPostingJob,
    closeJob,
    reopenJob,
    deleteJob,
  };
}
