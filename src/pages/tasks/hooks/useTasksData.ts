import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions, isBootstrapAdminEmail } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { WORKABLE_STATUSES } from "../constants";
import type { Task, Employee } from "../types";
import { applyUserEmployeeFilter, isPhoneSyntheticEmail } from "@/lib/phoneUtils";

export function useTasksData() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const isSuper = (isSuperAdmin || isAdmin || isBootstrapAdminEmail(user?.email) || role?.allowed_modules.includes("*")) && !isPartnerBranchBlocked;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  const fetchCurrentEmployee = useCallback(async () => {
    if (!user?.email || isPartnerBranchBlocked) {
      setCurrentEmployeeId(null);
      setCurrentEmployee(null);
      return;
    }
    const empQuery = applyUserEmployeeFilter(
      supabase
        .from("employees")
        .select("id, first_name, last_name, department, avatar_url, email, role, reports_to, branch_id"),
      user.email
    );
    const { data: rows } = await empQuery.is("deleted_at", null).limit(5);
    const data = rows && rows.length > 0
      ? ((isPhoneSyntheticEmail(user.email)
          ? rows.find((r: any) => !r.email || isPhoneSyntheticEmail(r.email))
          : rows.find((r: any) => r.email?.toLowerCase() === user.email.toLowerCase())) || rows[0])
      : null;
    if (data) {
      setCurrentEmployeeId(data.id);
      setCurrentEmployee(data as Employee);
    } else {
      setCurrentEmployeeId(null);
      setCurrentEmployee(null);
    }
  }, [user?.email, isPartnerBranchBlocked]);

  const fetchEmployees = useCallback(async () => {
    if (isPartnerBranchBlocked) {
      setEmployees([]);
      return;
    }
    let query = supabase
      .from("employees")
      .select("id, first_name, last_name, department, avatar_url, email, role, reports_to, branch_id")
      .in("status", WORKABLE_STATUSES)
      .is("deleted_at", null)
      .order("first_name");

    if (targetBranch) {
      query = query.eq("branch_id", targetBranch);
    }

    const { data } = await query;
    if (data) {
      let list = [...data];
      if (currentEmployee && !list.some((e) => e.id === currentEmployee.id)) {
        list.push(currentEmployee);
      }
      setEmployees(list);
    }
  }, [isPartnerBranchBlocked, targetBranch, currentEmployee]);

  const fetchTasks = useCallback(async () => {
    if (isPartnerBranchBlocked) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select(
        "id, title, description, assigned_to, assigned_by, status, priority, due_date, completed_at, created_at, is_outside_work, work_status, work_checked_in_at, work_checked_out_at, work_lat, work_lng, work_accuracy_m, work_address, work_image_url, work_check_out_lat, work_check_out_lng, work_check_out_accuracy_m, work_check_out_address, work_check_out_image_url, work_media_urls, work_check_out_media_urls, employees!tasks_assigned_to_fkey(first_name, last_name, department, avatar_url, branch_id)"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const allFetched = data as unknown as Task[];
      // If a specific targetBranch is active, filter by that branch,
      // but always retain tasks where the current user is assignee or assigner.
      // If targetBranch is null (e.g. All Branches / Super Admin), keep all tasks.
      const filtered = targetBranch
        ? allFetched.filter(
            (t: any) =>
              (t.employees && t.employees.branch_id === targetBranch) ||
              (currentEmployeeId && (t.assigned_to === currentEmployeeId || t.assigned_by === currentEmployeeId))
          )
        : allFetched;
      setTasks(filtered);
    }
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch, currentEmployeeId]);

  useEffect(() => {
    fetchCurrentEmployee();
  }, [fetchCurrentEmployee]);

  useEffect(() => {
    fetchEmployees();
    fetchTasks();
  }, [fetchEmployees, fetchTasks]);

  const resolvedCurrentEmployee = useMemo(() => {
    return currentEmployee || employees.find((e) => e.id === currentEmployeeId) || null;
  }, [currentEmployee, employees, currentEmployeeId]);

  const directSubordinates = useMemo(() => {
    if (!currentEmployeeId) return [];
    return employees.filter((e) => e.reports_to === currentEmployeeId);
  }, [employees, currentEmployeeId]);

  const isManager = useMemo(() => {
    if (isSuper || isBranchAdmin) return true;
    if (directSubordinates.length > 0) return true;
    const roleName = (role?.name || resolvedCurrentEmployee?.role || "").toLowerCase();
    return (
      roleName.includes("manager") ||
      roleName.includes("lead") ||
      roleName.includes("head") ||
      roleName.includes("supervisor") ||
      Boolean(role?.task_view_own_branch)
    );
  }, [isSuper, isBranchAdmin, directSubordinates.length, role, resolvedCurrentEmployee]);

  // Managed employees: For Super Admin/Branch Admin = all in branch, For Manager = self + subordinates + department team, For regular employee = self
  const managedEmployees = useMemo(() => {
    if (!currentEmployeeId || employees.length === 0) return employees;
    if (isSuper || isBranchAdmin) {
      return employees;
    }

    if (isManager) {
      const myEmp = resolvedCurrentEmployee;
      return employees.filter(
        (e) =>
          e.id === currentEmployeeId ||
          e.reports_to === currentEmployeeId ||
          (myEmp?.department && e.department === myEmp.department)
      );
    }

    const myEmp = resolvedCurrentEmployee;
    return myEmp ? [myEmp] : employees;
  }, [employees, currentEmployeeId, resolvedCurrentEmployee, isSuper, isBranchAdmin, isManager]);

  const managedEmployeeIds = useMemo(() => {
    return new Set(managedEmployees.map((e) => e.id));
  }, [managedEmployees]);

  // Scoped tasks visible to this user
  const scopedTasks = useMemo(() => {
    if (isPartnerBranchBlocked) return [];
    if (isSuper || isBranchAdmin) {
      return tasks;
    }
    if (isManager) {
      return tasks.filter(
        (t) =>
          t.assigned_to === currentEmployeeId ||
          t.assigned_by === currentEmployeeId ||
          managedEmployeeIds.has(t.assigned_to)
      );
    }
    return tasks.filter((t) => t.assigned_to === currentEmployeeId || t.assigned_by === currentEmployeeId);
  }, [tasks, isPartnerBranchBlocked, isSuper, isBranchAdmin, isManager, currentEmployeeId, managedEmployeeIds]);

  return {
    user,
    role,
    isAdmin: isSuper,
    isSuperAdmin,
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    isManager,
    hasSubordinates: directSubordinates.length > 0,
    directSubordinates,
    tasks: scopedTasks,
    allRawTasks: tasks,
    setTasks,
    employees,
    managedEmployees,
    assignableEmployees: managedEmployees,
    loading,
    currentEmployeeId,
    currentEmployee: resolvedCurrentEmployee,
    fetchTasks,
  };
}
