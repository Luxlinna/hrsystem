import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

import { useExitData } from "./hooks/useExitData";
import { useExitMutations } from "./hooks/useExitMutations";
import { useExitPermission } from "./hooks/useExitPermission";
import { ExitHeader } from "./components/ExitHeader";
import { ExitStatsRow } from "./components/ExitStatsRow";
import { ExitFilterBar } from "./components/ExitFilterBar";
import { ExitTable } from "./components/ExitTable";
import { ExitFormModal } from "./components/ExitFormModal";
import { exportExitCSV } from "./exports/exportExitCSV";
import { exportExitXLSX } from "./exports/exportExitXLSX";
import { EMPTY_EXIT_FORM, exitToFormState, type EmployeeExit, type ExitFormState } from "./types";

export default function ExitPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = usePermissions();
  const { canManageExitSettings } = useExitPermission();
  const { isPartnerBranchBlocked, targetBranch, userBranchId, userBranchName, branches } = useBranchScope();

  const currentBranchId = targetBranch || userBranchId || null;
  const currentBranchName =
    branches.find((b) => b.id === currentBranchId)?.name || userBranchName || null;

  const actorName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.display_name as string) || user?.email || "";
  const actorRole = role?.name || (user?.user_metadata?.role as string) || "";

  // Data hook
  const {
    filtered,
    loading,
    stats,
    searchQuery,
    setSearchQuery,
    filterExitType,
    setFilterExitType,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    loadData,
  } = useExitData();

  // Mutations hook
  const {
    saving,
    createExit,
    updateExit,
    deleteExit,
    uploadDocument,
  } = useExitMutations({ loadData, actorName, actorRole });

  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [editingExit, setEditingExit] = useState<EmployeeExit | null>(null);
  const [form, setForm] = useState<ExitFormState>(EMPTY_EXIT_FORM);

  // Open modal to create
  const handleOpenRecord = useCallback(() => {
    setEditingExit(null);
    setForm(EMPTY_EXIT_FORM);
    setShowModal(true);
  }, []);

  // Open modal to edit
  const handleEdit = useCallback((exit: EmployeeExit) => {
    setEditingExit(exit);
    setForm(exitToFormState(exit));
    setShowModal(true);
  }, []);

  // Delete
  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this exit record?")) {
        await deleteExit(id);
      }
    },
    [deleteExit]
  );

  // Submit modal form
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      let success = false;
      if (editingExit) {
        success = await updateExit(editingExit.id, form);
      } else {
        success = await createExit(form);
      }
      if (success) {
        setShowModal(false);
        setEditingExit(null);
        setForm(EMPTY_EXIT_FORM);
      }
    },
    [editingExit, form, updateExit, createExit]
  );

  // Exports
  const handleExportCSV = useCallback(() => exportExitCSV(filtered), [filtered]);
  const handleExportXLSX = useCallback(() => exportExitXLSX(filtered), [filtered]);

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <PartnerBranchPrivacyShield
          moduleName="Exit Management"
          userBranchName={targetBranch || ""}
          hasNoBranch={false}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Header */}
      <ExitHeader
        onRecord={handleOpenRecord}
        exits={filtered}
        onExportCSV={handleExportCSV}
        onExportXLSX={handleExportXLSX}
        canManageSettings={canManageExitSettings}
        onOpenSettings={() => navigate("/exit/settings")}
      />

      {/* Stats Cards */}
      <ExitStatsRow
        total={stats.total}
        thisMonth={stats.thisMonth}
        resignations={stats.resignations}
        terminations={stats.terminations}
      />

      {/* Filters Bar */}
      <ExitFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterExitType={filterExitType}
        setFilterExitType={setFilterExitType}
        filterDateFrom={filterDateFrom}
        setFilterDateFrom={setFilterDateFrom}
        filterDateTo={filterDateTo}
        setFilterDateTo={setFilterDateTo}
      />

      {/* Exits Table */}
      <ExitTable
        exits={filtered}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRecord={handleOpenRecord}
      />

      {/* Form Modal */}
      <ExitFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingExit(null);
          setForm(EMPTY_EXIT_FORM);
        }}
        editing={editingExit}
        form={form}
        setForm={setForm}
        saving={saving}
        onSubmit={handleSubmit}
        onUploadDocument={uploadDocument}
        branchId={currentBranchId}
        branchName={currentBranchName}
      />
    </div>
  );
}
