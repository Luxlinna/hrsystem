import { memo } from "react";
import type { JobDescriptionTemplate } from "../../../types";

interface ManageJdTemplatePreviewProps {
  selectedTemplate: JobDescriptionTemplate | null;
  onApply?: (tpl: JobDescriptionTemplate) => void;
  onEdit: (tpl: JobDescriptionTemplate) => void;
  onDeleteConfirm: (id: string) => void;
  onCreateNew: () => void;
}

export const ManageJdTemplatePreview = memo(function ManageJdTemplatePreview({
  selectedTemplate,
  onApply,
  onEdit,
  onDeleteConfirm,
  onCreateNew,
}: ManageJdTemplatePreviewProps) {
  if (!selectedTemplate) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <i className="ri-book-read-line text-4xl text-slate-300 mb-2" />
        <h4 className="text-sm font-bold text-slate-700">No Template Selected</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Select a Job Description template from the left list to preview, or create a brand new template.
        </p>
        <button
          type="button"
          onClick={onCreateNew}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
        >
          Create New Template
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 truncate">{selectedTemplate.title}</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              {selectedTemplate.department || "General"}
            </span>
            {selectedTemplate.version && (
              <span className="text-[10px] text-slate-400 font-mono">v{selectedTemplate.version}</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedTemplate.business_unit || "OPS SOLUTIONS CO., LTD"}{" "}
            {selectedTemplate.reporting_line ? `• ${selectedTemplate.reporting_line}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onApply && (
            <button
              type="button"
              onClick={() => onApply(selectedTemplate)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-check-line text-sm" />
              <span>Apply to Form</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(selectedTemplate)}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-edit-line text-xs" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteConfirm(selectedTemplate.id)}
            className="p-1.5 rounded-xl hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete template"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {selectedTemplate.job_summary && (
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <i className="ri-file-text-line text-blue-600" />
              <span>Job Summary &amp; Purpose</span>
            </h4>
            <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
              {selectedTemplate.job_summary}
            </p>
          </div>
        )}

        {selectedTemplate.responsibilities && (
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <i className="ri-list-check-2 text-indigo-600" />
              <span>Key Responsibilities</span>
            </h4>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 text-xs text-slate-800 space-y-1">
              {selectedTemplate.responsibilities.split("\n").map((line, i) => (
                <p key={i} className="leading-relaxed">
                  {line.startsWith("•") || line.startsWith("-") ? line : `• ${line}`}
                </p>
              ))}
            </div>
          </div>
        )}

        {selectedTemplate.requirements && (
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <i className="ri-medal-line text-amber-600" />
              <span>Requirements &amp; Core Skills</span>
            </h4>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 text-xs text-slate-800 space-y-1">
              {selectedTemplate.requirements.split("\n").map((line, i) => (
                <p key={i} className="leading-relaxed">
                  {line.startsWith("•") || line.startsWith("-") ? line : `• ${line}`}
                </p>
              ))}
            </div>
          </div>
        )}

        {selectedTemplate.qualifications && (
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <i className="ri-graduation-cap-line text-emerald-600" />
              <span>Qualifications &amp; Education</span>
            </h4>
            <p className="text-xs text-slate-800 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
              {selectedTemplate.qualifications}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
