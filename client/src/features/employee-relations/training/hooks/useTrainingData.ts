import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import type { Course, Enrollment, Employee, Branch, MeetingRoomOption } from "../types";
import { decodeCourseDescription } from "../components/modals/courseModalUtils";

export function useTrainingData() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, targetBranch, userBranchId, userBranchName, isPartnerBranchBlocked } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();

  const roleName = (role?.name || "").toLowerCase();
  const isLeader =
    (isSuperAdmin ||
    isBranchAdmin ||
    isAdmin ||
    /manager|lead|head|admin|ceo|director|chief|president|officer/i.test(roleName)) && !isPartnerBranchBlocked;

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoomOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (isPartnerBranchBlocked) {
      setCourses([]);
      setEnrollments([]);
      setEmployees([]);
      setBranches([]);
      setMeetingRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Query all active branches for selector/filters
      const { data: bData } = await supabase
        .from("branches")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");

      const branchList = (bData as Branch[]) || [];
      setBranches(branchList);

      // 1.1 Query active meeting rooms for training location picker
      let mrQuery = supabase
        .from("meeting_rooms")
        .select("id, name, capacity, floor, color, branch_id")
        .is("deleted_at", null);

      if (targetBranch) {
        mrQuery = mrQuery.or(`branch_id.is.null,branch_id.eq.${targetBranch}`);
      }

      const { data: mrData } = await mrQuery.order("name");
      setMeetingRooms((mrData as MeetingRoomOption[]) || []);

      // 2. Query all employees (needed for complete name resolution and course scoping)
      const { data: allEmpData, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, department, avatar_url, branch_id, status")
        .is("deleted_at", null)
        .order("first_name");

      if (empErr) console.error("Training employees query error:", empErr);
      const allEmployees = (allEmpData || []) as (Employee & { status?: string })[];
      const empMap = new Map(allEmployees.map((e) => [e.id, e]));

      // Employees available for selection in UI
      const activeEmployees: Employee[] = allEmployees.filter(
        (e) => !e.status || e.status === "active" || e.status === "probation" || e.status === "contract"
      );
      setEmployees(activeEmployees);

      // 3. Query courses: Global (branch_id is null) + active branch courses with branch name joined
      let courseList: Course[] = [];
      let cQuery = supabase
        .from("training_courses")
        .select("*, branches:branch_id(id, name)")
        .is("deleted_at", null);

      if (targetBranch) {
        cQuery = cQuery.or(`branch_id.is.null,branch_id.eq.${targetBranch}`);
      }

      const { data: cData, error: cErr } = await cQuery.order("created_at", { ascending: false });

      if (cErr) {
        console.warn("Training courses scoped query error, using fallback:", cErr);
        let fallbackQuery = supabase
          .from("training_courses")
          .select("*")
          .is("deleted_at", null);
        if (targetBranch) {
          fallbackQuery = fallbackQuery.or(`branch_id.is.null,branch_id.eq.${targetBranch}`);
        }
        const { data: fallbackData } = await fallbackQuery.order("created_at", { ascending: false });
        courseList = (fallbackData || []) as Course[];
      } else {
        courseList = (cData || []) as Course[];
      }

      // Decode schedule and room location metadata
      const decodedCourses: Course[] = courseList.map((raw) => {
        const { description: cleanDesc, meta } = decodeCourseDescription(raw.description);
        const branchInfo = raw.branches || branchList.find((b) => b.id === raw.branch_id) || null;
        return {
          ...raw,
          branches: branchInfo,
          description: cleanDesc || null,
          scheduled_date: raw.scheduled_date || meta.scheduled_date || null,
          start_time: raw.start_time || meta.start_time || null,
          end_time: raw.end_time || meta.end_time || null,
          location: raw.location || meta.location || null,
          created_by_name: raw.created_by_name || meta.created_by_name || null,
          special_requirements: meta.special_requirements || null,
          custom_requirement: meta.custom_requirement || null,
          refreshments: meta.refreshments || null,
          custom_refreshment: meta.custom_refreshment || null,
        };
      });

      setCourses(decodedCourses);

      const courseMap = new Map(decodedCourses.map((c) => [c.id, c]));

      // 4. Query enrollments with resilient join and fallback
      let rawEnrollData: any[] = [];
      const { data: eData, error: eErr } = await supabase
        .from("training_enrollments")
        .select(
          "id, course_id, employee_id, status, progress, score, enrolled_at, due_date, completed_at, certificate_issued, notes, employees(id, first_name, last_name, department, avatar_url, branch_id), training_courses(id, title, category, duration_hours, branch_id)"
        )
        .is("deleted_at", null)
        .order("enrolled_at", { ascending: false });

      if (eErr) {
        console.warn("Training enrollments join query error, using fallback select:", eErr);
        const { data: fbData, error: fbErr } = await supabase
          .from("training_enrollments")
          .select(
            "id, course_id, employee_id, status, progress, score, enrolled_at, due_date, completed_at, certificate_issued, notes"
          )
          .is("deleted_at", null)
          .order("enrolled_at", { ascending: false });
        if (fbErr) {
          console.error("Training enrollments fallback error:", fbErr);
        } else {
          rawEnrollData = fbData || [];
        }
      } else {
        rawEnrollData = eData || [];
      }

      // Map and robustly normalize enrollments with employee and course associations
      const normalizedEnrollments: Enrollment[] = rawEnrollData.map((raw: any) => {
        const rawEmp = Array.isArray(raw.employees) ? raw.employees[0] : raw.employees;
        const rawCourse = Array.isArray(raw.training_courses) ? raw.training_courses[0] : raw.training_courses;

        const resolvedEmp = rawEmp || empMap.get(raw.employee_id) || null;
        const resolvedCourse = rawCourse || courseMap.get(raw.course_id) || null;

        return {
          id: raw.id,
          course_id: raw.course_id,
          employee_id: raw.employee_id,
          status: raw.status || "enrolled",
          progress: typeof raw.progress === "number" ? raw.progress : 0,
          score: raw.score != null ? Number(raw.score) : null,
          enrolled_at: raw.enrolled_at || new Date().toISOString(),
          due_date: raw.due_date || null,
          completed_at: raw.completed_at || null,
          certificate_issued: Boolean(raw.certificate_issued),
          notes: raw.notes || null,
          employees: resolvedEmp
            ? {
                id: resolvedEmp.id,
                first_name: resolvedEmp.first_name || "",
                last_name: resolvedEmp.last_name || "",
                department: resolvedEmp.department || "",
                avatar_url: resolvedEmp.avatar_url || null,
                branch_id: resolvedEmp.branch_id || null,
              }
            : undefined,
          training_courses: resolvedCourse
            ? {
                id: resolvedCourse.id,
                title: resolvedCourse.title || "",
                category: resolvedCourse.category || "General",
                duration_hours: resolvedCourse.duration_hours || null,
                description: resolvedCourse.description || null,
                instructor: resolvedCourse.instructor || null,
                format: resolvedCourse.format || "online",
                status: resolvedCourse.status || "active",
                created_at: resolvedCourse.created_at || "",
                branch_id: resolvedCourse.branch_id || null,
              }
            : undefined,
        };
      });

      // Filter enrollments based on branch scope:
      let scopedEnrollments = normalizedEnrollments;

      if (targetBranch) {
        scopedEnrollments = normalizedEnrollments.filter((e) => {
          // Include if course is visible in this branch scope (global or branch course)
          if (courseMap.has(e.course_id)) return true;
          // Or if the enrolled employee belongs to this branch
          if (e.employees?.branch_id === targetBranch) return true;
          return false;
        });
      }

      setEnrollments(scopedEnrollments);
    } catch (err) {
      console.error("Failed to fetch training data:", err);
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch, isLeader, myEmployee, user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    courses,
    enrollments,
    employees,
    branches,
    meetingRooms,
    loading,
    fetchData,
  };
}
