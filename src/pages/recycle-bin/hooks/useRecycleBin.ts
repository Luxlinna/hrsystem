import { useState, useCallback, useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useRecycleBinData } from "./useRecycleBinData";
import { useRecycleBinMutations } from "./useRecycleBinMutations";
import type { BinItem } from "../types";

export function useRecycleBin() {
  const { isAdmin, isBranchAdmin } = usePermissions();
  const canControl = isAdmin || isBranchAdmin;
  const data = useRecycleBinData();
  const mutations = useRecycleBinMutations({
    isAdmin: canControl,
    loadItems: data.loadItems,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectItem = useCallback((item: BinItem) => {
    const key = `${item.table}-${item.id}`;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allKeys = data.filteredItems.map((i) => `${i.table}-${i.id}`);
      const isAllSelected = allKeys.length > 0 && allKeys.every((k) => prev.has(k));
      if (isAllSelected) {
        return new Set();
      } else {
        return new Set(allKeys);
      }
    });
  }, [data.filteredItems]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedItems = useMemo(() => {
    return data.filteredItems.filter((i) => selectedIds.has(`${i.table}-${i.id}`));
  }, [data.filteredItems, selectedIds]);

  const handleBulkRestore = useCallback(async () => {
    if (selectedItems.length === 0) return;
    await mutations.bulkRestore(selectedItems);
    clearSelection();
  }, [selectedItems, mutations, clearSelection]);

  const handleConfirmBulkDelete = useCallback(() => {
    if (selectedItems.length === 0) return;
    mutations.setConfirming(selectedItems);
  }, [selectedItems, mutations]);

  const handleConfirmDeleteSingle = useCallback((item: BinItem) => {
    mutations.setConfirming(item);
  }, [mutations]);

  const handleExecuteDelete = useCallback(async (target: BinItem | BinItem[]) => {
    await mutations.deleteForever(target);
    clearSelection();
  }, [mutations, clearSelection]);

  return {
    isAdmin: canControl,
    ...data,
    ...mutations,
    selectedIds,
    selectedItems,
    toggleSelectItem,
    toggleSelectAll,
    clearSelection,
    handleBulkRestore,
    handleConfirmBulkDelete,
    handleConfirmDeleteSingle,
    handleExecuteDelete,
  };
}
