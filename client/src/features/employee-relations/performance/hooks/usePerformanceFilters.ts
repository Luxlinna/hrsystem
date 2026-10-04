import { useState } from "react";
import type { Review, PerformanceTab } from "../types";

export type { PerformanceTab };

export function usePerformanceFilters() {
  const [activeTab, setActiveTab] = useState<PerformanceTab>("reviews");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filterQ, setFilterQ] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");

  return {
    activeTab,
    setActiveTab,
    selectedReview,
    setSelectedReview,
    filterQ,
    setFilterQ,
    filterStatus,
    setFilterStatus,
    filterDept,
    setFilterDept,
  };
}
