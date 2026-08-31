import { memo } from "react";
import type { CourseFormState, Branch, Employee } from "../../types";
import { CourseScopeSelector } from "./CourseScopeSelector";
import { CourseModalFields } from "./CourseModalFields";

interface CourseModalProps {
  open: boolean;
  editingId: string | null;
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  branches: Branch[];
  employees?: Employee[];
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
  employees = [],
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
          <CourseScopeSelector
            form={form}
            setForm={setForm}
            branches={branches}
            isSuperAdmin={isSuperAdmin}
            activeBranchName={activeBranchName}
          />

          <CourseModalFields
            form={form}
            setForm={setForm}
            employees={employees}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="px-5 py-2 bg-[#253C7D] text-white rounded-xl font-bold hover:bg-[#1E293B] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
