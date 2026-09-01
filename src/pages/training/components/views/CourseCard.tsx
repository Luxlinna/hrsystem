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
  onEnroll: (courseId: string, defaultDueDate?: string) => void;
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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${format.color}`}>
              <i className={format.icon} />
              {format.label}
            </span>
            {course.is_admin_course ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100/70 text-[#253C7D] flex items-center gap-1">
                <i className="ri-global-line" /> Global
              </span>
            ) : course.branches?.name ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 flex items-center gap-1">
                <i className="ri-building-line" /> {course.branches.name}
              </span>
            ) : null}
          </div>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold capitalize ${
              course.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : course.status === "draft"
                ? "bg-amber-50 text-amber-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {course.status}
          </span>
        </div>

        {/* Title & Description */}
        <h3
          onClick={() => onSelect(course)}
          className="font-bold text-gray-900 text-base group-hover:text-[#253C7D] transition-colors cursor-pointer line-clamp-1"
        >
          {course.title}
        </h3>
        <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
          {course.description || "No description provided."}
        </p>

        {/* Session Schedule Info if available */}
        {course.scheduled_date && (
          <div className="mt-3 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/60 text-xs text-[#253C7D] flex items-center gap-2">
            <i className="ri-calendar-event-line text-sm text-[#253C7D]" />
            <div className="min-w-0">
              <span className="font-bold">
                {new Date(course.scheduled_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {course.start_time && (
                <span className="text-[11px] text-gray-500 ml-1.5">
                  ({course.start_time} {course.end_time ? `– ${course.end_time}` : ""})
                </span>
              )}
            </div>
            {course.location && (
              <span className="text-[11px] text-gray-500 truncate ml-auto flex items-center gap-0.5">
                <i className="ri-map-pin-line text-xs" /> {course.location}
              </span>
            )}
          </div>
        )}

        {/* Meta Pills */}
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1 font-medium">
            <i className="ri-time-line text-gray-400" />
            {course.duration_hours ? `${course.duration_hours}h` : "Self-Paced"}
          </span>
          <span className="flex items-center gap-1 font-medium">
            <i className="ri-folder-line text-gray-400" />
            {course.category}
          </span>
          {course.instructor && (
            <span className="flex items-center gap-1 truncate font-medium">
              <i className="ri-user-star-line text-gray-400" />
              {course.instructor}
            </span>
          )}
          {course.created_by_name && (
            <span className="flex items-center gap-1 truncate ml-auto text-[10px] text-gray-400">
              Host: {course.created_by_name}
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
              onClick={() => onEnroll(course.id, course.scheduled_date || undefined)}
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
