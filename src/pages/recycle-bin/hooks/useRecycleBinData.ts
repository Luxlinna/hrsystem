import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { useBranchScope } from "@/context/BranchContext";
import { MODULES } from "../constants";
import type { BinItem, ModuleCount } from "../types";

export function useRecycleBinData() {
  const { user } = useAuth();
  const { employee: myEmployee } = useMyEmployee();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();
  const isPrivileged = isSuperAdmin || isBranchAdmin;

  const [items, setItems] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadItems = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const results = await Promise.all(
      MODULES.map((m) => {
        let q = supabase
          .from(m.table)
          .select(m.select)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false });

        if (m.applyBranchFilter) {
          q = m.applyBranchFilter(q, targetBranch);
        }
        return q;
      })
    );
    const flat: BinItem[] = [];
    results.forEach((res, i) => {
      const cfg = MODULES[i];
      (res.data || []).forEach((r: any) => {
        flat.push({
          table: cfg.table,
          id: r.id,
          label: cfg.label(r),
          detail: cfg.detail(r),
          deleted_at: r.deleted_at,
          deleted_by: r.deleted_by || null,
          raw: r,
        });
      });
    });

    const userEmail = (user?.email || "").toLowerCase().trim();
    const actorFullName = myEmployee
      ? `${myEmployee.first_name} ${myEmployee.last_name}`.toLowerCase().trim()
      : "";
    const employeeId = myEmployee?.id || "";

    const userScopedItems = isPrivileged
      ? flat
      : flat.filter((item) => {
          const deletedBy = (item.deleted_by || "").toLowerCase().trim();
          const isDeletedByMe = Boolean(
            (userEmail && deletedBy === userEmail) ||
            (actorFullName && deletedBy === actorFullName) ||
            (actorFullName && deletedBy.includes(actorFullName)) ||
            (userEmail && deletedBy.includes(userEmail))
          );
          const isMyEmployeeRecord = Boolean(
            employeeId && (
              item.raw?.employee_id === employeeId ||
              item.raw?.employees?.id === employeeId ||
              item.raw?.employee?.id === employeeId ||
              item.id === employeeId
            )
          );
          return isDeletedByMe || isMyEmployeeRecord;
        });

    userScopedItems.sort((a, b) => (a.deleted_at < b.deleted_at ? 1 : -1));
    setItems(userScopedItems);
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch, isPrivileged, user?.email, myEmployee]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.table === filter)),
    [items, filter]
  );

  const counts: ModuleCount[] = useMemo(
    () =>
      MODULES.map((m) => ({
        ...m,
        count: items.filter((i) => i.table === m.table).length,
      })).filter((m) => m.count > 0),
    [items]
  );

  return {
    items,
    loading,
    filter,
    setFilter,
    filteredItems,
    counts,
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    targetBranch,
    loadItems,
  };
}
