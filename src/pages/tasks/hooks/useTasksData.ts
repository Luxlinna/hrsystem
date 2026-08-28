import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions, isBootstrapAdminEmail } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { WORKABLE_STATUSES } from "../constants";
import type { Task, Employee } from "../types";

export function useTasksData() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId } = useBranchScope();
  const isSuper = isSuperAdmin || isAdmin || isBootstrapAdminEmail(user?.email) || role?.allowed_modules.includes("*");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  const fetchCurrentEmployee = useCallback(async () => {
    if (!user?.email) return;
    const { data } = await supabase
      .from("employees")
      .select("id, branch_id")
      .eq("email", user.email)
      .maybeSingle();
    if (data) setCurrentEmployeeId(data.id);
  }, [user?.email]);

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, avatar_url, email, role, reports_to, branch_id")
      .in("status", WORKABLE_STATUSES)
      .is("deleted_at", null)
      .order("first_name");
    if (data) setEmployees(data);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select(
        "id, title, description, assigned_to, assigned_by, status, priority, due_date, completed_at, created_at, is_outside_work, work_status, work_checked_in_at, work_checked_out_at, work_lat, work_lng, work_accuracy_m, work_address, work_image_url, work_check_out_lat, work_check_out_lng, work_check_out_accuracy_m, work_check_out_address, work_check_out_image_url, work_media_urls, work_check_out_media_urls, employees!tasks_assigned_to_fkey(first_name, last_name, department, avatar_url, branch_id)"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTasks(data as unknown as Task[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCurrentEmployee();
    fetchEmployees();
    fetchTasks();
  }, [fetchCurrentEmployee, fetchEmployees, fetchTasks]);

  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === currentEmployeeId) || null;
  }, [employees, currentEmployeeId]);

  const directSubordinates = useMemo(() => {
    if (!currentEmployeeId) return [];
    return employees.filter((e) => e.reports_to === currentEmployeeId);
  }, [employees, currentEmployeeId]);

  const isManager = useMemo(() => {
    if (isSuper || isBranchAdmin) return true;
    if (directSubordinates.length > 0) return true;
    const roleName = (role?.name || currentEmployee?.role || "").toLowerCase();
    return (
      roleName.includes("manager") ||
      roleName.includes("lead") ||
      roleName.includes("head") ||
      roleName.includes("supervisor") ||
      Boolean(role?.task_view_own_branch)
    );
  }, [isSuper, isBranchAdmin, directSubordinates.length, role, currentEmployee]);

  // Managed employees: For Super Admin = all, For Branch Admin = their branch employees, For Manager = self + subordinates + department team, For regular employee = self
  const managedEmployees = useMemo(() => {
    if (!currentEmployeeId || employees.length === 0) return employees;
    if (isSuper && !effectiveBranchId) {
      return employees;
    }

    const targetBranch = effectiveBranchId || userBranchId || currentEmployee?.branch_id;
    if (isBranchAdmin && targetBranch) {
      return employees.filter((e) => e.branch_id === targetBranch);
    }

    if (isManager) {
      const myEmp = currentEmployee;
      return employees.filter(
        (e) =>
          e.id === currentEmployeeId ||
          e.reports_to === currentEmployeeId ||
          (myEmp?.department && e.department === myEmp.department) ||
          (targetBranch && e.branch_id === targetBranch)
      );
    }

    const myEmp = currentEmployee;
    return myEmp ? [myEmp] : employees;
  }, [employees, currentEmployeeId, currentEmployee, isSuper, effectiveBranchId, userBranchId, isBranchAdmin, isManager]);

  const managedEmployeeIds = useMemo(() => {
    return new Set(managedEmployees.map((e) => e.id));
  }, [managedEmployees]);

  // Scoped tasks visible to this user
  const scopedTasks = useMemo(() => {
    if (isSuper && !effectiveBranchId) {
      return tasks;
    }
    if (isSuper && effectiveBranchId) {
      return tasks.filter((t) => managedEmployeeIds.has(t.assigned_to) || managedEmployeeIds.has(t.assigned_by));
    }
    if (isBranchAdmin) {
      return tasks.filter((t) => managedEmployeeIds.has(t.assigned_to) || managedEmployeeIds.has(t.assigned_by));
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
  }, [tasks, isSuper, effectiveBranchId, isBranchAdmin, isManager, currentEmployeeId, managedEmployeeIds]);

  return {
    user,
    role,
    isAdmin: isSuper,
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
    currentEmployee,
    fetchTasks,
  };
}
