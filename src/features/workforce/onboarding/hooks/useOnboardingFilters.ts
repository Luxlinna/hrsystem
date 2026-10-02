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
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "progress" | "days">("newest");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  // Available branches from current requests
  const availableBranches = useMemo(() => {
    const map = new Map<string, string>();
    requests.forEach((r) => {
      const bId = (r.employees as any)?.branch_id;
      const bName = (r.employees as any)?.branches?.name;
      if (bId && bName) map.set(bId, bName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests
      .filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (stageFilter !== "all" && r.stage !== stageFilter) return false;
        if (branchFilter !== "all" && (r.employees as any)?.branch_id !== branchFilter) return false;
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
  }, [requests, documents, statusFilter, stageFilter, branchFilter, searchQuery, sortBy]);

  return {
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    stageFilter,
    setStageFilter,
    branchFilter,
    setBranchFilter,
    availableBranches,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    expandedRequest,
    setExpandedRequest,
    filteredRequests,
  };
}
