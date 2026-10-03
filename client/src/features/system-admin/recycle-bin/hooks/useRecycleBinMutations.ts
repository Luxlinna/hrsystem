import { useState, useCallback } from "react";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { MODULES } from "../constants";
import type { BinItem } from "../types";
import { restoreSingleItem, deleteForeverSingleItem } from "./recycleBinActionHandlers";

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

  const restore = useCallback(
    async (item: BinItem) => {
      setWorking(true);
      const error = await restoreSingleItem(item);
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
      const results = await Promise.all(items.map((i) => restoreSingleItem(i)));
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
      const results = await Promise.all(items.map((i) => deleteForeverSingleItem(i)));
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
