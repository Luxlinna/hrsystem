import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { MODULES } from "../constants";
import type { BinItem, ModuleCount } from "../types";

export function useRecycleBinData() {
  const [items, setItems] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadItems = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(
      MODULES.map((m) =>
        supabase
          .from(m.table)
          .select(m.select)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false })
      )
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
    flat.sort((a, b) => (a.deleted_at < b.deleted_at ? 1 : -1));
    setItems(flat);
    setLoading(false);
  }, []);

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
    loadItems,
  };
}
