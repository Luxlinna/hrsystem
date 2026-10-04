import { useState, useMemo } from "react";
import type { StationeryItem, StationeryRequest } from "../../types";

export function useStationeryFilters(
  items: StationeryItem[],
  requests: StationeryRequest[],
  targetBranch: string | null
) {
  const [stationeryTab, setStationeryTab] = useState<"inventory" | "requests">("inventory");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [requestStatusFilter, setRequestStatusFilter] = useState<"all" | "pending" | "approved" | "issued" | "rejected">("all");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (targetBranch && item.branch_id && item.branch_id !== targetBranch) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;

      if (stockStatusFilter === "out_of_stock" && item.stock_quantity > 0) return false;
      if (stockStatusFilter === "low_stock" && (item.stock_quantity <= 0 || item.stock_quantity > item.min_stock_level)) return false;
      if (stockStatusFilter === "in_stock" && item.stock_quantity <= item.min_stock_level) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchLoc = (item.location || "").toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchLoc) return false;
      }

      return true;
    });
  }, [items, targetBranch, categoryFilter, stockStatusFilter, search]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (targetBranch && req.branch_id && req.branch_id !== targetBranch) return false;
      if (requestStatusFilter !== "all" && req.status !== requestStatusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchItem = req.item_name.toLowerCase().includes(q);
        const matchRequester = req.requested_by_name.toLowerCase().includes(q);
        const matchDept = req.department.toLowerCase().includes(q);
        if (!matchItem && !matchRequester && !matchDept) return false;
      }

      return true;
    });
  }, [requests, targetBranch, requestStatusFilter, search]);

  const totalItemsCount = items.length;
  const lowStockCount = useMemo(
    () => items.filter((i) => i.stock_quantity > 0 && i.stock_quantity <= i.min_stock_level).length,
    [items]
  );
  const outOfStockCount = useMemo(
    () => items.filter((i) => i.stock_quantity <= 0).length,
    [items]
  );
  const pendingRequestsCount = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests]
  );

  return {
    stationeryTab,
    setStationeryTab,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    stockStatusFilter,
    setStockStatusFilter,
    requestStatusFilter,
    setRequestStatusFilter,
    filteredItems,
    filteredRequests,
    totalItemsCount,
    lowStockCount,
    outOfStockCount,
    pendingRequestsCount,
  };
}
