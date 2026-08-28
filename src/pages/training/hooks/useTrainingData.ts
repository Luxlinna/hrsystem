import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import type { Course, Enrollment, Employee, Branch } from "../types";

export function useTrainingData() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();

  const roleName = (role?.name || "").toLowerCase();
  const isLeader =
    isSuperAdmin ||
    isBranchAdmin ||
    isAdmin ||
    /manager|lead|head|admin|ceo|director|chief|president|officer/i.test(roleName);

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const targetBranch = effectiveBranchId || (!isSuperAdmin ? userBranchId : null);

      // 1. Query branches
      let branchQuery = supabase.from("branches").select("id, name").is("deleted_at", null).order("name");
      if (targetBranch) {
        branchQuery = branchQuery.eq("id", targetBranch);
      }

      // 2. Query employees scoped to branch
      let empQuery = supabase
        .from("employees")
        .select("id, first_name, last_name, email, department, avatar_url, branch_id")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("first_name");

      if (targetBranch) {
        empQuery = empQuery.eq("branch_id", targetBranch);
      }

      // 3. Query courses: Global/Admin courses (branch_id is null) + active branch courses
      let courseQuery = supabase
        .from("training_courses")
        .select("id, title, description, category, duration_hours, instructor, format, status, branch_id, created_at, branches(id, name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (targetBranch) {
        courseQuery = courseQuery.or(`branch_id.is.null,branch_id.eq.${targetBranch}`);
      }

      const [bRes, cRes, empRes] = await Promise.all([
        branchQuery,
        courseQuery,
        empQuery,
      ]);

      const empList = (empRes.data || []) as Employee[];
      const empIds = empList.map((e) => e.id);

      // 4. Query enrollments scoped to branch employees or single staff member
      let enrollPromise: PromiseLike<any>;
      if (targetBranch) {
        if (empIds.length > 0) {
          if (isLeader) {
            enrollPromise = supabase
              .from("training_enrollments")
              .select(
                "id, course_id, employee_id, status, progress, score, enrolled_at, due_date, completed_at, certificate_issued, notes, employees(id, first_name, last_name, department, avatar_url, branch_id), training_courses(id, title, category, duration_hours, branch_id)"
              )
              .is("deleted_at", null)
              .in("employee_id", empIds)
              .order("enrolled_at", { ascending: false });
          } else {
            // Staff only sees their own enrollments
            let staffId = myEmployee?.id;
            if (!staffId && user?.email) {
              const matched = empList.find((e) => e.email === user.email);
              if (matched) staffId = matched.id;
            }

            enrollPromise = supabase
              .from("training_enrollments")
              .select(
                "id, course_id, employee_id, status, progress, score, enrolled_at, due_date, completed_at, certificate_issued, notes, employees(id, first_name, last_name, department, avatar_url, branch_id), training_courses(id, title, category, duration_hours, branch_id)"
              )
              .is("deleted_at", null)
              .eq("employee_id", staffId || empIds[0])
              .order("enrolled_at", { ascending: false });
          }
        } else {
          enrollPromise = Promise.resolve({ data: [] });
        }
      } else {
        // Super Admin viewing all branches
        enrollPromise = supabase
          .from("training_enrollments")
          .select(
            "id, course_id, employee_id, status, progress, score, enrolled_at, due_date, completed_at, certificate_issued, notes, employees(id, first_name, last_name, department, avatar_url, branch_id), training_courses(id, title, category, duration_hours, branch_id)"
          )
          .is("deleted_at", null)
          .order("enrolled_at", { ascending: false });
      }

      const eRes = await enrollPromise;

      if (bRes.data) setBranches(bRes.data as Branch[]);
      if (cRes.data) setCourses((cRes.data as unknown) as Course[]);
      if (eRes.data) setEnrollments(eRes.data as unknown as Enrollment[]);
      setEmployees(empList);
    } catch (err) {
      console.error("Failed to fetch training data:", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveBranchId, isSuperAdmin, userBranchId, isLeader, myEmployee, user?.email]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    courses,
    enrollments,
    employees,
    branches,
    loading,
    fetchData,
  };
}
