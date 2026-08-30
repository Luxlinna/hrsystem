import { memo, useState } from "react";
import type { Course, Employee } from "../../types";
import { EnrollLearnerList } from "./EnrollLearnerList";

interface EnrollModalProps {
  open: boolean;
  courses: Course[];
  employees: Employee[];
  enrollCourseId: string | null;
  setEnrollCourseId: (id: string) => void;
  enrollEmployeeIds: string[];
  setEnrollEmployeeIds: React.Dispatch<React.SetStateAction<string[]>>;
  enrollDueDate: string;
  setEnrollDueDate: (d: string) => void;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}

export const EnrollModal = memo(function EnrollModal({
  open,
  courses,
  employees,
  enrollCourseId,
  setEnrollCourseId,
  enrollEmployeeIds,
  setEnrollEmployeeIds,
  enrollDueDate,
  setEnrollDueDate,
  saving,
  onSave,
  onClose,
}: EnrollModalProps) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const filteredEmployees = employees.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const dept = (e.department || "").toLowerCase();
    return name.includes(q) || dept.includes(q);
  });

  const toggleEmployee = (id: string) => {
    setEnrollEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setEnrollEmployeeIds(filteredEmployees.map((e) => e.id));
  };

  const clearAll = () => {
    setEnrollEmployeeIds([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Enroll Staff into Training</h3>
          <button
            onClick={() => !saving && onClose()}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Select Course <span className="text-rose-500">*</span>
            </label>
            <select
              value={enrollCourseId || ""}
              onChange={(e) => setEnrollCourseId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Target Completion Date</label>
            <input
              type="date"
              value={enrollDueDate}
              onChange={(e) => setEnrollDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Select Learners ({enrollEmployeeIds.length} chosen)
            </label>
            <div className="relative mb-2">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff by name or department..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <EnrollLearnerList
              filteredEmployees={filteredEmployees}
              enrollEmployeeIds={enrollEmployeeIds}
              toggleEmployee={toggleEmployee}
              selectAll={selectAll}
              clearAll={clearAll}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !enrollCourseId || enrollEmployeeIds.length === 0}
            className="px-5 py-2 bg-[#253C7D] text-white rounded-xl font-bold hover:bg-[#1E293B] disabled:opacity-50 transition-colors cursor-pointer text-xs"
          >
            {saving ? "Enrolling…" : `Enroll ${enrollEmployeeIds.length} Staff`}
          </button>
        </div>
      </div>
    </div>
  );
});
