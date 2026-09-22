import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import type { Review, Goal, Employee } from "../types";
import { applyUserEmployeeFilter, phoneToSyntheticEmail } from "@/lib/phoneUtils";
import { unpackReviewData } from "../performanceUtils";

export function usePerformanceData() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();

  const roleName = (role?.name || "").toLowerCase();
  const isLeader =
    (isSuperAdmin || isBranchAdmin || isAdmin ||
    Boolean(role?.performance_view_all_employees) || Boolean(role?.performance_view_own_branch) ||
    /manager|lead|head|admin|ceo|director|chief|president|officer/i.test(roleName)) && !isPartnerBranchBlocked;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluators, setEvaluators] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setReviews([]); setGoals([]); setEmployees([]); setEvaluators([]); setLoading(false); return;
    }

    setLoading(true);
    try {
      const empSelect = "id, first_name, last_name, role, department, avatar_url, branch_id, email, phone, reports_to, line_manager";
      const [empRes, uraRes] = await Promise.all([
        supabase.from("employees").select(empSelect).is("deleted_at", null).eq("branch_id", targetBranch).order("first_name"),
        supabase.from("user_role_assignments").select("email, app_roles(name)").is("deleted_at", null),
      ]);

      const roleMap = new Map<string, string>();
      (uraRes.data || []).forEach((r: any) => {
        if (r.email && r.app_roles?.name) roleMap.set(r.email.toLowerCase(), r.app_roles.name);
      });

      // Collect all direct manager IDs from reporting lines
      const directManagerIds = new Set<string>();
      (empRes.data || []).forEach((e: any) => { if (e.reports_to) directManagerIds.add(e.reports_to); });

      // If any direct manager is from another branch, fetch them
      const missingMgrIds = Array.from(directManagerIds).filter((id) => !empRes.data?.some((e: any) => e.id === id));
      let extraMgrs: any[] = [];
      if (missingMgrIds.length > 0) {
        const { data: ext } = await supabase.from("employees").select(empSelect).in("id", missingMgrIds);
        extraMgrs = ext || [];
      }

      const allBranchStaff = [...(empRes.data || []), ...extraMgrs];
      const enrichedList: Employee[] = allBranchStaff.map((e: any) => {
        const synth = e.phone ? phoneToSyntheticEmail(e.phone).toLowerCase() : null;
        const appRole = (e.email && roleMap.get(e.email.toLowerCase())) || (synth && roleMap.get(synth)) || null;
        const isMgr = directManagerIds.has(e.id);
        const resolvedRole = isMgr
          ? `${appRole || e.role || "Manager"} (Direct Manager)`
          : appRole || e.role;
        return { ...e, app_role: appRole, role: resolvedRole, is_direct_manager: isMgr };
      });

      // Evaluators: direct managers from reporting line + managers/admins
      const isLeaderRole = (e: Employee) =>
        e.is_direct_manager ||
        /manager|admin|director|head|lead|ceo|supervisor|chief|president|officer/i.test(e.app_role || e.role || "");
      const leaderEvaluators = enrichedList.filter(isLeaderRole);

      const activeUserEmployee = enrichedList.find((e) => e.id === myEmployee?.id) || null;

      // Sort evaluators: employee's direct reporting line manager goes to index 0!
      const sortedEvaluators = [...(leaderEvaluators.length > 0 ? leaderEvaluators : enrichedList)].sort((a, b) => {
        if (activeUserEmployee?.reports_to) {
          if (a.id === activeUserEmployee.reports_to) return -1;
          if (b.id === activeUserEmployee.reports_to) return 1;
        }
        if (a.is_direct_manager && !b.is_direct_manager) return -1;
        if (!a.is_direct_manager && b.is_direct_manager) return 1;
        return a.first_name.localeCompare(b.first_name);
      });
      setEvaluators(sortedEvaluators);

      if (isLeader) {
        setEmployees(enrichedList);
        setCurrentEmployee(activeUserEmployee || (myEmployee as Employee) || null);
        const empIds = enrichedList.map((e) => e.id);

        if (empIds.length > 0) {
          const [{ data: rData }, { data: gData }] = await Promise.all([
            supabase.from("performance_reviews").select(
              `*, employee:employees!performance_reviews_employee_id_fkey(first_name, last_name, role, department), reviewer:employees!performance_reviews_reviewer_id_fkey(first_name, last_name)`
            ).in("employee_id", empIds).order("created_at", { ascending: false }),
            supabase.from("performance_goals").select("id, employee_id, title, description, target_date, progress, status")
              .in("employee_id", empIds).order("target_date"),
          ]);
          setReviews((rData || []).map(unpackReviewData) as Review[]);
          setGoals((gData || []) as Goal[]);
        }
      } else {
        // Individual staff view
        let empRecord = activeUserEmployee || myEmployee;
        if (!empRecord && user?.email) {
          const meQuery = applyUserEmployeeFilter(supabase.from("employees").select(empSelect), user.email);
          const { data: me } = await meQuery.eq("branch_id", targetBranch).maybeSingle();
          if (me) {
            const synth = (me as any).phone ? phoneToSyntheticEmail((me as any).phone).toLowerCase() : null;
            const appRole = ((me as any).email && roleMap.get((me as any).email.toLowerCase())) || (synth && roleMap.get(synth)) || null;
            empRecord = { ...me, app_role: appRole, role: appRole || me.role } as any;
          }
        }

        if (empRecord && (empRecord as any).branch_id === targetBranch) {
          const emp = empRecord as Employee;
          setEmployees([emp]);
          setCurrentEmployee(emp);
          const [{ data: rData }, { data: gData }] = await Promise.all([
            supabase.from("performance_reviews").select(
              `*, employee:employees!performance_reviews_employee_id_fkey(first_name, last_name, role, department), reviewer:employees!performance_reviews_reviewer_id_fkey(first_name, last_name)`
            ).eq("employee_id", emp.id).order("created_at", { ascending: false }),
            supabase.from("performance_goals").select("id, employee_id, title, description, target_date, progress, status")
              .eq("employee_id", emp.id).order("target_date"),
          ]);
          setReviews((rData || []).map(unpackReviewData) as Review[]);
          setGoals((gData || []) as Goal[]);
        } else {
          setEmployees([]); setCurrentEmployee(null); setReviews([]); setGoals([]);
        }
      }
    } catch (err) {
      console.error("Failed to load performance data:", err);
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch, isLeader, myEmployee, user?.email]);

  useEffect(() => { loadData(); }, [loadData]);

  return {
    isPartnerBranchBlocked, userBranchId, userBranchName, targetBranch,
    canManage: isLeader, reviews, setReviews, goals, setGoals,
    employees, evaluators, currentEmployee, loading, loadData,
  };
}
