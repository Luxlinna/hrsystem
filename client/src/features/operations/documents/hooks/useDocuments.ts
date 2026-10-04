import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { Document, DrawerTabKey } from "../types";
import { useDocumentsData } from "./useDocumentsData";
import { useFolderHierarchy } from "./useFolderHierarchy";
import { useDocumentsFilters } from "./useDocumentsFilters";
import { useDocumentMutations } from "./useDocumentMutations";
import { useFolderMutations } from "./useFolderMutations";

export function useDocuments() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin, isBranchAdmin } = usePermissions();
  const roleName = role?.name || "Staff";
  const { isSuperAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const canManageDocs =
    (isAdmin || isBranchAdmin || (!!role && !["Employee", "Staff", "Chairman"].includes(role.name))) &&
    !isPartnerBranchBlocked;

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTabKey>("overview");

  const data = useDocumentsData({
    isPartnerBranchBlocked,
    targetBranch,
    canManageDocs,
    selectedDocId: selectedDoc?.id,
    setSelectedDoc,
  });

  const filters = useDocumentsFilters({
    documents: data.documents,
    folders: data.folders,
  });

  const hierarchy = useFolderHierarchy({
    documents: data.documents,
    folders: data.folders,
    activeCategory: filters.activeCategory,
    selectedDoc,
  });

  const docMutations = useDocumentMutations({
    actorName,
    roleName,
    targetBranch,
    loadData: data.loadData,
    selectedDoc,
    setSelectedDoc,
    activeCategory: filters.activeCategory,
  });

  const folderMutations = useFolderMutations({
    actorName,
    roleName,
    targetBranch,
    loadData: data.loadData,
    folders: data.folders,
    activeCategory: filters.activeCategory,
    setActiveCategory: filters.setActiveCategory,
    setExpandedFolderIds: hierarchy.setExpandedFolderIds,
  });

  useEffect(() => {
    setDrawerTab("overview");
  }, [selectedDoc?.id]);

  return {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    effectiveBranchId,
    isSuperAdmin,
    canManageDocs,
    documents: data.documents,
    folders: data.folders,
    expandedFolderIds: hierarchy.expandedFolderIds,
    loading: data.loading,
    activeCategory: filters.activeCategory,
    setActiveCategory: filters.setActiveCategory,
    search: filters.search,
    setSearch: filters.setSearch,
    filterTemplate: filters.filterTemplate,
    setFilterTemplate: filters.setFilterTemplate,
    statusFilter: filters.statusFilter,
    setStatusFilter: filters.setStatusFilter,
    visibilityFilter: filters.visibilityFilter,
    setVisibilityFilter: filters.setVisibilityFilter,
    viewMode: filters.viewMode,
    setViewMode: filters.setViewMode,
    pageSize: filters.pageSize,
    setPageSize: filters.setPageSize,
    page: filters.page,
    setPage: filters.setPage,
    selectedDoc,
    setSelectedDoc,
    drawerTab,
    setDrawerTab,
    showUploadModal: docMutations.showUploadModal,
    setShowUploadModal: docMutations.setShowUploadModal,
    editingDoc: docMutations.editingDoc,
    submitting: docMutations.submitting,
    showFolderModal: folderMutations.showFolderModal,
    setShowFolderModal: folderMutations.setShowFolderModal,
    editingFolder: folderMutations.editingFolder,
    folderForm: folderMutations.folderForm,
    setFolderForm: folderMutations.setFolderForm,
    folderSubmitting: folderMutations.folderSubmitting,
    form: docMutations.form,
    setForm: docMutations.setForm,
    fileUpload: docMutations.fileUpload,
    setFileUpload: docMutations.setFileUpload,
    fileLink: docMutations.fileLink,
    setFileLink: docMutations.setFileLink,
    dragOver: docMutations.dragOver,
    setDragOver: docMutations.setDragOver,
    fileInputRef: docMutations.fileInputRef,
    rootFolders: hierarchy.rootFolders,
    getSubfolders: hierarchy.getSubfolders,
    activeFolderObj: hierarchy.activeFolderObj,
    activeParentFolder: hierarchy.activeParentFolder,
    currentSubfolders: hierarchy.currentSubfolders,
    relatedDocuments: hierarchy.relatedDocuments,
    filtered: filters.filtered,
    activeDocsCount: filters.activeDocsCount,
    templatesCount: filters.templatesCount,
    totalDownloads: filters.totalDownloads,
    archivedCount: filters.archivedCount,
    categoryCounts: hierarchy.categoryCounts,
    docTotalPages: filters.docTotalPages,
    pagedDocs: filters.pagedDocs,
    handleDownload: data.handleDownload,
    handleCopyLink: data.handleCopyLink,
    handleQuickMoveFolder: docMutations.handleQuickMoveFolder,
    handleSubmit: docMutations.handleSubmit,
    handleArchive: docMutations.handleArchive,
    handleDelete: docMutations.handleDelete,
    openEdit: docMutations.openEdit,
    openUploadModal: docMutations.openUploadModal,
    openNewFolderModal: folderMutations.openNewFolderModal,
    openEditFolderModal: folderMutations.openEditFolderModal,
    handleSaveFolder: folderMutations.handleSaveFolder,
    handleDeleteFolder: folderMutations.handleDeleteFolder,
    toggleFolderExpanded: hierarchy.toggleFolderExpanded,
    handleExportCSV: filters.handleExportCSV,
  };
}
