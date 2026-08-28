import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
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
  const [confirming, setConfirming] = useState<BinItem | BinItem[] | null>(null);
  const [working, setWorking] = useState(false);

  const restoreSingle = async (item: BinItem) => {
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
      } catch {
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
    } else if (item.table === "branches") {
      const { error: bErr } = await supabase
        .from("branches")
        .update({ deleted_at: null, deleted_by: null, status: "active" })
        .eq("id", item.id);

      if (!bErr) {
        const { data: emps } = await supabase
          .from("employees")
          .select("id, email")
          .eq("branch_id", item.id);

        if (emps && emps.length > 0) {
          const empIds = emps.map((e) => e.id);
          const empEmails = emps.map((e) => e.email?.toLowerCase()).filter(Boolean);

          await supabase
            .from("employees")
            .update({ deleted_at: null, deleted_by: null, status: "active" })
            .in("id", empIds);

          if (empEmails.length > 0) {
            await supabase
              .from("user_role_assignments")
              .update({ deleted_at: null, deleted_by: null })
              .in("email", empEmails);
          }
        }

        await supabase
          .from("work_locations")
          .update({ deleted_at: null })
          .eq("branch_id", item.id);
      }
      error = bErr;
    } else {
      const { error: dbErr } = await supabase
        .from(item.table)
        .update({ deleted_at: null, deleted_by: null })
        .eq("id", item.id);
      error = dbErr;
    }
    return error;
  };

  const deleteForeverSingle = async (item: BinItem) => {
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
      } catch {
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
    return error;
  };

  const restore = useCallback(
    async (item: BinItem) => {
      setWorking(true);
      const error = await restoreSingle(item);
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
      logActivity({
        module: "settings",
        action: "updated",
        entityType: item.table,
        entityId: String(item.id),
        actorName: "Admin",
        actorRole: "Admin",
        description: `Restored record "${item.label}" from Recycle Bin (${item.table})`,
        branchId: item.raw?.branch_id || undefined,
      });
      setConfirming(null);
      loadItems();
    },
    [loadItems]
  );

  const bulkRestore = useCallback(
    async (items: BinItem[]) => {
      if (items.length === 0) return;
      setWorking(true);
      const results = await Promise.all(items.map((i) => restoreSingle(i)));
      setWorking(false);
      const failed = results.filter(Boolean).length;
      if (failed > 0) {
        toast("Partial Success", `Restored ${items.length - failed} of ${items.length} items.`, "warning");
      } else {
        toast("Success", `Restored ${items.length} item(s) successfully.`, "success");
      }
      logActivity({
        module: "settings",
        action: "updated",
        entityType: "multiple",
        actorName: "Admin",
        actorRole: "Admin",
        description: `Bulk restored ${items.length} records from Recycle Bin`,
      });
      setConfirming(null);
      loadItems();
    },
    [loadItems]
  );

  const deleteForever = useCallback(
    async (target: BinItem | BinItem[]) => {
      if (!isAdmin) {
        toast("Access denied", "Only administrators can permanently delete Recycle Bin items.", "error");
        return;
      }
      setWorking(true);

      const items = Array.isArray(target) ? target : [target];
      const results = await Promise.all(items.map((i) => deleteForeverSingle(i)));
      setWorking(false);

      const failed = results.filter(Boolean).length;
      if (failed > 0) {
        toast("Partial Success", `Deleted ${items.length - failed} of ${items.length} items.`, "warning");
      } else {
        toast("Deleted forever", `${items.length} item(s) permanently erased.`, "success");
      }

      items.forEach((item) => {
        logActivity({
          module: "settings",
          action: "deleted",
          entityType: item.table,
          entityId: String(item.id),
          actorName: "Admin",
          actorRole: "Admin",
          description: `Permanently deleted record "${item.label}" (${item.table})`,
          branchId: item.raw?.branch_id || undefined,
        });
      });

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
    bulkRestore,
    deleteForever,
  };
}
