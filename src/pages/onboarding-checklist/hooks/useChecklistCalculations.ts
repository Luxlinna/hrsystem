import { useMemo, useCallback } from "react";
import type { OnboardingHire, ChecklistTask, TaskStats } from "../types";
import { STAGES_LIST } from "../constants";
import { isOverdue } from "../checklistUtils";

export function useChecklistCalculations(
  selectedHire: OnboardingHire | null,
  tasks: ChecklistTask[]
) {
  const getHireTasks = useCallback(
    (hireId: string) => tasks.filter((t) => t.onboarding_request_id === hireId),
    [tasks]
  );

  const getProgress = useCallback(
    (hireId: string) => {
      const t = getHireTasks(hireId);
      if (!t.length) return 0;
      return Math.round((t.filter((item) => item.completed).length / t.length) * 100);
    },
    [getHireTasks]
  );

  const hireTasks = useMemo(() => {
    return selectedHire ? getHireTasks(selectedHire.id) : [];
  }, [selectedHire, getHireTasks]);

  const taskStats: TaskStats = useMemo(() => {
    const total = hireTasks.length;
    const completed = hireTasks.filter((t) => t.completed).length;
    const pending = hireTasks.filter((t) => !t.completed && !isOverdue(t)).length;
    const overdue = hireTasks.filter((t) => isOverdue(t)).length;
    const highPriority = hireTasks.filter((t) => !t.completed && t.priority === "high").length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, overdue, highPriority, pct };
  }, [hireTasks]);

  const categoriesPresent = useMemo(() => {
    const base = ["documents", "it_setup", "training", "general"];
    const custom = [...new Set(hireTasks.map((t) => t.category))];
    return Array.from(new Set([...base, ...custom]));
  }, [hireTasks]);

  const currentStageIdx = useMemo(() => {
    if (!selectedHire) return 0;
    const idx = STAGES_LIST.findIndex((s) => s.key === selectedHire.stage);
    return idx === -1 ? 0 : idx;
  }, [selectedHire?.stage]);

  const getCategoryStageIdx = useCallback((category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat === "documents" || cat.includes("doc")) return 0;
    if (cat === "it_setup" || cat.includes("it") || cat.includes("setup")) return 1;
    if (cat === "training" || cat.includes("train")) return 2;
    return 3;
  }, []);

  const isCategoryLocked = useCallback(
    (category: string) => {
      if (!selectedHire) return false;
      if (selectedHire.status === "pending") return true;
      if (selectedHire.status === "completed") return false;
      const catIdx = getCategoryStageIdx(category);
      return catIdx > currentStageIdx;
    },
    [selectedHire, currentStageIdx, getCategoryStageIdx]
  );

  const isTaskLocked = useCallback(
    (task: ChecklistTask) => {
      return isCategoryLocked(task.category);
    },
    [isCategoryLocked]
  );

  return {
    getHireTasks,
    getProgress,
    hireTasks,
    taskStats,
    categoriesPresent,
    currentStageIdx,
    getCategoryStageIdx,
    isCategoryLocked,
    isTaskLocked,
  };
}
