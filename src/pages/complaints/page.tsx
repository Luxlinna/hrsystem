import React, { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

import { useComplaintsData } from "./hooks/useComplaintsData";
import { useComplaintMutations } from "./hooks/useComplaintMutations";
import { ComplaintHeader } from "./components/ComplaintHeader";
import { ComplaintStatsRow } from "./components/ComplaintStatsRow";
import { ComplaintFilterBar } from "./components/ComplaintFilterBar";
import { ComplaintTable } from "./components/ComplaintTable";
import { ComplaintModal } from "./components/ComplaintModal";
import { exportComplaintCSV } from "./exports/exportComplaintCSV";
import { exportComplaintXLSX } from "./exports/exportComplaintXLSX";
import {
  EMPTY_COMPLAINT_FORM,
  type ComplaintSuggestion,
  type ComplaintFormState,
  type ComplaintStatus,
} from "./types";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const { isPartnerBranchBlocked, targetBranch, userBranchId, userBranchName, branches } =
    useBranchScope();

  const currentBranchId = targetBranch || userBranchId || null;
  const currentBranchName =
    branches.find((b) => b.id === currentBranchId)?.name || userBranchName || null;

  const actorName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.display_name as string) ||
    user?.email ||
    "";
  const actorRole = role?.name || (user?.user_metadata?.role as string) || "";

  // Data hook
  const {
    filtered,
    loading,
    stats,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    loadData,
  } = useComplaintsData();

  // Mutations hook
  const {
    saving,
    createComplaint,
    updateComplaint,
    updateStatus,
    deleteComplaint,
    uploadDocument,
  } = useComplaintMutations({ loadData, actorName, actorRole });

  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ComplaintSuggestion | null>(null);
  const [form, setForm] = useState<ComplaintFormState>(EMPTY_COMPLAINT_FORM);

  // Open modal to create
  const handleOpenNew = useCallback(() => {
    setEditingRecord(null);
    setForm(EMPTY_COMPLAINT_FORM);
    setShowModal(true);
  }, []);

  // Open modal to edit
  const handleEdit = useCallback((record: ComplaintSuggestion) => {
    setEditingRecord(record);
    setForm({
      employee_id: record.employee_id || "",
      type: record.type,
      entry_date: record.entry_date,
      target_to: record.target_to,
      subject: record.subject,
      details: record.details,
      suggestion: record.suggestion || "",
      remark: record.remark || "",
      status: record.status,
      attachment_url: record.attachment_url || "",
      attachment_name: record.attachment_name || "",
    });
    setShowModal(true);
  }, []);

  // Delete
  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this record?")) {
        await deleteComplaint(id);
      }
    },
    [deleteComplaint]
  );

  // Submit modal form
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      let success = false;
      if (editingRecord) {
        success = await updateComplaint(editingRecord.id, form);
      } else {
        if (!currentBranchId) {
          alert("No Business Unit assigned.");
          return;
        }
        success = await createComplaint(form, currentBranchId);
      }
      if (success) {
        setShowModal(false);
        setEditingRecord(null);
        setForm(EMPTY_COMPLAINT_FORM);
      }
    },
    [editingRecord, form, currentBranchId, updateComplaint, createComplaint]
  );

  // Exports
  const handleExportCSV = useCallback(() => {
    exportComplaintCSV(filtered);
  }, [filtered]);

  const handleExportXLSX = useCallback(() => {
    exportComplaintXLSX(filtered);
  }, [filtered]);

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <PartnerBranchPrivacyShield
          moduleName="Complaints & Suggestions"
          userBranchName={currentBranchName || ""}
          hasNoBranch={false}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Header */}
      <ComplaintHeader
        onNew={handleOpenNew}
        onExportCSV={handleExportCSV}
        onExportXLSX={handleExportXLSX}
      />

      {/* Stats Cards */}
      <ComplaintStatsRow stats={stats} />

      {/* Filters Bar */}
      <ComplaintFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterDateFrom={filterDateFrom}
        setFilterDateFrom={setFilterDateFrom}
        filterDateTo={filterDateTo}
        setFilterDateTo={setFilterDateTo}
      />

      {/* Table */}
      <ComplaintTable
        records={filtered}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateStatus={updateStatus}
        onNew={handleOpenNew}
      />

      {/* Modal */}
      <ComplaintModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingRecord(null);
          setForm(EMPTY_COMPLAINT_FORM);
        }}
        editing={editingRecord}
        form={form}
        setForm={setForm}
        saving={saving}
        onSubmit={handleSubmit}
        onUploadDocument={uploadDocument}
        branchName={currentBranchName}
      />
    </div>
  );
}
