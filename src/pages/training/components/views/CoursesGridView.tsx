import { memo } from "react";
import type { Course, Enrollment } from "../../types";
import { CourseCard } from "./CourseCard";

interface CoursesGridViewProps {
  courses: Course[];
  enrollments: Enrollment[];
  canManage: boolean;
  onSelect: (c: Course) => void;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onEnroll: (courseId: string) => void;
}

export const CoursesGridView = memo(function CoursesGridView({
  courses,
  enrollments,
  canManage,
  onSelect,
  onEdit,
  onDelete,
  onEnroll,
}: CoursesGridViewProps) {
  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-2xs">
        <i className="ri-book-open-line text-4xl text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-gray-700">No courses match your filter</p>
        <p className="text-xs text-gray-400 mt-1">Try clearing your search query or selecting a different category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          enrollments={enrollments}
          canManage={canManage}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onEnroll={onEnroll}
        />
      ))}
    </div>
  );
});
