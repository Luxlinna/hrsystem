import { useState, useMemo } from "react";
import type { OnboardingRequest, OnboardingDoc } from "../types";
import { getOverallProgress } from "../onboardingUtils";

export function useOnboardingFilters(
  requests: OnboardingRequest[],
  documents: OnboardingDoc[]
) {
  const [viewMode, setViewMode] = useState<"cards" | "kanban" | "table">("cards");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "progress" | "days">("newest");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    return requests
      .filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (stageFilter !== "all" && r.stage !== stageFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const fullName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
          const role = (r.employees?.role || "").toLowerCase();
          const dept = (r.employees?.department || "").toLowerCase();
          const branch = (r.employees?.branches?.name || "").toLowerCase();
          if (!fullName.includes(q) && !role.includes(q) && !dept.includes(q) && !branch.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          const nameA = `${a.employees?.first_name || ""} ${a.employees?.last_name || ""}`;
          const nameB = `${b.employees?.first_name || ""} ${b.employees?.last_name || ""}`;
          return nameA.localeCompare(nameB);
        }
        if (sortBy === "progress") {
          return getOverallProgress(b, documents) - getOverallProgress(a, documents);
        }
        if (sortBy === "days") {
          return (b.day_count || 0) - (a.day_count || 0);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [requests, documents, statusFilter, stageFilter, searchQuery, sortBy]);

  return {
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    stageFilter,
    setStageFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    expandedRequest,
    setExpandedRequest,
    filteredRequests,
  };
}
