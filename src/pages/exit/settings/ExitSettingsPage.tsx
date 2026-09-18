import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useExitPermission } from "../hooks/useExitPermission";
import { useExitSettings } from "./useExitSettings";
import { ExitSettingsHeader } from "./ExitSettingsHeader";
import { ExitSettingsTabs } from "./ExitSettingsTabs";
import { ExitSettingFilterBar } from "./ExitSettingFilterBar";
import { ExitTypeTable } from "./ExitTypeTable";
import { ExitReasonTypeTable } from "./ExitReasonTypeTable";
import { ExitTypeModal } from "./ExitTypeModal";
import { ExitReasonTypeModal } from "./ExitReasonTypeModal";
import type { ExitTypeSetting, ExitReasonTypeSetting } from "./types";

export default function ExitSettingsPage() {
  const { canManageExitSettings } = useExitPermission();

  const {
    activeTab,
    setActiveTab,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredExitTypes,
    filteredReasonTypes,
    saveExitType,
    toggleExitTypeStatus,
    deleteExitType,
    saveReasonType,
    toggleReasonTypeStatus,
    deleteReasonType,
  } = useExitSettings();

  // Modals state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<ExitTypeSetting | null>(null);

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [editingReason, setEditingReason] = useState<ExitReasonTypeSetting | null>(null);

  const handleOpenAdd = useCallback(() => {
    if (activeTab === "exit-type") {
      setEditingType(null);
      setShowTypeModal(true);
    } else {
      setEditingReason(null);
      setShowReasonModal(true);
    }
  }, [activeTab]);

  const handleEditType = useCallback((item: ExitTypeSetting) => {
    setEditingType(item);
    setShowTypeModal(true);
  }, []);

  const handleEditReason = useCallback((item: ExitReasonTypeSetting) => {
    setEditingReason(item);
    setShowReasonModal(true);
  }, []);

  // Permission Guard
  if (!canManageExitSettings) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
            <i className="ri-shield-keyhole-line text-2xl" />
          </div>
          <h2 className="text-base font-bold text-gray-800 dark:text-slate-100 mb-1">
            Access Restricted
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
            Only BU CEO admin and SuperAdmin can view Exit Settings. To grant access to other roles, configure permissions in the Admin Portal.
          </p>
          <Link
            to="/exit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl hover:bg-[#1f3166] transition-colors"
          >
            <i className="ri-arrow-left-s-line text-sm" />
            Back to Exit Management
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <ExitSettingsHeader />

      {/* Navigation Tabs */}
      <ExitSettingsTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        exitTypesCount={filteredExitTypes.length}
        reasonTypesCount={filteredReasonTypes.length}
      />

      {/* Main Card Container */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xs p-5 sm:p-6">
        {/* Header Row inside card */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-[#253C7D] dark:text-sky-400">
            {activeTab === "exit-type" ? "EXIT TYPE INFO" : "REASON TYPE INFO"}
          </h2>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#253C7D] dark:border-sky-500 text-[#253C7D] dark:text-sky-400 hover:bg-[#253C7D]/5 dark:hover:bg-sky-500/10 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-add-line text-xs font-bold" />
            {activeTab === "exit-type" ? "Add Exit Type" : "Add Reason Type"}
          </button>
        </div>

        {/* Filter Toolbar */}
        <ExitSettingFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        {/* Table Content */}
        {activeTab === "exit-type" ? (
          <ExitTypeTable
            items={filteredExitTypes}
            loading={loading}
            onEdit={handleEditType}
            onToggleStatus={toggleExitTypeStatus}
            onDelete={deleteExitType}
          />
        ) : (
          <ExitReasonTypeTable
            items={filteredReasonTypes}
            loading={loading}
            onEdit={handleEditReason}
            onToggleStatus={toggleReasonTypeStatus}
            onDelete={deleteReasonType}
          />
        )}
      </div>

      {/* Modals */}
      <ExitTypeModal
        isOpen={showTypeModal}
        onClose={() => {
          setShowTypeModal(false);
          setEditingType(null);
        }}
        editing={editingType}
        saving={saving}
        onSave={saveExitType}
      />

      <ExitReasonTypeModal
        isOpen={showReasonModal}
        onClose={() => {
          setShowReasonModal(false);
          setEditingReason(null);
        }}
        editing={editingReason}
        saving={saving}
        onSave={saveReasonType}
      />
    </div>
  );
}
