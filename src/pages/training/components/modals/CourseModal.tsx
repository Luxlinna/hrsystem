import { memo } from "react";
import type { CourseFormState, Branch, Employee, MeetingRoomOption } from "../../types";
import { CourseScopeSelector } from "./CourseScopeSelector";
import { CourseModalFields } from "./CourseModalFields";

interface CourseModalProps {
  open: boolean;
  editingId: string | null;
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  branches: Branch[];
  employees?: Employee[];
  meetingRooms?: MeetingRoomOption[];
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
  meetingRooms = [],
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150 border border-gray-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
              <i className="ri-graduation-cap-line text-2xl" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                {editingId ? "Edit Training Course" : "Create New Training Course"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure curriculum details, schedule, meeting room location, and invited staff.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            meetingRooms={meetingRooms}
            branches={branches}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-bold text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="px-6 py-2.5 bg-[#253C7D] text-white rounded-xl font-extrabold text-sm hover:bg-[#1E293B] disabled:opacity-50 transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving…</span>
                </>
              ) : editingId ? (
                <>
                  <i className="ri-check-line text-base" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <i className="ri-add-line text-base" />
                  <span>Create Course</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
