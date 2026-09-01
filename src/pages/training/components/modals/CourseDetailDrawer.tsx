import { memo, useMemo } from "react";
import type { Course, Enrollment } from "../../types";
import { FORMAT_CONFIG, ENROLL_STATUS_CONFIG } from "../../constants";
import { initials } from "../../trainingUtils";

interface CourseDetailDrawerProps {
  course: Course | null;
  enrollments: Enrollment[];
  canManage: boolean;
  onClose: () => void;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onEnroll: (courseId: string, defaultDueDate?: string) => void;
}

export const CourseDetailDrawer = memo(function CourseDetailDrawer({
  course,
  enrollments,
  canManage,
  onClose,
  onEdit,
  onDelete,
  onEnroll,
}: CourseDetailDrawerProps) {
  const format = course ? FORMAT_CONFIG[course.format] || FORMAT_CONFIG.online : FORMAT_CONFIG.online;

  // Deduplicate enrollments by employee_id so the same employee is never shown twice
  const courseEnrollments = useMemo(() => {
    if (!course) return [];
    const list = enrollments.filter((e) => e.course_id === course.id);
    const map = new Map<string, Enrollment>();
    list.forEach((e) => {
      if (!map.has(e.employee_id)) {
        map.set(e.employee_id, e);
      } else {
        const existing = map.get(e.employee_id)!;
        if ((e.progress || 0) >= (existing.progress || 0)) {
          map.set(e.employee_id, e);
        }
      }
    });
    return Array.from(map.values());
  }, [enrollments, course]);

  if (!course) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${format.color} mb-1.5`}
            >
              <i className={format.icon} />
              {format.label}
            </span>
            <h2 className="text-base font-bold text-gray-900 leading-snug">{course.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{course.category}</p>
          </div>

          <div className="flex items-center gap-1">
            {canManage && (
              <>
                <button
                  onClick={() => onEdit(course)}
                  className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg cursor-pointer"
                  title="Edit Course"
                >
                  <i className="ri-pencil-line text-base" />
                </button>
                <button
                  onClick={() => onDelete(course)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  title="Delete Course"
                >
                  <i className="ri-delete-bin-line text-base" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Schedule & Location Card */}
          {(course.scheduled_date || course.location) && (
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#253C7D] uppercase tracking-wider flex items-center gap-1.5">
                  <i className="ri-calendar-check-line text-xs" />
                  Scheduled Session
                </span>
                {course.created_by_name && (
                  <span className="text-[10px] text-gray-500 font-medium">
                    Invited by: <strong>{course.created_by_name}</strong>
                  </span>
                )}
              </div>
              {course.scheduled_date && (
                <p className="text-sm font-bold text-gray-900">
                  {new Date(course.scheduled_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              {course.start_time && (
                <p className="text-xs text-[#253C7D] font-semibold flex items-center gap-1">
                  <i className="ri-time-line text-xs" />
                  {course.start_time} {course.end_time ? `— ${course.end_time}` : ""}
                </p>
              )}
              {course.location && (
                <p className="text-xs text-gray-700 font-bold flex items-center gap-1.5 mt-1 pt-1.5 border-t border-blue-100/60">
                  <i className="ri-door-open-line text-sm text-[#253C7D]" />
                  <span>Venue / Room: <strong>{course.location}</strong></span>
                </p>
              )}
            </div>
          )}

          {/* Overview */}
          {course.description && (
            <div>
              <h4 className="font-bold text-gray-800 mb-1">Course Syllabus &amp; Overview</h4>
              <p className="text-gray-600 leading-relaxed bg-gray-50/80 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                {course.description}
              </p>
            </div>
          )}

          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50/60 rounded-xl border border-gray-100">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Duration
              </span>
              <p className="font-bold text-gray-800 mt-0.5">
                {course.duration_hours ? `${course.duration_hours} hours` : "Self-Paced"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Instructor / Host
              </span>
              <p className="font-bold text-gray-800 mt-0.5 truncate">
                {course.instructor || course.created_by_name || "Internal HR"}
              </p>
            </div>
          </div>

          {/* Enrolled Staff List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-800">
                Enrolled Learners ({courseEnrollments.length})
              </h4>
              {canManage && (
                <button
                  type="button"
                  onClick={() => onEnroll(course.id, course.scheduled_date || undefined)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#253C7D] text-white hover:bg-[#1E293B] font-bold text-xs transition-all shadow-xs hover:shadow cursor-pointer"
                >
                  <i className="ri-user-add-line text-sm" />
                  <span>+ Enroll Staff</span>
                </button>
              )}
            </div>

            {courseEnrollments.length === 0 ? (
              <p className="text-gray-400 italic">No employees enrolled in this course yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {courseEnrollments.map((enr) => {
                  const emp = enr.employees;
                  const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
                  const st = ENROLL_STATUS_CONFIG[enr.status] || ENROLL_STATUS_CONFIG.enrolled;

                  return (
                    <div
                      key={enr.id}
                      className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {emp?.avatar_url ? (
                          <img
                            src={emp.avatar_url}
                            alt={empName}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white text-[8px] font-bold flex items-center justify-center shrink-0">
                            {initials(emp?.first_name, emp?.last_name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{empName}</p>
                          <p className="text-[10px] text-gray-400">
                            {emp?.department || "General"} &middot; {enr.progress}%
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
