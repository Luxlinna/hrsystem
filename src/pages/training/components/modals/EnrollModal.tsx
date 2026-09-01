import { memo, useState, useMemo } from "react";
import type { Course, Employee, Enrollment, Branch } from "../../types";
import { EnrollLearnerList } from "./EnrollLearnerList";

interface EnrollModalProps {
  open: boolean;
  courses: Course[];
  employees: Employee[];
  enrollments?: Enrollment[];
  branches?: Branch[];
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
  enrollments = [],
  branches = [],
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

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === enrollCourseId) || courses[0] || null,
    [courses, enrollCourseId]
  );

  const selectedBranch = useMemo(() => {
    if (!selectedCourse?.branch_id) return null;
    return branches.find((b) => b.id === selectedCourse.branch_id) || null;
  }, [branches, selectedCourse]);

  // Filter employees strictly by the course's branch scope
  const branchScopedEmployees = useMemo(() => {
    if (!selectedCourse) return employees;
    if (selectedCourse.is_admin_course || !selectedCourse.branch_id) {
      return employees;
    }
    return employees.filter((e) => !e.branch_id || e.branch_id === selectedCourse.branch_id);
  }, [employees, selectedCourse]);

  // Set of employee IDs already enrolled in this course
  const alreadyEnrolledIds = useMemo(() => {
    if (!selectedCourse) return new Set<string>();
    return new Set(
      enrollments
        .filter((e) => e.course_id === selectedCourse.id && e.status !== "dropped")
        .map((e) => e.employee_id)
    );
  }, [enrollments, selectedCourse]);

  if (!open) return null;

  const filteredEmployees = branchScopedEmployees.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const dept = (e.department || "").toLowerCase();
    return name.includes(q) || dept.includes(q);
  });

  const toggleEmployee = (id: string) => {
    if (alreadyEnrolledIds.has(id)) return;
    setEnrollEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    // Only select employees who aren't already enrolled
    const availableIds = filteredEmployees
      .filter((e) => !alreadyEnrolledIds.has(e.id))
      .map((e) => e.id);
    setEnrollEmployeeIds(availableIds);
  };

  const clearAll = () => {
    setEnrollEmployeeIds([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150 border border-gray-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
              <i className="ri-user-add-line text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Enroll Staff into Training
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Assign branch team members to this curriculum.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Select Course */}
          <div>
            <label className="block font-extrabold text-gray-900 text-xs sm:text-sm mb-1.5">
              Select Course <span className="text-rose-500">*</span>
            </label>
            <select
              value={enrollCourseId || ""}
              onChange={(e) => {
                const nextCourseId = e.target.value;
                setEnrollCourseId(nextCourseId);
                setEnrollEmployeeIds([]);
                const foundCourse = courses.find((c) => c.id === nextCourseId);
                const targetDate = foundCourse?.scheduled_date || foundCourse?.created_at?.slice(0, 10);
                if (targetDate) {
                  setEnrollDueDate(targetDate);
                }
              }}
              className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl font-bold text-gray-900 text-xs sm:text-sm focus:outline-none focus:border-[#253C7D] focus:bg-white cursor-pointer shadow-2xs"
            >
              {courses.map((c) => {
                const bName = branches.find((b) => b.id === c.branch_id)?.name;
                const scopeLabel = c.is_admin_course ? "Global" : bName ? bName : "Branch";
                return (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.category}) · {scopeLabel}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Scope & Branch Info Badge */}
          <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-100/90 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <i className="ri-building-line text-blue-600 text-sm" />
              <span className="text-gray-700">
                Target Scope:{" "}
                <strong className="text-gray-900 font-extrabold">
                  {selectedCourse?.is_admin_course
                    ? "🌐 Company-Wide (All Staff)"
                    : selectedBranch
                    ? `🏢 ${selectedBranch.name}`
                    : "Designated Branch"}
                </strong>
              </span>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
              {branchScopedEmployees.length} Branch Staff
            </span>
          </div>

          {/* Target Due Date */}
          <div>
            <label className="block font-extrabold text-gray-900 text-xs mb-1.5">
              Target Completion Date
            </label>
            <input
              type="date"
              value={enrollDueDate}
              onChange={(e) => setEnrollDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#253C7D] focus:bg-white"
            />
          </div>

          {/* Learner Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-extrabold text-gray-900 text-xs">
                Select Learners ({enrollEmployeeIds.length} chosen)
              </label>
              {alreadyEnrolledIds.size > 0 && (
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {alreadyEnrolledIds.size} already enrolled
                </span>
              )}
            </div>

            <div className="relative mb-2">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff by name or department..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#253C7D] focus:bg-white"
              />
            </div>

            <EnrollLearnerList
              filteredEmployees={filteredEmployees}
              enrollEmployeeIds={enrollEmployeeIds}
              alreadyEnrolledIds={alreadyEnrolledIds}
              toggleEmployee={toggleEmployee}
              selectAll={selectAll}
              clearAll={clearAll}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-bold cursor-pointer text-xs sm:text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || enrollEmployeeIds.length === 0}
            className="px-6 py-2.5 bg-[#253C7D] text-white rounded-xl font-extrabold text-xs sm:text-sm hover:bg-[#1E293B] disabled:opacity-50 transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enrolling…</span>
              </>
            ) : (
              <>
                <i className="ri-user-add-line text-sm" />
                <span>Enroll {enrollEmployeeIds.length} Staff</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
