import { useState, useMemo, useEffect } from "react";
import type { Course, Enrollment, TrainingTab } from "../types";

interface UseTrainingFiltersProps {
  courses: Course[];
  enrollments: Enrollment[];
}

export function useTrainingFilters({ courses, enrollments }: UseTrainingFiltersProps) {
  const [activeTab, setActiveTab] = useState<TrainingTab>("courses");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterScope, setFilterScope] = useState<"all" | "admin" | "branch">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    return [...new Set(courses.map((c) => c.category))].filter(Boolean);
  }, [courses]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.created_at) set.add(c.created_at.slice(0, 7));
    });
    enrollments.forEach((e) => {
      if (e.enrolled_at) set.add(e.enrolled_at.slice(0, 7));
      if (e.due_date) set.add(e.due_date.slice(0, 7));
      if (e.completed_at) set.add(e.completed_at.slice(0, 7));
    });
    return Array.from(set).sort().reverse().map((ym) => {
      const [y, m] = ym.split("-");
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      const label = d.toLocaleString("en-US", { month: "long", year: "numeric" });
      return { value: ym, label };
    });
  }, [courses, enrollments]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (filterCategory && c.category !== filterCategory) return false;
      if (filterScope === "admin" && c.branch_id) return false;
      if (filterScope === "branch" && !c.branch_id) return false;
      if (filterMonth && (!c.created_at || !c.created_at.startsWith(filterMonth))) return false;
      if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [courses, filterCategory, filterScope, filterMonth, searchQuery]);

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      if (filterStatus && e.status !== filterStatus) return false;
      if (filterMonth) {
        const matchesEnrolled = e.enrolled_at && e.enrolled_at.startsWith(filterMonth);
        const matchesDue = e.due_date && e.due_date.startsWith(filterMonth);
        const matchesCompleted = e.completed_at && e.completed_at.startsWith(filterMonth);
        if (!matchesEnrolled && !matchesDue && !matchesCompleted) return false;
      }
      if (searchQuery) {
        const emp = e.employees;
        const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : "";
        const course = e.training_courses?.title.toLowerCase() || "";
        if (
          !name.includes(searchQuery.toLowerCase()) &&
          !course.includes(searchQuery.toLowerCase())
        )
          return false;
      }
      return true;
    });
  }, [enrollments, filterStatus, filterMonth, searchQuery]);

  const certificates = useMemo(() => {
    return enrollments.filter((e) => {
      if (!e.certificate_issued || e.status !== "completed") return false;
      if (filterMonth && (!e.completed_at || !e.completed_at.startsWith(filterMonth))) return false;
      return true;
    });
  }, [enrollments, filterMonth]);

  // Pagination for enrollments
  const enrollTotalPages = Math.max(1, Math.ceil(filteredEnrollments.length / pageSize));
  const enrollSafePage = Math.min(page, enrollTotalPages);
  const enrollPageStart =
    filteredEnrollments.length === 0 ? 0 : (enrollSafePage - 1) * pageSize + 1;
  const enrollPageEnd = Math.min(enrollSafePage * pageSize, filteredEnrollments.length);
  const pagedEnrollments = useMemo(() => {
    return filteredEnrollments.slice(
      (enrollSafePage - 1) * pageSize,
      enrollSafePage * pageSize
    );
  }, [filteredEnrollments, enrollSafePage, pageSize]);

  useEffect(() => {
    if (page > enrollTotalPages) setPage(enrollTotalPages);
  }, [page, enrollTotalPages]);

  // Metric stats
  const totalEnrolled = useMemo(() => {
    return enrollments.filter((e) => e.status === "enrolled" || e.status === "in_progress").length;
  }, [enrollments]);

  const totalCompleted = useMemo(() => {
    return enrollments.filter((e) => e.status === "completed").length;
  }, [enrollments]);

  const totalCerts = useMemo(() => {
    return enrollments.filter((e) => e.certificate_issued).length;
  }, [enrollments]);

  const avgProgress = useMemo(() => {
    return enrollments.length > 0
      ? Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / enrollments.length)
      : 0;
  }, [enrollments]);

  return {
    activeTab,
    setActiveTab,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterMonth,
    setFilterMonth,
    availableMonths,
    filterScope,
    setFilterScope,
    searchQuery,
    setSearchQuery,
    pageSize,
    setPageSize,
    page: enrollSafePage,
    setPage,
    categories,
    filteredCourses,
    filteredEnrollments,
    certificates,
    enrollTotalPages,
    enrollPageStart,
    enrollPageEnd,
    pagedEnrollments,
    totalEnrolled,
    totalCompleted,
    totalCerts,
    avgProgress,
  };
}
