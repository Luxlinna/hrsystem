import { useState, useMemo, useEffect } from "react";
import type { Notification, NotificationGroup } from "../types";
import { isToday } from "../notificationUtils";
import { canSeeNotification } from "@/lib/notificationRoutes";
import { usePermissions } from "@/hooks/usePermissions";

export function useNotificationsFilter(notifs: Notification[], userId?: string) {
  const { can, loading: permLoading } = usePermissions();
  const [filter, setFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);

  const visibleNotifs = useMemo(
    () =>
      notifs.filter(
        (n) => n.recipient_user_id === userId || canSeeNotification(n.source, can)
      ),
    [notifs, can, userId]
  );

  const unreadCount = useMemo(
    () => visibleNotifs.filter((n) => !n.is_read).length,
    [visibleNotifs]
  );

  const todayCount = useMemo(() => {
    const now = new Date();
    return visibleNotifs.filter((n) => isToday(new Date(n.created_at), now)).length;
  }, [visibleNotifs]);

  const urgentCount = useMemo(
    () => visibleNotifs.filter((n) => n.type === "warning" || n.type === "error").length,
    [visibleNotifs]
  );

  const filtered = useMemo(() => {
    const now = new Date();
    const q = search.trim().toLowerCase();
    return visibleNotifs.filter((n) => {
      const typeMatch =
        filter === "all"
          ? true
          : filter === "unread"
          ? !n.is_read
          : filter === "urgent"
          ? n.type === "warning" || n.type === "error"
          : n.type === filter;
      const sourceMatch = !sourceFilter || n.source === sourceFilter;
      const dateMatch = !todayOnly || isToday(new Date(n.created_at), now);
      const searchMatch =
        !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      return typeMatch && sourceMatch && dateMatch && searchMatch;
    });
  }, [visibleNotifs, filter, sourceFilter, todayOnly, search]);

  const groups: NotificationGroup[] = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const today: Notification[] = [];
    const yday: Notification[] = [];
    const earlier: Notification[] = [];
    filtered.forEach((n) => {
      const d = new Date(n.created_at);
      if (isToday(d, now)) today.push(n);
      else if (isToday(d, yesterday)) yday.push(n);
      else earlier.push(n);
    });
    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yday },
      { label: "Earlier", items: earlier },
    ].filter((g) => g.items.length > 0);
  }, [filtered]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clean up selectedIds if items no longer exist
  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(filtered.map((n) => n.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next.size !== prev.size ? next : prev;
    });
  }, [filtered]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = filtered.length > 0 && filtered.every((n) => selectedIds.has(n.id));
  const isIndeterminate = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const allCurrent = filtered.length > 0 && filtered.every((n) => prev.has(n.id));
      if (allCurrent) return new Set();
      return new Set(filtered.map((n) => n.id));
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const resetFilters = () => {
    setFilter("all");
    setSourceFilter("");
    setSearch("");
    setTodayOnly(false);
    setSelectedIds(new Set());
  };

  const sources = useMemo(
    () => Array.from(new Set(visibleNotifs.map((n) => n.source))).sort(),
    [visibleNotifs]
  );

  const filtersActive = filter !== "all" || Boolean(sourceFilter) || Boolean(search) || todayOnly;

  return {
    permLoading,
    can,
    filter,
    setFilter,
    sourceFilter,
    setSourceFilter,
    search,
    setSearchQuery: setSearch,
    todayOnly,
    setTodayOnly,
    visibleNotifs,
    unreadCount,
    todayCount,
    urgentCount,
    filtered,
    groups,
    resetFilters,
    sources,
    filtersActive,
    selectedIds,
    allSelected,
    isIndeterminate,
    selectedCount: selectedIds.size,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  };
}
