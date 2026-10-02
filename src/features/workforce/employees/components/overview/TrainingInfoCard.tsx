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

  const trainingHistory: any[] = (employee?.training_history as any[]) || [];
  const educationHistory: any[] = (employee?.education_history as any[]) || [];

  const totalTrainingCount = enrollments.length + trainingHistory.length;

  useEffect(() => {
    onCountLoadedRef.current?.(totalTrainingCount);
  }, [totalTrainingCount]);

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
    <div className="space-y-6">
      {/* 1. Professional Training & Workshops */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 shadow-2xs">
              <i className="ri-graduation-cap-line text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                Training &amp; Skills Development
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Seminars, completed workshops, and developmental programs on record
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-sky-50 border border-sky-200 rounded-full text-sky-800">
            Records: {totalTrainingCount}
          </span>
        </div>

        {/* Hiring Setup Training History */}
        {trainingHistory.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
              Workshops &amp; Certified Trainings
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trainingHistory.map((tr, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{tr.subject || "Training Program"}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1.5">
                    <i className="ri-building-line text-[#253C7D]" />
                    <span>{tr.institue || "Training Provider"}</span>
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>
                      {tr.start_date || "—"} {tr.end_date ? `to ${tr.end_date}` : ""}
                    </span>
                    {tr.remark && <span className="font-sans italic">{tr.remark}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corporate Course Enrollments */}
        {enrollments.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
              Active LMS Course Enrollments
            </span>
            <div className="divide-y divide-gray-100 space-y-3">
              {enrollments.map((en) => {
                const course = en.training_courses;
                return (
                  <div key={en.id} className="pt-3 first:pt-0 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {course?.title || "Corporate Upskilling Course"}
                        </span>
                        {course?.category && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-medium">
                            {course.category}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Instructor: {course?.instructor || "Internal HR"} &middot;{" "}
                        {course?.duration_hours ? `${course.duration_hours} hrs` : "Self-paced"}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusBadge(
                          en.status
                        )}`}
                      >
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
          </div>
        )}

        {totalTrainingCount === 0 && !loading && (
          <div className="py-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
            <i className="ri-book-open-line text-3xl text-gray-400 block mb-1" />
            <span className="text-xs font-bold text-gray-700">No Training Records</span>
            <p className="text-[11px] text-gray-500 mt-0.5">
              No training programs or workshop attendances on file for this staff member.
            </p>
          </div>
        )}
      </div>

      {/* 2. Educational Background */}
      {educationHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <i className="ri-book-3-line text-[#253C7D]" />
              <span>Educational Degrees &amp; Academic Qualifications</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-500">
              {educationHistory.length} academic credential{educationHistory.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {educationHistory.map((edu, idx) => (
              <div
                key={idx}
                className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {edu.degree || "Degree / Diploma"}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#253C7D] border border-blue-200">
                      {edu.subject || "General"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {edu.institue || "School / University"}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>
                    {edu.start_date || "—"} to {edu.end_date || "—"}
                  </span>
                  {edu.remark && <span className="italic font-sans text-slate-500">{edu.remark}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
