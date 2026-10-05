import { memo } from "react";
import type { JdTemplateFormData } from "./useManageJdTemplates";

interface ManageJdTemplateEditorProps {
  isCreatingNew: boolean;
  editForm: JdTemplateFormData;
  setEditForm: React.Dispatch<React.SetStateAction<JdTemplateFormData>>;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ManageJdTemplateEditor = memo(function ManageJdTemplateEditor({
  isCreatingNew,
  editForm,
  setEditForm,
  saving,
  onCancel,
  onSubmit,
}: ManageJdTemplateEditorProps) {
  return (
    <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {isCreatingNew ? "Create New JD Template" : `Edit Template: ${editForm.title}`}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Cancel Editing
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Job Position Title *
            </label>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="e.g. Senior Talent Acquisition Specialist"
              className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Department
            </label>
            <input
              type="text"
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              placeholder="e.g. Human Resources"
              className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Business Unit / Company
            </label>
            <input
              type="text"
              value={editForm.business_unit}
              onChange={(e) => setEditForm({ ...editForm, business_unit: e.target.value })}
              placeholder="e.g. OPS SOLUTIONS CO., LTD"
              className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Reporting Line
            </label>
            <input
              type="text"
              value={editForm.reporting_line}
              onChange={(e) => setEditForm({ ...editForm, reporting_line: e.target.value })}
              placeholder="e.g. Reports to: Head of Talent Acquisition"
              className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Job Summary / Purpose
          </label>
          <textarea
            rows={3}
            value={editForm.job_summary}
            onChange={(e) => setEditForm({ ...editForm, job_summary: e.target.value })}
            placeholder="Brief summary of the role's mission and scope..."
            className="w-full p-3 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Key Responsibilities (One item per line)
            </label>
            <textarea
              rows={5}
              value={editForm.responsibilities}
              onChange={(e) => setEditForm({ ...editForm, responsibilities: e.target.value })}
              placeholder="• Lead end-to-end recruitment cycle&#10;• Partner with hiring managers&#10;• Screen and interview top talent"
              className="w-full p-3 text-xs text-slate-800 font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Skills &amp; Requirements (One item per line)
            </label>
            <textarea
              rows={5}
              value={editForm.requirements}
              onChange={(e) => setEditForm({ ...editForm, requirements: e.target.value })}
              placeholder="• 3+ years experience in recruiting&#10;• Strong communication skills&#10;• Proficient in ATS and job boards"
              className="w-full p-3 text-xs text-slate-800 font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Qualifications &amp; Education
          </label>
          <textarea
            rows={3}
            value={editForm.qualifications}
            onChange={(e) => setEditForm({ ...editForm, qualifications: e.target.value })}
            placeholder="• Bachelor's Degree in Human Resources, Business, or related field"
            className="w-full p-3 text-xs text-slate-800 font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving && <i className="ri-loader-4-line animate-spin" />}
          <span>{isCreatingNew ? "Save to Library" : "Update Template"}</span>
        </button>
      </div>
    </form>
  );
});
