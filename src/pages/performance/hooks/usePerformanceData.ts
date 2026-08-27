import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { Review, Goal, Employee } from "../types";

export function usePerformanceData() {
  const { user } = useAuth();
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || Boolean(role?.performance_view_all_employees);
  const canViewOwnBranch = !canViewAll && Boolean(role?.performance_view_own_branch);
  const canManage = canViewAll || canViewOwnBranch;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (canViewAll) {
      const [{ data: r }, { data: g }, { data: e }] = await Promise.all([
        supabase
          .from("performance_reviews")
          .select(
            `*, employee:employees!performance_reviews_employee_id_fkey(first_name, last_name, role, department), reviewer:employees!performance_reviews_reviewer_id_fkey(first_name, last_name)`
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("performance_goals")
          .select("id, employee_id, title, description, target_date, progress, status")
          .order("target_date"),
        supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url")
          .order("first_name"),
      ]);
      setReviews((r as Review[]) || []);
      setGoals((g as Goal[]) || []);
      setEmployees((e as Employee[]) || []);
      setLoading(false);
      return;
    }

    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, branch_id")
      .eq("email", user.email)
      .maybeSingle();

    if (!me) {
      setReviews([]);
      setGoals([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    if (canViewOwnBranch && me.branch_id) {
      const { data: team } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, avatar_url")
        .eq("status", "active")
        .eq("branch_id", me.branch_id)
        .order("first_name");

      setEmployees((team as Employee[]) || []);
      const ids = (team || []).map((e) => e.id);
      const [{ data: r }, { data: g }] = ids.length
        ? await Promise.all([
            supabase
              .from("performance_reviews")
              .select(
                `*, employee:employees!performance_reviews_employee_id_fkey(first_name, last_name, role, department), reviewer:employees!performance_reviews_reviewer_id_fkey(first_name, last_name)`
              )
              .in("employee_id", ids)
              .order("created_at", { ascending: false }),
            supabase
              .from("performance_goals")
              .select("id, employee_id, title, description, target_date, progress, status")
              .in("employee_id", ids)
              .order("target_date"),
          ])
        : [{ data: [] }, { data: [] }];

      setReviews((r as Review[]) || []);
      setGoals((g as Goal[]) || []);
      setLoading(false);
      return;
    }

    setEmployees([me as Employee]);
    const [{ data: r }, { data: g }] = await Promise.all([
      supabase
        .from("performance_reviews")
        .select(
          `*, employee:employees!performance_reviews_employee_id_fkey(first_name, last_name, role, department), reviewer:employees!performance_reviews_reviewer_id_fkey(first_name, last_name)`
        )
        .eq("employee_id", me.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("performance_goals")
        .select("id, employee_id, title, description, target_date, progress, status")
        .eq("employee_id", me.id)
        .order("target_date"),
    ]);
    setReviews((r as Review[]) || []);
    setGoals((g as Goal[]) || []);
    setLoading(false);
  }, [canViewAll, canViewOwnBranch, user?.email]);

  useEffect(() => {
    if (permsLoading) return;
    loadData();
  }, [permsLoading, loadData]);

  return {
    canManage,
    reviews,
    setReviews,
    goals,
    setGoals,
    employees,
    loading,
    loadData,
  };
}
