import { memo } from "react";
import type { Course, Enrollment } from "../../types";
import { FORMAT_CONFIG } from "../../constants";

interface CourseCardProps {
  course: Course;
  enrollments: Enrollment[];
  canManage: boolean;
  onSelect: (c: Course) => void;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onEnroll: (courseId: string) => void;
}

export const CourseCard = memo(function CourseCard({
  course,
  enrollments,
  canManage,
  onSelect,
  onEdit,
  onDelete,
  onEnroll,
}: CourseCardProps) {
  const format = FORMAT_CONFIG[course.format] || FORMAT_CONFIG.online;
  const courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
  const completedCount = courseEnrollments.filter((e) => e.status === "completed").length;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between group">
      <div>
        {/* Top: Category & Format Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {course.category}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${format.color}`}
          >
            <i className={format.icon} />
            {format.label}
          </span>
        </div>

        {/* Title & Description */}
        <h3
          onClick={() => onSelect(course)}
          className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#253C7D] transition-colors cursor-pointer"
        >
          {course.title}
        </h3>
        {course.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
            {course.description}
          </p>
        )}

        {/* Instructor & Duration */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
          {course.duration_hours && (
            <span className="flex items-center gap-1">
              <i className="ri-time-line text-xs" />
              {course.duration_hours} hrs
            </span>
          )}
          {course.instructor && (
            <span className="flex items-center gap-1 truncate">
              <i className="ri-user-line text-xs" />
              {course.instructor}
            </span>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="pt-4 mt-4 border-t border-gray-50 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            <strong className="text-gray-800">{courseEnrollments.length}</strong> enrolled
          </span>
          <span className="text-emerald-600 font-semibold">{completedCount} completed</span>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => onEnroll(course.id)}
              className="flex-1 py-1.5 px-3 bg-[#253C7D] text-white rounded-xl text-xs font-semibold hover:bg-[#1F336A] transition-colors cursor-pointer text-center"
            >
              Enroll Staff
            </button>
          )}

          <button
            onClick={() => onSelect(course)}
            className="p-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
            title="View Details"
          >
            <i className="ri-information-line" />
          </button>

          {canManage && (
            <>
              <button
                onClick={() => onEdit(course)}
                className="p-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
                title="Edit Course"
              >
                <i className="ri-pencil-line" />
              </button>
              <button
                onClick={() => onDelete(course)}
                className="p-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 cursor-pointer transition-colors"
                title="Delete Course"
              >
                <i className="ri-delete-bin-line" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
