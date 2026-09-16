import React, { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { WarningFileViewerModal } from "@/pages/disciplinary/components/WarningFileViewerModal";

import { useComplaintsData } from "./hooks/useComplaintsData";
import { useComplaintMutations } from "./hooks/useComplaintMutations";
import { ComplaintHeader } from "./components/ComplaintHeader";
import { ComplaintStatsRow } from "./components/ComplaintStatsRow";
import { ComplaintFilterBar } from "./components/ComplaintFilterBar";
import { ComplaintTable } from "./components/ComplaintTable";
import { ComplaintCardsView } from "./components/ComplaintCardsView";
import { ComplaintDetailModal } from "./components/ComplaintDetailModal";
import { CreateComplaintForm } from "./components/CreateComplaintForm";
import { exportComplaintCSV } from "./exports/exportComplaintCSV";
import { exportComplaintXLSX } from "./exports/exportComplaintXLSX";
import { EMPTY_COMPLAINT_FORM, type ComplaintSuggestion, type ComplaintFormState } from "./types";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const { isPartnerBranchBlocked, targetBranch, userBranchId, userBranchName, branches } = useBranchScope();

  const currentBranchId = targetBranch || userBranchId || null;
  const currentBranchName = branches.find((b) => b.id === currentBranchId)?.name || userBranchName || null;
  const actorName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.display_name as string) || user?.email || "";
  const actorRole = role?.name || (user?.user_metadata?.role as string) || "";

  const {
    filtered, loading, stats, searchQuery, setSearchQuery, filterType, setFilterType,
    filterStatus, setFilterStatus, filterDateFrom, setFilterDateFrom, filterDateTo, setFilterDateTo, loadData,
  } = useComplaintsData();

  const { saving, createComplaint, updateComplaint, updateStatus, deleteComplaint, uploadDocument } =
    useComplaintMutations({ loadData, actorName, actorRole });

  const [viewMode, setViewMode] = useState<"table" | "form">("table");
  const [listMode, setListMode] = useState<"table" | "cards">("table");
  const [editingRecord, setEditingRecord] = useState<ComplaintSuggestion | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ComplaintSuggestion | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [form, setForm] = useState<ComplaintFormState>(EMPTY_COMPLAINT_FORM);

  const handleOpenNew = useCallback(() => {
    setEditingRecord(null);
    setForm({ ...EMPTY_COMPLAINT_FORM, target_category: "Business Unit", target_to: currentBranchName || "Business Unit" });
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

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteComplaint(id);
      if (selectedRecord?.id === id) setSelectedRecord(null);
    }
  }, [deleteComplaint, selectedRecord]);

  const handleSubmit = useCallback(async (e: React.FormEvent, shouldClose: boolean = false) => {
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
          setEditingRecord({ ...form, id: createdId } as any);
        }
      }
    }
  }, [editingRecord, form, currentBranchId, updateComplaint, createComplaint]);

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <PartnerBranchPrivacyShield moduleName="Complaints & Suggestions" userBranchName={currentBranchName || ""} hasNoBranch={false} />
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
        onBack={() => { setViewMode("table"); setEditingRecord(null); setForm(EMPTY_COMPLAINT_FORM); }}
        onSubmit={handleSubmit}
        onUploadDocument={uploadDocument}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      <ComplaintHeader
        viewMode={listMode}
        onViewModeChange={setListMode}
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

      {listMode === "table" ? (
        <ComplaintTable
          records={filtered}
          loading={loading}
          onSelect={setSelectedRecord}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateStatus={updateStatus}
          onPreviewAttachment={(url, name) => setPreviewDoc({ url, name })}
          onNew={handleOpenNew}
        />
      ) : (
        <ComplaintCardsView
          records={filtered}
          loading={loading}
          onSelect={setSelectedRecord}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateStatus={updateStatus}
          onPreviewAttachment={(url, name) => setPreviewDoc({ url, name })}
          onNew={handleOpenNew}
        />
      )}

      <ComplaintDetailModal
        item={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onEdit={(rec) => { setSelectedRecord(null); handleEdit(rec); }}
        onDelete={handleDelete}
        onUpdateStatus={updateStatus}
        onPreviewAttachment={(url, name) => setPreviewDoc({ url, name })}
      />

      {previewDoc && (
        <WarningFileViewerModal
          url={previewDoc.url}
          fileName={previewDoc.name}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
