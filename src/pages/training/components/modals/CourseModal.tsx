import { memo } from "react";
import type { CourseFormState, Branch } from "../../types";

interface CourseModalProps {
  open: boolean;
  editingId: string | null;
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  branches: Branch[];
  isSuperAdmin: boolean;
  activeBranchName?: string;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}

export const CourseModal = memo(function CourseModal({
  open,
  editingId,
  form,
  setForm,
  branches,
  isSuperAdmin,
  activeBranchName,
  saving,
  onSave,
  onClose,
}: CourseModalProps) {
  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {editingId ? "Edit Training Course" : "Create New Course"}
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Set curriculum details, scope, and format.
            </p>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Course Scope: Admin Global vs Branch Course */}
          <div className="bg-gray-50/90 border border-gray-200/80 rounded-xl p-3 space-y-2">
            <label className="block font-bold text-gray-800">
              Course Scope / Ownership <span className="text-rose-500">*</span>
            </label>
            {isSuperAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_admin_course: true, branch_id: "" })}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    form.is_admin_course
                      ? "border-[#253C7D] bg-[#253C7D]/5 text-[#253C7D] ring-1 ring-[#253C7D]"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <i className="ri-global-line text-base mt-0.5" />
                  <div>
                    <div className="font-bold text-[12px]">🌐 Company-Wide (Admin)</div>
                    <div className="text-[10px] opacity-75">All branches can enroll</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_admin_course: false, branch_id: form.branch_id || branches[0]?.id || "" })}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    !form.is_admin_course
                      ? "border-[#253C7D] bg-[#253C7D]/5 text-[#253C7D] ring-1 ring-[#253C7D]"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <i className="ri-building-line text-base mt-0.5" />
                  <div>
                    <div className="font-bold text-[12px]">🏢 Branch-Specific</div>
                    <div className="text-[10px] opacity-75">Only for specific branch</div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-lg font-medium text-[11px]">
                <i className="ri-building-line text-[#253C7D] text-sm" />
                <span>Branch Course: <strong className="text-gray-900">{activeBranchName || "Your Branch"}</strong></span>
              </div>
            )}

            {isSuperAdmin && !form.is_admin_course && (
              <div className="mt-2">
                <label className="block font-semibold text-gray-700 mb-1">Target Branch</label>
                <select
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 font-semibold focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Course Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Workplace Safety & Compliance 2026"
              className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Description / Syllabus</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide course overview, objectives, and prerequisites..."
              className="w-full px-3.5 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Compliance, Leadership, Tech"
                className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Duration (Hours)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={form.duration_hours}
                onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
                placeholder="e.g. 4.5"
                className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Instructor / Provider</label>
              <input
                type="text"
                value={form.instructor}
                onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                placeholder="e.g. Dr. Jane Smith"
                className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Format</label>
              <select
                value={form.format}
                onChange={(e) =>
                  setForm({
                    ...form,
                    format: e.target.value as CourseFormState["format"],
                  })
                }
                className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl font-semibold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="online">Online</option>
                <option value="in_person">In Person</option>
                <option value="hybrid">Hybrid</option>
                <option value="self_paced">Self-Paced</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="px-5 py-2 rounded-xl font-semibold text-white bg-[#253C7D] hover:bg-[#1F336A] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {editingId ? "Save Changes" : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
