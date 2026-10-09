import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useExitData } from "./hooks/useExitData";
import { useExitMutations } from "./hooks/useExitMutations";
import { useExitPermission } from "./hooks/useExitPermission";
import { useExitFormOptions } from "./hooks/useExitFormOptions";
import { ExitHeader } from "./components/ExitHeader";
import { ExitFilterBar } from "./components/ExitFilterBar";
import { ExitTable } from "./components/ExitTable";
import { ExitFormModal } from "./components/ExitFormModal";
import { ExitInterviewModal } from "./components/ExitInterviewModal";
import { exportExitCSV } from "./exports/exportExitCSV";
import { exportExitXLSX } from "./exports/exportExitXLSX";
import { EMPTY_EXIT_FORM, exitToFormState, type EmployeeExit, type ExitFormState } from "./types";

export default function ExitPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, isAdmin, isSuperAdmin, canEdit, can } = usePermissions();
  const { canManageExitSettings } = useExitPermission();
  const { exitTypes } = useExitFormOptions();
  const { isPartnerBranchBlocked, targetBranch, userBranchId, userBranchName, branches } = useBranchScope();

  const currentBranchId = targetBranch || userBranchId || null;
  const currentBranchName =
    branches.find((b) => b.id === currentBranchId)?.name || userBranchName || null;

  const actorName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.display_name as string) || user?.email || "";
  const actorRole = role?.name || (user?.user_metadata?.role as string) || "";

  const [showSalary, setShowSalary] = useState(false);
  const [filterReasonType, setFilterReasonType] = useState("all");

  const {
    filtered, loading, searchQuery, setSearchQuery,
    filterExitType, setFilterExitType, loadData,
  } = useExitData();

  const {
    saving, createExit, updateExit, deleteExit, uploadDocument,
  } = useExitMutations({ loadData, actorName, actorRole });

  const [showModal, setShowModal] = useState(false);
  const [editingExit, setEditingExit] = useState<EmployeeExit | null>(null);
  const [interviewExit, setInterviewExit] = useState<EmployeeExit | null>(null);
  const [form, setForm] = useState<ExitFormState>(EMPTY_EXIT_FORM);

  const canManage = canEdit || isAdmin || isSuperAdmin;
  const canViewEmployees = can("employees");
  const canViewChangeStatus = can("change-statuses") || can("movements") || can("employees");
  const canViewWarnings = can("warnings");
  const canViewComplaints = can("complaints");

  const handleOpenRecord = useCallback(() => {
    if (!canManage) return;
    setEditingExit(null);
    setForm(EMPTY_EXIT_FORM);
    setShowModal(true);
  }, [canManage]);

  const handleEdit = useCallback((exit: EmployeeExit) => {
    setEditingExit(exit);
    setForm(exitToFormState(exit));
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this exit record?")) {
        await deleteExit(id);
      }
    },
    [deleteExit]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const success = editingExit ? await updateExit(editingExit.id, form) : await createExit(form);
      if (success) {
        setShowModal(false);
        setEditingExit(null);
        setForm(EMPTY_EXIT_FORM);
      }
    },
    [editingExit, form, updateExit, createExit]
  );

  const handleExportCSV = useCallback(() => exportExitCSV(filtered), [filtered]);
  const handleExportXLSX = useCallback(() => exportExitXLSX(filtered), [filtered]);

  const displayedExits = filterReasonType === "all"
    ? filtered
    : filtered.filter((ex) => ex.reason_type === filterReasonType);

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 p-4 sm:p-6 font-sans">
        <PartnerBranchPrivacyShield moduleName="Exit Management" userBranchName={targetBranch || ""} hasNoBranch={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-4 sm:p-6 font-sans">
      <ExitHeader
        onRecord={handleOpenRecord}
        exits={displayedExits}
        canViewEmployees={canViewEmployees}
        canViewChangeStatus={canViewChangeStatus}
        canViewWarnings={canViewWarnings}
        canViewComplaints={canViewComplaints}
        canManage={canManage}
        canManageSettings={canManageExitSettings}
        canCreateExit={canManage}
        onOpenSettings={() => navigate("/exit/settings")}
      />

      <ExitFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterExitType={filterExitType}
        setFilterExitType={setFilterExitType}
        filterReasonType={filterReasonType}
        setFilterReasonType={setFilterReasonType}
        showSalary={showSalary}
        onToggleSalary={() => setShowSalary(!showSalary)}
        onExportCSV={handleExportCSV}
        onExportXLSX={handleExportXLSX}
        exitTypeOptions={exitTypes}
      />

      <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-hidden">
        <ExitTable
          exits={displayedExits}
          loading={loading}
          showSalary={showSalary}
          canManage={canManage}
          canCreateExit={canManage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRecord={handleOpenRecord}
          onInterview={(ex) => setInterviewExit(ex)}
        />
      </div>

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

      {interviewExit && (
        <ExitInterviewModal
          isOpen={Boolean(interviewExit)}
          onClose={() => setInterviewExit(null)}
          exitItem={interviewExit}
        />
      )}
    </div>
  );
}


