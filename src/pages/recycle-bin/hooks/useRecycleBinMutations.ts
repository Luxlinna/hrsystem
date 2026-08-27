import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { extractR2Key, deleteDocument, isCloudflareR2Url } from "@/lib/r2-storage";
import { MODULES } from "../constants";
import type { BinItem } from "../types";

interface UseRecycleBinMutationsProps {
  isAdmin: boolean;
  loadItems: () => Promise<void>;
}

export function useRecycleBinMutations({
  isAdmin,
  loadItems,
}: UseRecycleBinMutationsProps) {
  const [confirming, setConfirming] = useState<BinItem | null>(null);
  const [working, setWorking] = useState(false);

  const restore = useCallback(
    async (item: BinItem) => {
      setWorking(true);
      let error: any = null;

      if (item.table === "user_role_assignments") {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const res = await fetch(
            `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/manage-user-role`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token}`,
                apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({
                action: "restore_assignment",
                assignment_id: item.id,
              }),
            }
          );
          const result = await res.json().catch(() => ({}));
          if (!res.ok || result.error) throw new Error(result.error || "Failed to restore user");
        } catch (err) {
          const { error: dbErr } = await supabase
            .from("user_role_assignments")
            .update({ deleted_at: null, deleted_by: null })
            .eq("id", item.id);
          error = dbErr;
        }
      } else if (item.table === "onboarding_requests") {
        const [{ error: dbErr }] = await Promise.all([
          supabase
            .from("onboarding_requests")
            .update({ deleted_at: null, deleted_by: null })
            .eq("id", item.id),
          supabase
            .from("onboarding_checklist_tasks")
            .update({ deleted_at: null, deleted_by: null })
            .eq("onboarding_request_id", item.id),
        ]);
        error = dbErr;
      } else {
        const { error: dbErr } = await supabase
          .from(item.table)
          .update({ deleted_at: null, deleted_by: null })
          .eq("id", item.id);
        error = dbErr;
      }

      setWorking(false);
      if (error) {
        toast("Error", "Failed to restore item", "error");
        return;
      }
      toast(
        "Restored",
        `"${item.label}" is back in ${MODULES.find((m) => m.table === item.table)?.name}.`,
        "success"
      );
      setConfirming(null);
      loadItems();
    },
    [loadItems]
  );

  const deleteForever = useCallback(
    async (item: BinItem) => {
      if (!isAdmin) {
        toast("Access denied", "Only administrators can permanently delete Recycle Bin items.", "error");
        return;
      }
      setWorking(true);
      let error: any = null;

      if (item.table === "user_role_assignments") {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const res = await fetch(
            `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/manage-user-role`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token}`,
                apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({
                action: "delete_user_forever",
                assignment_id: item.id,
              }),
            }
          );
          const result = await res.json().catch(() => ({}));
          if (!res.ok || result.error)
            throw new Error(result.error || "Failed to delete user permanently");
        } catch (err) {
          const { error: dbErr } = await supabase
            .from("user_role_assignments")
            .delete()
            .eq("id", item.id);
          error = dbErr;
        }
      } else if (item.table === "onboarding_requests") {
        const [{ error: dbErr }] = await Promise.all([
          supabase
            .from("onboarding_checklist_tasks")
            .delete()
            .eq("onboarding_request_id", item.id),
          supabase
            .from("onboarding_documents")
            .delete()
            .eq("onboarding_request_id", item.id),
          supabase.from("onboarding_requests").delete().eq("id", item.id),
        ]);
        error = dbErr;
      } else {
        const { error: dbErr } = await supabase.from(item.table).delete().eq("id", item.id);
        error = dbErr;
        if (!error && item.table === "documents" && item.raw?.file_url) {
          if (isCloudflareR2Url(item.raw.file_url)) {
            const key = extractR2Key(item.raw.file_url);
            if (key) await deleteDocument(key).catch(() => {});
          } else if (item.raw.file_url.includes("/storage/v1/")) {
            const filePath = item.raw.file_url.split("/documents/")[1];
            if (filePath) await supabase.storage.from("documents").remove([filePath]);
          }
        }
      }

      setWorking(false);
      if (error) {
        toast("Error", "Failed to delete item", "error");
        return;
      }
      toast("Deleted forever", `"${item.label}" was permanently erased.`, "success");
      setConfirming(null);
      loadItems();
    },
    [isAdmin, loadItems]
  );

  return {
    confirming,
    setConfirming,
    working,
    restore,
    deleteForever,
  };
}
