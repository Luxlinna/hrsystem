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
import { CreateComplaintForm } from "./components/CreateComplaintForm";
import { exportComplaintCSV } from "./exports/exportComplaintCSV";
import { exportComplaintXLSX } from "./exports/exportComplaintXLSX";
import {
  EMPTY_COMPLAINT_FORM,
  type ComplaintSuggestion,
  type ComplaintFormState,
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

  const {
    saving,
    createComplaint,
    updateComplaint,
    updateStatus,
    deleteComplaint,
    uploadDocument,
  } = useComplaintMutations({ loadData, actorName, actorRole });

  // View Mode: "table" | "form"
  const [viewMode, setViewMode] = useState<"table" | "form">("table");
  const [editingRecord, setEditingRecord] = useState<ComplaintSuggestion | null>(null);
  const [form, setForm] = useState<ComplaintFormState>(EMPTY_COMPLAINT_FORM);

  const handleOpenNew = useCallback(() => {
    setEditingRecord(null);
    setForm({
      ...EMPTY_COMPLAINT_FORM,
      target_category: "Business Unit",
      target_to: currentBranchName || "Business Unit",
    });
    setViewMode("form");
  }, [currentBranchName]);

  const handleEdit = useCallback((record: ComplaintSuggestion) => {
    setEditingRecord(record);
    setForm({
      employee_id: record.employee_id || "",
      type: record.type,
      entry_date: record.entry_date,
      target_to: record.target_to,
      target_category: record.target_category || "Business Unit",
      show_identity: record.show_identity ?? true,
      subject: record.subject,
      details: record.details,
      suggestion: record.suggestion || "",
      remark: record.remark || "",
      status: record.status,
      attachment_url: record.attachment_url || "",
      attachment_name: record.attachment_name || "",
    });
    setViewMode("form");
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Are you sure you want to delete this record?")) {
        await deleteComplaint(id);
      }
    },
    [deleteComplaint]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent, shouldClose: boolean = false) => {
      e.preventDefault();
      if (editingRecord) {
        const success = await updateComplaint(editingRecord.id, form);
        if (success && shouldClose) {
          setViewMode("table");
          setEditingRecord(null);
          setForm(EMPTY_COMPLAINT_FORM);
        }
      } else {
        if (!currentBranchId) {
          alert("No Business Unit assigned.");
          return;
        }
        const createdId = await createComplaint(form, currentBranchId);
        if (createdId) {
          if (shouldClose) {
            setViewMode("table");
            setEditingRecord(null);
            setForm(EMPTY_COMPLAINT_FORM);
          } else {
            // keep form open in edit mode for subsequent saves
            setEditingRecord({ ...form, id: createdId } as any);
          }
        }
      }
    },
    [editingRecord, form, currentBranchId, updateComplaint, createComplaint]
  );

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

  if (viewMode === "form") {
    return (
      <CreateComplaintForm
        form={form}
        setForm={setForm}
        editingRecord={editingRecord}
        saving={saving}
        branchId={currentBranchId}
        branchName={currentBranchName}
        onBack={() => {
          setViewMode("table");
          setEditingRecord(null);
          setForm(EMPTY_COMPLAINT_FORM);
        }}
        onSubmit={handleSubmit}
        onUploadDocument={uploadDocument}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      <ComplaintHeader
        onNew={handleOpenNew}
        onExportCSV={() => exportComplaintCSV(filtered)}
        onExportXLSX={() => exportComplaintXLSX(filtered)}
      />
      <ComplaintStatsRow stats={stats} />
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
      <ComplaintTable
        records={filtered}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateStatus={updateStatus}
        onNew={handleOpenNew}
      />
    </div>
  );
}
