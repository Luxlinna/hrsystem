import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { toast } from "@/components/Toast";
import type { OnboardingHire, ChecklistTask, StaffMember } from "../types";
import { matchDocAndTask } from "../checklistUtils";

import { startOnboardingForCandidate, startOnboardingForEmployee } from "@/lib/onboarding";

export function useChecklistData() {
  const {
    isSuperAdmin,
    isBranchAdmin,
    isHrDivision,
    effectiveBranchId,
    effectiveBranchName,
    userBranchId,
    userBranchName,
    targetBranch,
    isPartnerBranchBlocked,
  } = useBranchScope();

  const isHrDivisionBranch =
    /hr\s*division/i.test(effectiveBranchName || "") ||
    Boolean(userBranchName && /hr\s*division/i.test(userBranchName) && (!effectiveBranchId || effectiveBranchId === userBranchId));
  const isAllBranches = !effectiveBranchId || effectiveBranchId === "all";
  const canViewCrossBranch = Boolean((isSuperAdmin || isHrDivision) && (isAllBranches || isHrDivisionBranch));

  const [searchParams, setSearchParams] = useSearchParams();
  const targetHireParam = searchParams.get("hire") || searchParams.get("request_id") || searchParams.get("highlight");

  const [hires, setHires] = useState<OnboardingHire[]>([]);
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedHire, setSelectedHire] = useState<OnboardingHire | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || (!canViewCrossBranch && !targetBranch)) {
      setHires([]);
      setTasks([]);
      setStaff([]);
      setSelectedHire(null);
      setLoading(false);
      return;
    }

    try {
      let currentHr: any[] = [];
      let staffQuery = supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, branch_id")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("first_name");

      if (!canViewCrossBranch && targetBranch) {
        staffQuery = staffQuery.eq("branch_id", targetBranch);
      }

      const [{ data: hr }, { data: tk }, { data: st }, { data: docs }] = await Promise.all([
        supabase
          .from("onboarding_requests")
          .select("*, employees(id, first_name, last_name, email, role, department, avatar_url, branch_id, branches(name), candidate_code, candidate_id, location, resume_url, resume_name, skills, languages, education, work_experience)")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("onboarding_checklist_tasks")
          .select("id, onboarding_request_id, task_name, description, category, assigned_to, assigned_to_role, due_date, completed, completed_at, completed_by, priority, sort_order")
          .is("deleted_at", null)
          .order("sort_order", { ascending: true }),
        staffQuery,
        supabase
          .from("onboarding_documents")
          .select("id, onboarding_request_id, document_name, status")
          .is("deleted_at", null),
      ]);

      currentHr = hr || [];

      const formattedHires = currentHr
        .map((h: any) => ({
          ...h,
          employees: h.employees
            ? {
                ...h.employees,
                branches: Array.isArray(h.employees.branches)
                  ? h.employees.branches[0] || null
                  : h.employees.branches || null,
              }
            : null,
        }))
        .filter((h: any) => {
          if (canViewCrossBranch) {
            return true;
          }
          return h.employees?.branch_id === targetBranch;
        }) as OnboardingHire[];

      // Keep checklist tasks synced with onboarding documents status retroactively
      const syncedTasks = (tk || []).map((t: any) => {
        const matchingDoc = (docs || []).find(
          (d: any) => d.onboarding_request_id === t.onboarding_request_id && matchDocAndTask(d.document_name, t.task_name)
        );
        if (matchingDoc) {
          const docCompleted = matchingDoc.status === "complete";
          if (t.completed !== docCompleted) {
            return {
              ...t,
              completed: docCompleted,
              completed_at: docCompleted ? new Date().toISOString() : null,
              completed_by: docCompleted ? "Auto Sync" : null,
            };
          }
        }
        return t;
      });

      const hireIds = new Set(formattedHires.map((h) => h.id));
      const filteredTasks = syncedTasks.filter((t: any) => hireIds.has(t.onboarding_request_id)) as ChecklistTask[];

      setHires(formattedHires);
      setTasks(filteredTasks);
      setStaff((st || []) as StaffMember[]);

      if (targetHireParam) {
        const found = formattedHires.find((h) => h.id === targetHireParam || h.employee_id === targetHireParam);
        if (found) {
          setSelectedHire(found);
        } else if (formattedHires.length > 0) {
          setSelectedHire(formattedHires[0]);
        }
      } else {
        setSelectedHire((prev) => {
          if (prev) {
            const updated = formattedHires.find((h) => h.id === prev.id);
            return updated || (formattedHires.length > 0 ? formattedHires[0] : null);
          }
          return formattedHires.length > 0 ? formattedHires[0] : null;
        });
      }
    } catch (err) {
      console.error("Failed to load onboarding checklist data:", err);
      toast("Error", "Failed to load checklist data", "error");
    } finally {
      setLoading(false);
    }
  }, [targetHireParam, isPartnerBranchBlocked, targetBranch, canViewCrossBranch]);

  useEffect(() => {
    loadData(false);
    const ch = supabase
      .channel("onboarding-checklist-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_checklist_tasks" }, () => loadData(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_documents" }, () => loadData(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_requests" }, () => loadData(true))
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadData]);

  // Sync selected hire with URL parameter if updated
  useEffect(() => {
    if (!targetHireParam || hires.length === 0) return;
    const match = hires.find((h) => h.id === targetHireParam || h.employee_id === targetHireParam);
    if (match && selectedHire?.id !== match.id) {
      setSelectedHire(match);
    }
  }, [targetHireParam, hires, selectedHire?.id]);

  const selectCandidate = useCallback((hire: OnboardingHire) => {
    setSelectedHire(hire);
    setSearchParams({ hire: hire.id });
  }, [setSearchParams]);

  return {
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    hires,
    setHires,
    tasks,
    setTasks,
    staff,
    selectedHire,
    setSelectedHire,
    loading,
    loadData,
    selectCandidate,
  };
}
