import { useCallback } from "react";
import { DocumentsHeader } from "./components/DocumentsHeader";
import { DocumentsMetricCards } from "./components/DocumentsMetricCards";
import { FolderTreeSidebar } from "./components/FolderTreeSidebar";
import { SubfolderBreadcrumbs } from "./components/SubfolderBreadcrumbs";
import { FilterBar } from "./components/FilterBar";
import { DocumentsCardsView } from "./components/DocumentsCardsView";
import { DocumentsTableView } from "./components/DocumentsTableView";
import { Pagination } from "./components/Pagination";
import { DocumentDrawer } from "./components/DocumentDrawer";
import { FolderModal } from "./components/FolderModal";
import { DocumentUploadModal } from "./components/DocumentUploadModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useDocuments } from "./hooks/useDocuments";

export default function DocumentsPage() {
  const {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    canManageDocs,
    documents,
    folders,
    expandedFolderIds,
    loading,
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
    selectedDoc,
    setSelectedDoc,
    drawerTab,
    setDrawerTab,
    showUploadModal,
    setShowUploadModal,
    editingDoc,
    submitting,
    showFolderModal,
    setShowFolderModal,
    editingFolder,
    folderForm,
    setFolderForm,
    folderSubmitting,
    form,
    setForm,
    fileUpload,
    setFileUpload,
    fileLink,
    setFileLink,
    dragOver,
    setDragOver,
    fileInputRef,
    rootFolders,
    getSubfolders,
    activeFolderObj,
    activeParentFolder,
    currentSubfolders,
    relatedDocuments,
    filtered,
    activeDocsCount,
    templatesCount,
    totalDownloads,
    archivedCount,
    categoryCounts,
    docTotalPages,
    pagedDocs,
    handleDownload,
    handleCopyLink,
    handleQuickMoveFolder,
    handleSubmit,
    handleArchive,
    handleDelete,
    openEdit,
    openUploadModal,
    openNewFolderModal,
    openEditFolderModal,
    handleSaveFolder,
    handleDeleteFolder,
    toggleFolderExpanded,
    handleExportCSV,
  } = useDocuments();

  const handleSelectCategory = useCallback(
    (categoryId: string) => {
      setActiveCategory(categoryId);
      setPage(1);
    },
    [setActiveCategory, setPage]
  );

  const handleFilterChangeResetPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const handleFilterActive = useCallback(() => {
    setStatusFilter("active");
    setFilterTemplate(null);
  }, [setStatusFilter, setFilterTemplate]);

  const handleFilterTemplates = useCallback(() => {
    setFilterTemplate(true);
    setStatusFilter("all");
  }, [setFilterTemplate, setStatusFilter]);

  const handleFilterArchived = useCallback(() => {
    setStatusFilter("archived");
    setFilterTemplate(null);
  }, [setStatusFilter, setFilterTemplate]);

  const handleSearchTag = useCallback(
    (tag: string) => {
      setSearch(tag);
      setSelectedDoc(null);
    },
    [setSearch, setSelectedDoc]
  );

  if (loading && documents.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading document repository...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <DocumentsHeader
          totalFiles={0}
          canManageDocs={false}
          onExportCSV={() => {}}
          onOpenUploadModal={() => {}}
          onOpenNewFolder={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Documents & Policies Repository"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <DocumentsHeader
        totalFiles={documents.length}
        canManageDocs={canManageDocs}
        onExportCSV={handleExportCSV}
        onOpenNewFolder={() => openNewFolderModal()}
        onOpenUploadModal={openUploadModal}
      />

      {/* Executive KPI Performance Bar */}
      <DocumentsMetricCards
        activeDocsCount={activeDocsCount}
        rootFoldersCount={rootFolders.length}
        subfoldersCount={folders.length - rootFolders.length}
        templatesCount={templatesCount}
        totalDownloads={totalDownloads}
        archivedCount={archivedCount}
        statusFilter={statusFilter}
        filterTemplate={filterTemplate}
        onFilterActive={handleFilterActive}
        onFilterTemplates={handleFilterTemplates}
        onFilterArchived={handleFilterArchived}
      />

      {/* Main Layout: Hierarchical Folders Sidebar + Documents Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories & Folders Tree Sidebar */}
        <FolderTreeSidebar
          rootFolders={rootFolders}
          folders={folders}
          activeCategory={activeCategory}
          expandedFolderIds={expandedFolderIds}
          categoryCounts={categoryCounts}
          canManageDocs={canManageDocs}
          filterTemplate={filterTemplate}
          onSelectCategory={handleSelectCategory}
          onToggleExpanded={toggleFolderExpanded}
          onOpenNewFolder={openNewFolderModal}
          onOpenEditFolder={openEditFolderModal}
          onDeleteFolder={handleDeleteFolder}
          onSetFilterTemplate={(val) => {
            setFilterTemplate(val);
            setPage(1);
          }}
        />

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Breadcrumb & Subfolder Navigation Bar */}
          <SubfolderBreadcrumbs
            activeCategory={activeCategory}
            activeFolderObj={activeFolderObj}
            activeParentFolder={activeParentFolder}
            currentSubfolders={currentSubfolders}
            categoryCounts={categoryCounts}
            totalFiles={filtered.length}
            canManageDocs={canManageDocs}
            onSelectCategory={handleSelectCategory}
            onOpenNewFolder={openNewFolderModal}
          />

          {/* Search, Status & View Controls Bar */}
          <FilterBar
            search={search}
            setSearch={setSearch}
            visibilityFilter={visibilityFilter}
            setVisibilityFilter={setVisibilityFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onFilterChangeResetPage={handleFilterChangeResetPage}
          />

          {/* Documents Grid / Table View */}
          {viewMode === "cards" ? (
            <DocumentsCardsView
              documents={pagedDocs}
              folders={folders}
              selectedDocId={selectedDoc?.id ?? null}
              canManageDocs={canManageDocs}
              activeCategory={activeCategory}
              onSelectDoc={setSelectedDoc}
              onOpenNewFolder={openNewFolderModal}
              onOpenUploadModal={openUploadModal}
            />
          ) : (
            <DocumentsTableView
              documents={pagedDocs}
              folders={folders}
              onSelectDoc={setSelectedDoc}
              onDownload={handleDownload}
            />
          )}

          {/* Pagination Controls */}
          <Pagination
            totalCount={filtered.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            page={page}
            setPage={setPage}
            totalPages={docTotalPages}
          />
        </div>
      </div>

      {/* Drawer: Document Inspection & Quick Actions */}
      <DocumentDrawer
        selectedDoc={selectedDoc}
        folders={folders}
        rootFolders={rootFolders}
        drawerTab={drawerTab}
        setDrawerTab={setDrawerTab}
        relatedDocuments={relatedDocuments}
        canManageDocs={canManageDocs}
        onClose={() => setSelectedDoc(null)}
        onSelectDoc={setSelectedDoc}
        onDownload={handleDownload}
        onCopyLink={handleCopyLink}
        onQuickMoveFolder={handleQuickMoveFolder}
        onOpenEdit={openEdit}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onSearchTag={handleSearchTag}
      />

      {/* Modal: Add / Edit Folder or Subfolder */}
      <FolderModal
        isOpen={showFolderModal}
        editingFolder={editingFolder}
        folderForm={folderForm}
        setFolderForm={setFolderForm}
        folders={folders}
        rootFolders={rootFolders}
        folderSubmitting={folderSubmitting}
        onClose={() => setShowFolderModal(false)}
        onSubmit={handleSaveFolder}
      />

      {/* Modal: Upload / Edit Document */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        editingDoc={editingDoc}
        form={form}
        setForm={setForm}
        fileUpload={fileUpload}
        setFileUpload={setFileUpload}
        fileLink={fileLink}
        setFileLink={setFileLink}
        dragOver={dragOver}
        setDragOver={setDragOver}
        fileInputRef={fileInputRef}
        rootFolders={rootFolders}
        getSubfolders={getSubfolders}
        submitting={submitting}
        onClose={() => setShowUploadModal(false)}
        onOpenNewFolder={() => openNewFolderModal()}
        onSubmit={handleSubmit}
      />
    </div>
  );
}