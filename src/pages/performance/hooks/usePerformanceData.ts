import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import type { Review, Goal, Employee } from "../types";

export function usePerformanceData() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();

  // Partner Privacy Rule: Super Admin or any user CANNOT access other partner branches' performance reviews.
  // Access is strictly confined to the user's home branch (userBranchId).
  const isPartnerBranchBlocked = Boolean(
    !userBranchId || (effectiveBranchId && effectiveBranchId !== userBranchId)
  );
  const targetBranch = isPartnerBranchBlocked ? null : userBranchId;

  const roleName = (role?.name || "").toLowerCase();
  const isLeader =
    (isSuperAdmin ||
    isBranchAdmin ||
    isAdmin ||
    Boolean(role?.performance_view_all_employees) ||
    Boolean(role?.performance_view_own_branch) ||
    /manager|lead|head|admin|ceo|director|chief|president|officer/i.test(roleName)) && !isPartnerBranchBlocked;

  const canManage = isLeader;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setReviews([]);
      setGoals([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isLeader) {
        // Load branch-scoped employees
        const empQuery = supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branch_id")
          .is("deleted_at", null)
          .eq("branch_id", targetBranch)
          .order("first_name");

        const { data: eData, error: eErr } = await empQuery;
        if (eErr) console.warn("Error loading performance employees:", eErr);
        const empList = (eData || []) as Employee[];
        const empIds = empList.map((e) => e.id);

        let reviewsPromise: PromiseLike<any>;
        let goalsPromise: PromiseLike<any>;

        if (empIds.length > 0) {
          reviewsPromise = supabase
            .from("performance_reviews")
            .select(
              `*, employee:employees!performance_reviews_employee_id_fkey(first_name, last_name, role, department), reviewer:employees!performance_reviews_reviewer_id_fkey(first_name, last_name)`
            )
            .in("employee_id", empIds)
            .order("created_at", { ascending: false });

          goalsPromise = supabase
            .from("performance_goals")
            .select("id, employee_id, title, description, target_date, progress, status")
            .in("employee_id", empIds)
            .order("target_date");
        } else {
          reviewsPromise = Promise.resolve({ data: [] });
          goalsPromise = Promise.resolve({ data: [] });
        }

        const [{ data: rData, error: rErr }, { data: gData, error: gErr }] = await Promise.all([
          reviewsPromise,
          goalsPromise,
        ]);

        if (rErr) console.warn("Error loading reviews:", rErr);
        if (gErr) console.warn("Error loading goals:", gErr);

        setEmployees(empList);
        setReviews((rData || []) as Review[]);
        setGoals((gData || []) as Goal[]);
      } else {
        // Individual staff view
        let empRecord = myEmployee;
        if (!empRecord && user?.email) {
          const { data: me } = await supabase
            .from("employees")
            .select("id, first_name, last_name, role, department, avatar_url, branch_id")
            .eq("email", user.email)
            .eq("branch_id", targetBranch)
            .maybeSingle();
          if (me) empRecord = me as any;
        }

        if (empRecord && (empRecord as any).branch_id === targetBranch) {
          setEmployees([empRecord as Employee]);
          const [{ data: rData }, { data: gData }] = await Promise.all([
            supabase
              .from("performance_reviews")
              .select(
                `*, employee:employees!performance_reviews_employee_id_fkey(first_name, last_name, role, department), reviewer:employees!performance_reviews_reviewer_id_fkey(first_name, last_name)`
              )
              .eq("employee_id", empRecord.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("performance_goals")
              .select("id, employee_id, title, description, target_date, progress, status")
              .eq("employee_id", empRecord.id)
              .order("target_date"),
          ]);
          setReviews((rData || []) as Review[]);
          setGoals((gData || []) as Goal[]);
        } else {
          setEmployees([]);
          setReviews([]);
          setGoals([]);
        }
      }
    } catch (err) {
      console.error("Failed to load performance data:", err);
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch, isLeader, myEmployee, user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
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
