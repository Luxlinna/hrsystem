import { useState, useEffect, useCallback } from "react";
import type { ViewMode, DensityMode, QuickFilter } from "../types";

interface UseShiftNavigationProps {
  onOpenCreate: () => void;
}

export function useShiftNavigation({ onOpenCreate }: UseShiftNavigationProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  const navigatePrev = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") {
        d.setMonth(d.getMonth() - 1);
      } else if (viewMode === "day") {
        d.setDate(d.getDate() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") {
        d.setMonth(d.getMonth() + 1);
      } else if (viewMode === "day") {
        d.setDate(d.getDate() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  }, [viewMode]);

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterBranch("all");
    setFilterDept("all");
    setQuickFilter("all");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "w" || e.key === "W") setViewMode("week");
      else if (e.key === "d" || e.key === "D") setViewMode("day");
      else if (e.key === "l" || e.key === "L") setViewMode("list");
      else if (e.key === "m" || e.key === "M") setViewMode("month");
      else if (e.key === "c" || e.key === "C") onOpenCreate();
      else if (e.key === "t" || e.key === "T") navigateToday();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateToday, onOpenCreate]);

  return {
    currentDate,
    setCurrentDate,
    viewMode,
    setViewMode,
    density,
    setDensity,
    searchQuery,
    setSearchQuery,
    filterBranch,
    setFilterBranch,
    filterDept,
    setFilterDept,
    quickFilter,
    setQuickFilter,
    navigatePrev,
    navigateNext,
    navigateToday,
    clearFilters,
  };
}
