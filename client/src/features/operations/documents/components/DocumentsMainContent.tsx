import { memo } from "react";
import type { Document, DocumentFolder, StatusFilter, ViewMode } from "../types";
import { SubfolderBreadcrumbs } from "./SubfolderBreadcrumbs";
import { FilterBar } from "./FilterBar";
import { DocumentsCardsView } from "./DocumentsCardsView";
import { DocumentsTableView } from "./DocumentsTableView";
import { Pagination } from "./Pagination";

interface DocumentsMainContentProps {
  activeCategory: string;
  activeFolderObj?: DocumentFolder;
  activeParentFolder?: DocumentFolder | null;
  currentSubfolders: DocumentFolder[];
  categoryCounts: Record<string, number>;
  filteredCount: number;
  canManageDocs: boolean;
  onSelectCategory: (catId: string) => void;
  onOpenNewFolder: (parentId?: string) => void;
  search: string;
  setSearch: (s: string) => void;
  visibilityFilter: string;
  setVisibilityFilter: (v: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  onFilterChangeResetPage: () => void;
  pagedDocs: Document[];
  folders: DocumentFolder[];
  selectedDocId: string | null;
  onSelectDoc: (doc: Document) => void;
  onOpenUploadModal: () => void;
  onDownload: (doc: Document) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
}

export const DocumentsMainContent = memo(function DocumentsMainContent({
  activeCategory,
  activeFolderObj,
  activeParentFolder,
  currentSubfolders,
  categoryCounts,
  filteredCount,
  canManageDocs,
  onSelectCategory,
  onOpenNewFolder,
  search,
  setSearch,
  visibilityFilter,
  setVisibilityFilter,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  onFilterChangeResetPage,
  pagedDocs,
  folders,
  selectedDocId,
  onSelectDoc,
  onOpenUploadModal,
  onDownload,
  pageSize,
  setPageSize,
  page,
  setPage,
  totalPages,
}: DocumentsMainContentProps) {
  return (
    <div className="lg:col-span-3 space-y-4">
      <SubfolderBreadcrumbs
        activeCategory={activeCategory}
        activeFolderObj={activeFolderObj}
        activeParentFolder={activeParentFolder}
        currentSubfolders={currentSubfolders}
        categoryCounts={categoryCounts}
        totalFiles={filteredCount}
        canManageDocs={canManageDocs}
        onSelectCategory={onSelectCategory}
        onOpenNewFolder={onOpenNewFolder}
      />

      <FilterBar
        search={search}
        setSearch={setSearch}
        visibilityFilter={visibilityFilter}
        setVisibilityFilter={setVisibilityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onFilterChangeResetPage={onFilterChangeResetPage}
      />

      {viewMode === "cards" ? (
        <DocumentsCardsView
          documents={pagedDocs}
          folders={folders}
          selectedDocId={selectedDocId}
          canManageDocs={canManageDocs}
          activeCategory={activeCategory}
          onSelectDoc={onSelectDoc}
          onOpenNewFolder={onOpenNewFolder}
          onOpenUploadModal={onOpenUploadModal}
        />
      ) : (
        <DocumentsTableView
          documents={pagedDocs}
          folders={folders}
          onSelectDoc={onSelectDoc}
          onDownload={onDownload}
        />
      )}

      <Pagination
        totalCount={filteredCount}
        pageSize={pageSize}
        setPageSize={setPageSize}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
      />
    </div>
  );
});
