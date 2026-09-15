import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "../../types";

interface EnrollmentItem {
  id: string;
  status: string;
  enrolled_at: string;
  completed_at?: string;
  training_courses?: {
    id: string;
    title: string;
    category?: string;
    instructor?: string;
    duration_hours?: number;
  } | null;
}

interface TrainingInfoCardProps {
  employee: Employee;
  onCountLoaded?: (count: number) => void;
}

export const TrainingInfoCard: React.FC<TrainingInfoCardProps> = ({ employee, onCountLoaded }) => {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const onCountLoadedRef = React.useRef(onCountLoaded);

  useEffect(() => {
    onCountLoadedRef.current = onCountLoaded;
  }, [onCountLoaded]);

  useEffect(() => {
    if (!employee?.id) return;
    let isCancelled = false;

    const fetchEnrollments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("training_enrollments")
          .select("id, status, enrolled_at, completed_at, training_courses(id, title, category, instructor, duration_hours)")
          .eq("employee_id", employee.id)
          .is("deleted_at", null)
          .order("enrolled_at", { ascending: false });

        if (isCancelled) return;

        if (!error && data) {
          const formatted = (data || []).map((x: any) => ({
            ...x,
            training_courses: Array.isArray(x.training_courses) ? x.training_courses[0] : x.training_courses,
          }));
          setEnrollments(formatted);
          onCountLoadedRef.current?.(formatted.length);
        } else {
          setEnrollments([]);
          onCountLoadedRef.current?.(0);
        }
      } catch (err) {
        console.warn("Could not load training history:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchEnrollments();

    return () => {
      isCancelled = true;
    };
  }, [employee.id]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "in_progress":
        return "bg-sky-50 text-sky-700 border-sky-200";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
            <i className="ri-graduation-cap-line text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Training &amp; Skills Development</h3>
            <p className="text-xs text-gray-500">Completed seminars, workshops, and compliance certifications</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-gray-700">
          Enrolled: {enrollments.length}
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading training records...</div>
      ) : enrollments.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
          <i className="ri-book-open-line text-3xl text-gray-400 block mb-1" />
          <span className="text-xs font-bold text-gray-700">No Course Enrollments</span>
          <p className="text-[11px] text-gray-500 mt-0.5">This staff member is not currently enrolled in any training program.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 space-y-3">
          {enrollments.map((en) => {
            const course = en.training_courses;
            return (
              <div key={en.id} className="pt-3 first:pt-0 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{course?.title || "Corporate Upskilling Course"}</span>
                    {course?.category && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                        {course.category}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Instructor: {course?.instructor || "Internal HR"} &middot; {course?.duration_hours ? `${course.duration_hours} hrs` : "Self-paced"}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusBadge(en.status)}`}>
                    {en.status || "Enrolled"}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 block mt-1">
                    {en.enrolled_at ? new Date(en.enrolled_at).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
