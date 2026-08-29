import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { toast } from "@/components/Toast";
import type { OnboardingHire, ChecklistTask, StaffMember } from "../types";

export function useChecklistData() {
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const [searchParams, setSearchParams] = useSearchParams();
  const targetHireParam = searchParams.get("hire") || searchParams.get("request_id") || searchParams.get("highlight");

  const [hires, setHires] = useState<OnboardingHire[]>([]);
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedHire, setSelectedHire] = useState<OnboardingHire | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setHires([]);
      setTasks([]);
      setStaff([]);
      setSelectedHire(null);
      setLoading(false);
      return;
    }

    try {
      const [{ data: hr }, { data: tk }, { data: st }, { data: docs }] = await Promise.all([
        supabase
          .from("onboarding_requests")
          .select("*, employees(id, first_name, last_name, role, department, avatar_url, branch_id, branches(name))")
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("onboarding_checklist_tasks")
          .select("id, onboarding_request_id, task_name, description, category, assigned_to, assigned_to_role, due_date, completed, completed_at, completed_by, priority, sort_order")
          .is("deleted_at", null)
          .order("sort_order", { ascending: true }),
        supabase
          .from("employees")
          .select("id, first_name, last_name, department, role, avatar_url, branch_id")
          .eq("status", "active")
          .eq("branch_id", targetBranch)
          .is("deleted_at", null)
          .order("first_name"),
        supabase
          .from("onboarding_documents")
          .select("id, onboarding_request_id, document_name, status")
          .is("deleted_at", null),
      ]);

      const formattedHires = (hr || [])
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
        .filter((h: any) => h.employees?.branch_id === targetBranch) as OnboardingHire[];

      // Keep checklist tasks synced with onboarding documents status retroactively
      const syncedTasks = (tk || []).map((t: any) => {
        const matchingDoc = (docs || []).find(
          (d: any) => d.onboarding_request_id === t.onboarding_request_id && matchDocAndTask(d.document_name, t.task_name)
        );
        if (matchingDoc) {
          const docCompleted = matchingDoc.status === "complete";
          if (t.completed !== docCompleted) {
            // Trigger background database update to keep them in sync
            supabase
              .from("onboarding_checklist_tasks")
              .update({
                completed: docCompleted,
                completed_at: docCompleted ? new Date().toISOString() : null,
                completed_by: docCompleted ? "Auto Sync" : null,
              })
              .eq("id", t.id)
              .then();
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
  }, [targetHireParam, isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("onboarding-checklist-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_checklist_tasks" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_requests" }, () => loadData())
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
