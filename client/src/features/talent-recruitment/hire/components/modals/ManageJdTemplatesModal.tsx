import { memo } from "react";
import type { JobDescriptionTemplate } from "../../types";
import { useManageJdTemplates } from "./jd-templates/useManageJdTemplates";
import { ManageJdTemplateList } from "./jd-templates/ManageJdTemplateList";
import { ManageJdTemplateEditor } from "./jd-templates/ManageJdTemplateEditor";
import { ManageJdTemplatePreview } from "./jd-templates/ManageJdTemplatePreview";
import { ManageJdTemplateDeleteDialog } from "./jd-templates/ManageJdTemplateDeleteDialog";

interface ManageJdTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: JobDescriptionTemplate[];
  onRefresh: () => Promise<void>;
  onSelectTemplate?: (templateId: string) => void;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
}

export const ManageJdTemplatesModal = memo(function ManageJdTemplatesModal({
  isOpen,
  onClose,
  templates,
  onRefresh,
  onSelectTemplate,
  isSuperAdmin = true,
  isAdmin = false,
}: ManageJdTemplatesModalProps) {
  const m = useManageJdTemplates(templates, onRefresh, onSelectTemplate, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1E3064] text-white flex items-center justify-between gap-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 text-xl shrink-0">
              <i className="ri-book-open-line" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Job Description (JD) Library &amp; Templates</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  {isSuperAdmin ? "Super Admin Control" : isAdmin ? "Admin Control" : "JD Master Library"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Centralized library of standardized position job descriptions across all business units
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={m.handleStartCreate}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-add-line text-sm" />
              <span>Create New JD</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close"
            >
              <i className="ri-close-line text-base" />
            </button>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          <ManageJdTemplateList
            searchQuery={m.searchQuery}
            setSearchQuery={m.setSearchQuery}
            selectedDept={m.selectedDept}
            setSelectedDept={m.setSelectedDept}
            departments={m.departments}
            totalCount={templates.length}
            filteredTemplates={m.filteredTemplates}
            selectedTemplateId={m.selectedTemplateId}
            isCreatingNew={m.isCreatingNew}
            onSelect={(id) => {
              m.setSelectedTemplateId(id);
              m.setIsEditing(false);
              m.setIsCreatingNew(false);
            }}
            onEdit={m.handleStartEdit}
            onDeleteConfirm={(id) => m.setDeleteConfirmId(id)}
          />

          <div className="flex-1 bg-white flex flex-col overflow-hidden">
            {m.isEditing ? (
              <ManageJdTemplateEditor
                isCreatingNew={m.isCreatingNew}
                editForm={m.editForm}
                setEditForm={m.setEditForm}
                saving={m.saving}
                onCancel={() => {
                  m.setIsEditing(false);
                  m.setIsCreatingNew(false);
                }}
                onSubmit={m.handleSaveTemplate}
              />
            ) : (
              <ManageJdTemplatePreview
                selectedTemplate={m.selectedTemplate}
                onApply={onSelectTemplate ? m.handleApply : undefined}
                onEdit={m.handleStartEdit}
                onDeleteConfirm={(id) => m.setDeleteConfirmId(id)}
                onCreateNew={m.handleStartCreate}
              />
            )}
          </div>
        </div>

        <ManageJdTemplateDeleteDialog
          deleteConfirmId={m.deleteConfirmId}
          deleting={m.deleting}
          onCancel={() => m.setDeleteConfirmId(null)}
          onConfirm={m.handleDeleteTemplate}
        />
      </div>
    </div>
  );
});
