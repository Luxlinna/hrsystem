import { useMemo } from "react";
import type { Review, Employee } from "../types";

export function usePerformanceCalculations(
  reviews: Review[],
  employees: Employee[],
  filterQ: string,
  filterStatus: string,
  filterDept: string
) {
  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))).sort(),
    [employees]
  );

  const avgScore = useMemo(() => {
    const scored = reviews.filter((r) => r.overall_score);
    return scored.reduce((sum, r) => sum + (r.overall_score || 0), 0) / Math.max(scored.length, 1);
  }, [reviews]);

  const submitted = useMemo(
    () => reviews.filter((r) => r.status === "submitted").length,
    [reviews]
  );

  const drafts = useMemo(
    () => reviews.filter((r) => r.status === "draft").length,
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchQ = filterQ === "all" || `${r.quarter} ${r.year}` === filterQ || r.quarter === filterQ;
      const matchS = filterStatus === "all" || r.status === filterStatus;
      const matchD = filterDept === "all" || r.employee?.department === filterDept;
      return matchQ && matchS && matchD;
    });
  }, [reviews, filterQ, filterStatus, filterDept]);

  return {
    departments,
    avgScore,
    submitted,
    drafts,
    filteredReviews,
  };
}
