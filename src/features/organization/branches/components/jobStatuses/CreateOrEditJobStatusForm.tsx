import { useState, memo } from "react";
import type { JobStatus, JobStatusFormState } from "../../types";

interface CreateOrEditJobStatusFormProps {
  editingJobStatus: JobStatus | null;
  isReadOnly: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: (form: JobStatusFormState) => void;
  onSwitchToEdit?: () => void;
}

const PRESET_COLORS = ["#10b981", "#f59e0b", "#64748b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

export const CreateOrEditJobStatusForm = memo(function CreateOrEditJobStatusForm({
  editingJobStatus,
  isReadOnly,
  saving,
  onBack,
  onSave,
  onSwitchToEdit,
}: CreateOrEditJobStatusFormProps) {
  const [form, setForm] = useState<JobStatusFormState>({
    name: editingJobStatus?.name || "",
    code: editingJobStatus?.code || "",
    color: editingJobStatus?.color || "#10b981",
    status: (editingJobStatus?.status as "active" | "disabled") || "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden max-w-2xl">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <i className="ri-arrow-left-line text-base" />
          </button>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              {isReadOnly
                ? "View Job Status"
                : editingJobStatus
                ? "Edit Job Status"
                : "Create Job Status"}
            </h3>
            <p className="text-xs text-slate-500">
              {isReadOnly ? "Details of this job status" : "Define status name, code, and badge styling"}
            </p>
          </div>
        </div>

        {isReadOnly && onSwitchToEdit && (
          <button
            type="button"
            onClick={onSwitchToEdit}
            className="px-3 py-1.5 rounded-lg bg-[#0088cc] text-white text-xs font-semibold cursor-pointer"
          >
            Edit
          </button>
        )}
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Status Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            disabled={isReadOnly}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Employed, Not Employed Yet, Exited..."
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-50 focus:outline-none focus:border-[#0088cc]"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            System Code (Optional)
          </label>
          <input
            type="text"
            disabled={isReadOnly}
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. employed, not_employed_yet..."
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-50 font-mono focus:outline-none focus:border-[#0088cc]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Color</label>
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                disabled={isReadOnly}
                onClick={() => setForm({ ...form, color: col })}
                className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                  form.color === col ? "border-slate-800 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: col }}
              />
            ))}
            <input
              type="color"
              disabled={isReadOnly}
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
          <select
            disabled={isReadOnly}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-50 focus:outline-none focus:border-[#0088cc] cursor-pointer"
          >
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {/* Footer Actions */}
        {!isReadOnly && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : editingJobStatus ? "Update Status" : "Create Status"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
});
