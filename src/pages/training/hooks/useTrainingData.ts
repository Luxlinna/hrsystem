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
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();
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
    if (isPartnerBranchBlocked || !targetBranch) {
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
      const { data: mrData } = await supabase
        .from("meeting_rooms")
        .select("id, name, capacity, floor, color, branch_id")
        .is("deleted_at", null)
        .order("name");

      setMeetingRooms((mrData as MeetingRoomOption[]) || []);

      // 2. Query employees scoped to active branch
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email, department, avatar_url, branch_id")
        .eq("status", "active")
        .eq("branch_id", targetBranch)
        .is("deleted_at", null)
        .order("first_name");

      if (empErr) console.error("Training employees query error:", empErr);
      const empList = (empData || []) as Employee[];
      const empIds = empList.map((e) => e.id);
      setEmployees(empList);

      // 3. Query courses: Global (branch_id is null) + active branch courses
      let courseList: Course[] = [];
      const { data: cData, error: cErr } = await supabase
        .from("training_courses")
        .select("*")
        .is("deleted_at", null)
        .or(`branch_id.is.null,branch_id.eq.${targetBranch}`)
        .order("created_at", { ascending: false });

      if (cErr) {
        console.warn("Training courses scoped query error, using fallback:", cErr);
        const { data: fallbackData } = await supabase
          .from("training_courses")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        courseList = (fallbackData || []) as Course[];
      } else {
        courseList = (cData || []) as Course[];
      }

      // Decode schedule and room location metadata
      const decodedCourses: Course[] = courseList.map((raw) => {
        const { description: cleanDesc, meta } = decodeCourseDescription(raw.description);
        return {
          ...raw,
          description: cleanDesc || null,
          scheduled_date: raw.scheduled_date || meta.scheduled_date || null,
          start_time: raw.start_time || meta.start_time || null,
          end_time: raw.end_time || meta.end_time || null,
          location: raw.location || meta.location || null,
          created_by_name: raw.created_by_name || meta.created_by_name || null,
        };
      });

      setCourses(decodedCourses);

      // 4. Query enrollments scoped to branch employees or single staff member
      let enrollList: Enrollment[] = [];
      if (empIds.length > 0) {
        let eQuery = supabase
          .from("training_enrollments")
          .select(
            "id, course_id, employee_id, status, progress, score, enrolled_at, due_date, completed_at, certificate_issued, notes, employees(id, first_name, last_name, department, avatar_url, branch_id), training_courses(id, title, category, duration_hours)"
          )
          .is("deleted_at", null);

        if (isLeader) {
          eQuery = eQuery.in("employee_id", empIds);
        } else {
          let staffId = myEmployee?.id;
          if (!staffId && user?.email) {
            const matched = empList.find((e) => e.email === user.email);
            if (matched) staffId = matched.id;
          }
          eQuery = eQuery.eq("employee_id", staffId || empIds[0]);
        }

        const { data: eData, error: eErr } = await eQuery.order("enrolled_at", { ascending: false });
        if (eErr) console.error("Training enrollments query error:", eErr);
        enrollList = ((eData as unknown) as Enrollment[]) || [];
      }
      setEnrollments(enrollList);
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
