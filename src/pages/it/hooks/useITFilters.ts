import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { ITAsset, ITTicket } from "../types";

export function useITFilters(
  assets: ITAsset[],
  tickets: ITTicket[],
  setSelectedTicket: (ticket: ITTicket | null) => void
) {
  const [tab, setTab] = useState<"assets" | "tickets" | "security">("assets");

  // Asset Filters & View Mode
  const [assetSearch, setAssetSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");
  const [assetStatusFilter, setAssetStatusFilter] = useState("all");
  const [assetBranchFilter, setAssetBranchFilter] = useState("all");
  const [assetViewMode, setAssetViewMode] = useState<"table" | "cards">("table");

  // Ticket Filters
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("all");
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState("all");

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  // Notification Deep-Linking
  useEffect(() => {
    if (!highlightId || tickets.length === 0) return;
    const match = tickets.find((t) => t.id === highlightId);
    if (!match) return;
    setTab("tickets");
    setTicketStatusFilter("all");
    setSelectedTicket(match);
    const t = setTimeout(() => {
      const el = document.getElementById(`it-ticket-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(t);
  }, [highlightId, tickets, setSelectedTicket]);

  // Aggregate Metrics
  const activeAssets = useMemo(() => assets.filter((a) => a.status === "active").length, [assets]);
  const inInventory = useMemo(() => assets.filter((a) => a.status === "inventory").length, [assets]);
  const inMaintenance = useMemo(() => assets.filter((a) => a.status === "maintenance").length, [assets]);
  const openTickets = useMemo(() => tickets.filter((t) => t.status === "open").length, [tickets]);
  const inProgressTickets = useMemo(() => tickets.filter((t) => t.status === "in_progress").length, [tickets]);
  const criticalTickets = useMemo(
    () =>
      tickets.filter(
        (t) =>
          (t.priority === "critical" || t.priority === "high") &&
          t.status !== "closed" &&
          t.status !== "resolved"
      ).length,
    [tickets]
  );
  const resolvedCount = useMemo(
    () => tickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
    [tickets]
  );

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (assetTypeFilter !== "all" && a.type !== assetTypeFilter) return false;
      if (assetStatusFilter !== "all" && a.status !== assetStatusFilter) return false;
      if (assetBranchFilter !== "all" && a.branch_id !== assetBranchFilter) return false;
      if (assetSearch.trim()) {
        const q = assetSearch.toLowerCase().trim();
        const name = (a.name || "").toLowerCase();
        const tag = (a.asset_tag || "").toLowerCase();
        const type = (a.type || "").toLowerCase();
        const serial = (a.serial_number || "").toLowerCase();
        const emp = `${a.employees?.first_name || ""} ${a.employees?.last_name || ""}`.toLowerCase();
        const branch = (a.branches?.name || "").toLowerCase();
        if (
          !name.includes(q) &&
          !tag.includes(q) &&
          !type.includes(q) &&
          !serial.includes(q) &&
          !emp.includes(q) &&
          !branch.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [assets, assetTypeFilter, assetStatusFilter, assetBranchFilter, assetSearch]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (ticketStatusFilter !== "all" && t.status !== ticketStatusFilter) return false;
      if (ticketPriorityFilter !== "all" && t.priority !== ticketPriorityFilter) return false;
      if (ticketCategoryFilter !== "all" && t.category !== ticketCategoryFilter) return false;
      if (ticketSearch.trim()) {
        const q = ticketSearch.toLowerCase().trim();
        const title = (t.title || "").toLowerCase();
        const req = (t.requester_name || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const id = (t.id || "").toLowerCase();
        if (!title.includes(q) && !req.includes(q) && !cat.includes(q) && !desc.includes(q) && !id.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, ticketStatusFilter, ticketPriorityFilter, ticketCategoryFilter, ticketSearch]);

  // Asset Distribution by Type
  const assetTypeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [assets]);

  return {
    tab,
    setTab,
    assetSearch,
    setAssetSearch,
    assetTypeFilter,
    setAssetTypeFilter,
    assetStatusFilter,
    setAssetStatusFilter,
    assetBranchFilter,
    setAssetBranchFilter,
    assetViewMode,
    setAssetViewMode,
    ticketSearch,
    setTicketSearch,
    ticketStatusFilter,
    setTicketStatusFilter,
    ticketPriorityFilter,
    setTicketPriorityFilter,
    ticketCategoryFilter,
    setTicketCategoryFilter,
    activeAssets,
    inInventory,
    inMaintenance,
    openTickets,
    inProgressTickets,
    criticalTickets,
    resolvedCount,
    filteredAssets,
    filteredTickets,
    assetTypeStats,
  };
}
