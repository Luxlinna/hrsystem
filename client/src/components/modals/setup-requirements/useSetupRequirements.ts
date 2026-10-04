import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import {
  ONBOARDING_DOCUMENT_TEMPLATES,
  DOC_TO_TASK,
  STAGE_DEFAULT_DUE_DAYS,
  CATEGORY_TO_STAGE,
} from "@/lib/onboarding";

export function useSetupRequirements(
  isOpen: boolean,
  onboardingRequestId: string,
  employeeName: string,
  onClose: () => void,
  onSaved?: () => void
) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadRequirements = useCallback(async () => {
    if (!onboardingRequestId) return;
    setLoading(true);
    try {
      const { data: docs } = await supabase
        .from("onboarding_documents")
        .select("document_name")
        .eq("onboarding_request_id", onboardingRequestId)
        .is("deleted_at", null);

      const activeSet = new Set<string>();
      (docs || []).forEach((d) => {
        if (d.document_name) activeSet.add(d.document_name);
      });
      setSelectedItems(activeSet);
    } catch (err) {
      console.error("Failed to load existing requirements:", err);
    } finally {
      setLoading(false);
    }
  }, [onboardingRequestId]);

  useEffect(() => {
    if (isOpen) {
      loadRequirements();
      setSearchQuery("");
    }
  }, [isOpen, loadRequirements]);

  const toggleItem = (name: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set<string>();
    Object.values(ONBOARDING_DOCUMENT_TEMPLATES).forEach((list) => {
      list.forEach((name) => all.add(name));
    });
    setSelectedItems(all);
  };

  const clearAll = () => setSelectedItems(new Set());

  const toggleStage = (stageKey: string) => {
    const list = ONBOARDING_DOCUMENT_TEMPLATES[stageKey] || [];
    const allSelected = list.every((item) => selectedItems.has(item));
    setSelectedItems((prev) => {
      const next = new Set(prev);
      list.forEach((item) => {
        if (allSelected) next.delete(item);
        else next.add(item);
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!onboardingRequestId) return;
    setSaving(true);

    try {
      const { data: currentDocs } = await supabase
        .from("onboarding_documents")
        .select("id, document_name")
        .eq("onboarding_request_id", onboardingRequestId)
        .is("deleted_at", null);

      const currentNames = new Set((currentDocs || []).map((d) => d.document_name));
      const toRemove = (currentDocs || []).filter((d) => !selectedItems.has(d.document_name));

      if (toRemove.length > 0) {
        const now = new Date().toISOString();
        const removeIds = toRemove.map((d) => d.id);
        await supabase.from("onboarding_documents").update({ deleted_at: now }).in("id", removeIds);

        for (const rem of toRemove) {
          const taskName = DOC_TO_TASK[rem.document_name] || rem.document_name;
          await supabase
            .from("onboarding_checklist_tasks")
            .update({ deleted_at: now })
            .eq("onboarding_request_id", onboardingRequestId)
            .eq("task_name", taskName)
            .is("deleted_at", null);
        }
      }

      const toAdd: { name: string; stage: string }[] = [];
      Object.entries(ONBOARDING_DOCUMENT_TEMPLATES).forEach(([stageKey, templates]) => {
        templates.forEach((name) => {
          if (selectedItems.has(name) && !currentNames.has(name)) {
            toAdd.push({ name, stage: stageKey });
          }
        });
      });

      if (toAdd.length > 0) {
        const docInserts = toAdd.map(({ name, stage }) => {
          const dueDays = STAGE_DEFAULT_DUE_DAYS[stage] ?? 7;
          const due = new Date();
          due.setDate(due.getDate() + dueDays);
          return {
            onboarding_request_id: onboardingRequestId,
            document_name: name,
            stage,
            status: "pending",
            due_date: due.toISOString(),
          };
        });
        await supabase.from("onboarding_documents").insert(docInserts);

        const categoryMap: Record<string, string> = {
          document: "documents",
          it_setup: "it_setup",
          training: "training",
          complete: "general",
        };

        const taskInserts = toAdd.map(({ name, stage }) => {
          const taskName = DOC_TO_TASK[name] || name;
          const dueDays = STAGE_DEFAULT_DUE_DAYS[CATEGORY_TO_STAGE[categoryMap[stage] || "documents"]] ?? 7;
          const due = new Date();
          due.setDate(due.getDate() + dueDays);
          return {
            onboarding_request_id: onboardingRequestId,
            task_name: taskName,
            category: categoryMap[stage] || "documents",
            priority: "medium",
            completed: false,
            due_date: due.toISOString().split("T")[0],
          };
        });
        await supabase.from("onboarding_checklist_tasks").insert(taskInserts);
      }

      toast("Requirements Saved", `Updated onboarding requirements for ${employeeName}`, "success");
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Failed to save requirements:", err);
      toast("Error", "Failed to update requirements", "error");
    } finally {
      setSaving(false);
    }
  };

  const totalPossible = useMemo(() => {
    let count = 0;
    Object.values(ONBOARDING_DOCUMENT_TEMPLATES).forEach((list) => {
      count += list.length;
    });
    return count;
  }, []);

  return {
    selectedItems,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    toggleItem,
    selectAll,
    clearAll,
    toggleStage,
    handleSave,
    totalPossible,
  };
}
