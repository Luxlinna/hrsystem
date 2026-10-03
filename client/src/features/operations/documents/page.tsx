import { useDocuments } from "./hooks/useDocuments";
import { DocumentsHeader } from "./components/DocumentsHeader";
import { DocumentsMetricCards } from "./components/DocumentsMetricCards";
import { FolderTreeSidebar } from "./components/FolderTreeSidebar";
import { DocumentsMainContent } from "./components/DocumentsMainContent";
import { DocumentDrawer } from "./components/DocumentDrawer";
import { FolderModal } from "./components/FolderModal";
import { DocumentUploadModal } from "./components/DocumentUploadModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

export default function DocumentsPage() {
  const d = useDocuments();

  if (d.loading && d.documents.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading document repository...</p>
      </div>
    );
  }

  if (d.isPartnerBranchBlocked) {
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
          userBranchName={d.userBranchName}
          hasNoBranch={!d.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      <DocumentsHeader
        totalFiles={d.documents.length}
        canManageDocs={d.canManageDocs}
        onExportCSV={d.handleExportCSV}
        onOpenNewFolder={() => d.openNewFolderModal()}
        onOpenUploadModal={d.openUploadModal}
      />

      <DocumentsMetricCards
        activeDocsCount={d.activeDocsCount}
        rootFoldersCount={d.rootFolders.length}
        subfoldersCount={d.folders.length - d.rootFolders.length}
        templatesCount={d.templatesCount}
        totalDownloads={d.totalDownloads}
        archivedCount={d.archivedCount}
        statusFilter={d.statusFilter}
        filterTemplate={d.filterTemplate}
        onFilterActive={() => {
          d.setStatusFilter("active");
          d.setFilterTemplate(null);
        }}
        onFilterTemplates={() => {
          d.setFilterTemplate(true);
          d.setStatusFilter("all");
        }}
        onFilterArchived={() => {
          d.setStatusFilter("archived");
          d.setFilterTemplate(null);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <FolderTreeSidebar
          rootFolders={d.rootFolders}
          folders={d.folders}
          activeCategory={d.activeCategory}
          expandedFolderIds={d.expandedFolderIds}
          categoryCounts={d.categoryCounts}
          canManageDocs={d.canManageDocs}
          filterTemplate={d.filterTemplate}
          onSelectCategory={(cat) => {
            d.setActiveCategory(cat);
            d.setPage(1);
          }}
          onToggleExpanded={d.toggleFolderExpanded}
          onOpenNewFolder={d.openNewFolderModal}
          onOpenEditFolder={d.openEditFolderModal}
          onDeleteFolder={d.handleDeleteFolder}
          onSetFilterTemplate={(val) => {
            d.setFilterTemplate(val);
            d.setPage(1);
          }}
        />

        <DocumentsMainContent
          activeCategory={d.activeCategory}
          activeFolderObj={d.activeFolderObj}
          activeParentFolder={d.activeParentFolder}
          currentSubfolders={d.currentSubfolders}
          categoryCounts={d.categoryCounts}
          filteredCount={d.filtered.length}
          canManageDocs={d.canManageDocs}
          onSelectCategory={(cat) => {
            d.setActiveCategory(cat);
            d.setPage(1);
          }}
          onOpenNewFolder={d.openNewFolderModal}
          search={d.search}
          setSearch={d.setSearch}
          visibilityFilter={d.visibilityFilter}
          setVisibilityFilter={d.setVisibilityFilter}
          statusFilter={d.statusFilter}
          setStatusFilter={d.setStatusFilter}
          viewMode={d.viewMode}
          setViewMode={d.setViewMode}
          onFilterChangeResetPage={() => d.setPage(1)}
          pagedDocs={d.pagedDocs}
          folders={d.folders}
          selectedDocId={d.selectedDoc?.id ?? null}
          onSelectDoc={d.setSelectedDoc}
          onOpenUploadModal={d.openUploadModal}
          onDownload={d.handleDownload}
          pageSize={d.pageSize}
          setPageSize={d.setPageSize}
          page={d.page}
          setPage={d.setPage}
          totalPages={d.docTotalPages}
        />
      </div>

      <DocumentDrawer
        selectedDoc={d.selectedDoc}
        folders={d.folders}
        rootFolders={d.rootFolders}
        drawerTab={d.drawerTab}
        setDrawerTab={d.setDrawerTab}
        relatedDocuments={d.relatedDocuments}
        canManageDocs={d.canManageDocs}
        onClose={() => d.setSelectedDoc(null)}
        onSelectDoc={d.setSelectedDoc}
        onDownload={d.handleDownload}
        onCopyLink={d.handleCopyLink}
        onQuickMoveFolder={d.handleQuickMoveFolder}
        onOpenEdit={d.openEdit}
        onArchive={d.handleArchive}
        onDelete={d.handleDelete}
        onSearchTag={(tag) => {
          d.setSearch(tag);
          d.setSelectedDoc(null);
        }}
      />

      <FolderModal
        isOpen={d.showFolderModal}
        editingFolder={d.editingFolder}
        folderForm={d.folderForm}
        setFolderForm={d.setFolderForm}
        folders={d.folders}
        rootFolders={d.rootFolders}
        folderSubmitting={d.folderSubmitting}
        onClose={() => d.setShowFolderModal(false)}
        onSubmit={d.handleSaveFolder}
      />

      <DocumentUploadModal
        isOpen={d.showUploadModal}
        editingDoc={d.editingDoc}
        form={d.form}
        setForm={d.setForm}
        fileUpload={d.fileUpload}
        setFileUpload={d.setFileUpload}
        fileLink={d.fileLink}
        setFileLink={d.setFileLink}
        dragOver={d.dragOver}
        setDragOver={d.setDragOver}
        fileInputRef={d.fileInputRef}
        rootFolders={d.rootFolders}
        getSubfolders={d.getSubfolders}
        submitting={d.submitting}
        onClose={() => d.setShowUploadModal(false)}
        onOpenNewFolder={() => d.openNewFolderModal()}
        onSubmit={d.handleSubmit}
      />
    </div>
  );
}