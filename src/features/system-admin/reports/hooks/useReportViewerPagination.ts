import { useState, useMemo, useEffect } from "react";
import type { ReportRow } from "../types";

export function useReportViewerPagination(rows: ReportRow[]) {
  const [pageSize, setPageSize] = useState<number | "all">(25);
  const [page, setPage] = useState(1);
  const [inTableSearch, setInTableSearch] = useState("");
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");

  // In-table real-time instant search across all row values
  const displayRows = useMemo(() => {
    if (!inTableSearch.trim()) return rows;
    const q = inTableSearch.toLowerCase().trim();
    return rows.filter((r) =>
      Object.values(r).some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [rows, inTableSearch]);

  const effectivePageSize = pageSize === "all" ? Math.max(1, displayRows.length) : pageSize;
  const totalPages = Math.max(1, Math.ceil(displayRows.length / effectivePageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows =
    pageSize === "all"
      ? displayRows
      : displayRows.slice((safePage - 1) * effectivePageSize, safePage * effectivePageSize);

  const pageStart =
    displayRows.length === 0
      ? 0
      : (safePage - 1) * (typeof pageSize === "number" ? pageSize : displayRows.length) + 1;

  const pageEnd = Math.min(
    safePage * (typeof pageSize === "number" ? pageSize : displayRows.length),
    displayRows.length
  );

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  // Reset page when data or in-table search changes
  useEffect(() => {
    setPage(1);
  }, [rows, inTableSearch, pageSize]);

  return {
    pageSize,
    setPageSize,
    page: safePage,
    setPage,
    inTableSearch,
    setInTableSearch,
    density,
    setDensity,
    displayRows,
    totalPages,
    pagedRows,
    pageStart,
    pageEnd,
    pageWindow,
  };
}
