import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { WORKABLE_STATUSES } from "../constants";
import type { Task, Employee } from "../types";

export function useTasksData() {
  const { user } = useAuth();
  const { isSuperAdmin, isManager } = usePermissions();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  const fetchCurrentEmployee = useCallback(async () => {
    if (!user?.email) return;
    const { data } = await supabase
      .from("employees")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
    if (data) setCurrentEmployeeId(data.id);
  }, [user?.email]);

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, avatar_url, email, reports_to, branch_id")
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
        "id, title, description, assigned_to, assigned_by, status, priority, due_date, completed_at, created_at, is_outside_work, work_status, work_checked_in_at, work_checked_out_at, work_lat, work_lng, work_accuracy_m, work_address, work_image_url, work_check_out_lat, work_check_out_lng, work_check_out_accuracy_m, work_check_out_address, work_check_out_image_url, work_media_urls, work_check_out_media_urls, employees!tasks_assigned_to_fkey(first_name, last_name, department, avatar_url)"
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

  return {
    user,
    isSuperAdmin,
    isManager,
    tasks,
    setTasks,
    employees,
    loading,
    currentEmployeeId,
    fetchTasks,
  };
}
