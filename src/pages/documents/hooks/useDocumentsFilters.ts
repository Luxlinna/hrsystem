import { useState, useMemo, useEffect, useCallback } from "react";
import type { Document, DocumentFolder, StatusFilter, ViewMode } from "../types";
import { exportDocumentsCSV } from "../exportUtils";

interface UseDocumentsFiltersProps {
  documents: Document[];
  folders: DocumentFolder[];
}

export function useDocumentsFilters({ documents, folders }: UseDocumentsFiltersProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [filterTemplate, setFilterTemplate] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);

  const activeDocsCount = useMemo(() => documents.filter((d) => d.status === "active").length, [documents]);
  const templatesCount = useMemo(() => documents.filter((d) => d.is_template).length, [documents]);
  const totalDownloads = useMemo(() => documents.reduce((acc, d) => acc + (d.download_count || 0), 0), [documents]);
  const archivedCount = useMemo(() => documents.filter((d) => d.status === "archived").length, [documents]);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (activeCategory !== "all") {
        const getDescendantFolderIds = (folderId: string): string[] => {
          const subs = folders.filter((f) => f.parent_id === folderId);
          return [folderId, ...subs.map((s) => s.id).flatMap(getDescendantFolderIds)];
        };
        const allowedFolderIds = new Set(getDescendantFolderIds(activeCategory));
        if (!allowedFolderIds.has(doc.category)) return false;
      }

      if (filterTemplate !== null && doc.is_template !== filterTemplate) return false;
      if (statusFilter !== "all" && doc.status !== statusFilter) return false;
      if (visibilityFilter !== "all" && doc.visibility !== visibilityFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesDesc = (doc.description || "").toLowerCase().includes(q);
        const matchesTags = (doc.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchesAuthor = (doc.created_by || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTags && !matchesAuthor) return false;
      }

      return true;
    });
  }, [documents, folders, activeCategory, filterTemplate, statusFilter, visibilityFilter, search]);

  const docTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, docTotalPages);
  const pagedDocs = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [search, activeCategory, statusFilter, visibilityFilter, filterTemplate]);

  const handleExportCSV = useCallback(() => {
    exportDocumentsCSV(filtered, folders);
  }, [filtered, folders]);

  return {
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    filterTemplate,
    setFilterTemplate,
    statusFilter,
    setStatusFilter,
    visibilityFilter,
    setVisibilityFilter,
    viewMode,
    setViewMode,
    pageSize,
    setPageSize,
    page,
    setPage,
    activeDocsCount,
    templatesCount,
    totalDownloads,
    archivedCount,
    filtered,
    docTotalPages,
    pagedDocs,
    handleExportCSV,
  };
}
