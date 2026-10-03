import { useState, useMemo, useCallback } from "react";
import type { Document, DocumentFolder } from "../types";

interface UseFolderHierarchyProps {
  documents: Document[];
  folders: DocumentFolder[];
  activeCategory: string;
  selectedDoc: Document | null;
}

export function useFolderHierarchy({
  documents,
  folders,
  activeCategory,
  selectedDoc,
}: UseFolderHierarchyProps) {
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(["policy", "ops_solutions_mszk6twr"])
  );

  const toggleFolderExpanded = useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const rootFolders = useMemo(() => {
    return folders.filter((f) => !f.parent_id);
  }, [folders]);

  const getSubfolders = useCallback(
    (parentId: string) => {
      return folders.filter((f) => f.parent_id === parentId);
    },
    [folders]
  );

  const activeFolderObj = useMemo(() => {
    return folders.find((f) => f.id === activeCategory);
  }, [folders, activeCategory]);

  const activeParentFolder = useMemo(() => {
    if (!activeFolderObj?.parent_id) return null;
    return folders.find((f) => f.id === activeFolderObj.parent_id);
  }, [folders, activeFolderObj]);

  const currentSubfolders = useMemo(() => {
    if (activeCategory === "all") return [];
    return folders.filter((f) => f.parent_id === activeCategory);
  }, [folders, activeCategory]);

  const relatedDocuments = useMemo(() => {
    if (!selectedDoc) return [];
    return documents
      .filter((d) => d.id !== selectedDoc.id && d.category === selectedDoc.category)
      .slice(0, 4);
  }, [documents, selectedDoc]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };

    const getDescendantFolderIds = (folderId: string): string[] => {
      const subs = folders.filter((f) => f.parent_id === folderId);
      const subIds = subs.map((s) => s.id);
      return [folderId, ...subIds.flatMap(getDescendantFolderIds)];
    };

    folders.forEach((f) => {
      const familyIds = new Set(getDescendantFolderIds(f.id));
      counts[f.id] = documents.filter((d) => familyIds.has(d.category)).length;
    });

    return counts;
  }, [documents, folders]);

  return {
    expandedFolderIds,
    setExpandedFolderIds,
    toggleFolderExpanded,
    rootFolders,
    getSubfolders,
    activeFolderObj,
    activeParentFolder,
    currentSubfolders,
    relatedDocuments,
    categoryCounts,
  };
}
