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
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName } = useBranchScope();

  // Partner Privacy Rule: Super Admin or any user CANNOT access other partner branches' tasks.
  // Access is strictly confined to the user's home branch (userBranchId).
  const isPartnerBranchBlocked = Boolean(
    !userBranchId || (effectiveBranchId && effectiveBranchId !== userBranchId)
  );
  const targetBranch = isPartnerBranchBlocked ? null : userBranchId;

  const isSuper = (isSuperAdmin || isAdmin || isBootstrapAdminEmail(user?.email) || role?.allowed_modules.includes("*")) && !isPartnerBranchBlocked;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  const fetchCurrentEmployee = useCallback(async () => {
    if (!user?.email || isPartnerBranchBlocked || !targetBranch) {
      setCurrentEmployeeId(null);
      return;
    }
    const { data } = await supabase
      .from("employees")
      .select("id, branch_id")
      .eq("email", user.email)
      .eq("branch_id", targetBranch)
      .maybeSingle();
    if (data) setCurrentEmployeeId(data.id);
  }, [user?.email, isPartnerBranchBlocked, targetBranch]);

  const fetchEmployees = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setEmployees([]);
      return;
    }
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, avatar_url, email, role, reports_to, branch_id")
      .eq("branch_id", targetBranch)
      .in("status", WORKABLE_STATUSES)
      .is("deleted_at", null)
      .order("first_name");
    if (data) setEmployees(data);
  }, [isPartnerBranchBlocked, targetBranch]);

  const fetchTasks = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
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
      const filtered = (data as unknown as Task[]).filter(
        (t: any) => !t.employees || t.employees.branch_id === targetBranch
      );
      setTasks(filtered);
    }
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch]);

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

  // Managed employees: For Super Admin/Branch Admin = all in branch, For Manager = self + subordinates + department team, For regular employee = self
  const managedEmployees = useMemo(() => {
    if (!currentEmployeeId || employees.length === 0) return employees;
    if (isSuper || isBranchAdmin) {
      return employees;
    }

    if (isManager) {
      const myEmp = currentEmployee;
      return employees.filter(
        (e) =>
          e.id === currentEmployeeId ||
          e.reports_to === currentEmployeeId ||
          (myEmp?.department && e.department === myEmp.department)
      );
    }

    const myEmp = currentEmployee;
    return myEmp ? [myEmp] : employees;
  }, [employees, currentEmployeeId, currentEmployee, isSuper, isBranchAdmin, isManager]);

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
    currentEmployee,
    fetchTasks,
  };
}
