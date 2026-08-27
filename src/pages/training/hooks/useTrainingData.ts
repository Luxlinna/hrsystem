import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Course, Enrollment, Employee } from "../types";

export function useTrainingData() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cRes, eRes, empRes] = await Promise.all([
      supabase
        .from("training_courses")
        .select(
          "id, title, description, category, duration_hours, instructor, format, status, created_at"
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("training_enrollments")
        .select(
          "id, course_id, employee_id, status, progress, score, enrolled_at, due_date, completed_at, certificate_issued, notes, employees(id, first_name, last_name, department, avatar_url), training_courses(id, title, category, duration_hours)"
        )
        .is("deleted_at", null)
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("employees")
        .select("id, first_name, last_name, email, department, avatar_url")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("first_name"),
    ]);

    if (cRes.data) setCourses(cRes.data as Course[]);
    if (eRes.data) setEnrollments(eRes.data as unknown as Enrollment[]);
    if (empRes.data) setEmployees(empRes.data as Employee[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    courses,
    enrollments,
    employees,
    loading,
    fetchData,
  };
}
