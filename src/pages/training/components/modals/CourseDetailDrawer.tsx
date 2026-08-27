import { memo } from "react";
import type { Course, Enrollment } from "../../types";
import { FORMAT_CONFIG, ENROLL_STATUS_CONFIG } from "../../constants";
import { initials, formatDate } from "../../trainingUtils";

interface CourseDetailDrawerProps {
  course: Course | null;
  enrollments: Enrollment[];
  canManage: boolean;
  onClose: () => void;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onEnroll: (courseId: string) => void;
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
  if (!course) return null;

  const format = FORMAT_CONFIG[course.format] || FORMAT_CONFIG.online;
  const courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
  const completedCount = courseEnrollments.filter((e) => e.status === "completed").length;

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
                Instructor
              </span>
              <p className="font-bold text-gray-800 mt-0.5 truncate">
                {course.instructor || "Internal HR"}
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
                  onClick={() => onEnroll(course.id)}
                  className="text-xs text-[#253C7D] font-semibold hover:underline cursor-pointer"
                >
                  + Enroll Staff
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
