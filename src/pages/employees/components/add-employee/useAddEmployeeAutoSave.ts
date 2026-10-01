import { useState, useEffect, useRef, useCallback } from "react";
import type { EmployeeFormState } from "../../types";

function getDraftStorageKey(isEdit: boolean, form: EmployeeFormState): string {
  if (isEdit) {
    const idKey = form.employee_code || (form as any).id || form.email || "current";
    return `hr_edit_employee_draft_${idKey}`;
  }
  return "hr_add_employee_draft";
}

export function useAddEmployeeAutoSave(
  isOpen: boolean,
  isEdit: boolean,
  form: EmployeeFormState,
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormState>>
) {
  const [autoSaveEnabled, setAutoSaveEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("hr_add_employee_autosave");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [availableDraft, setAvailableDraft] = useState<EmployeeFormState | null>(null);

  const isDirtyRef = useRef<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setAutoSaveEnabled = useCallback((enabled: boolean) => {
    setAutoSaveEnabledState(enabled);
    try {
      localStorage.setItem("hr_add_employee_autosave", String(enabled));
    } catch (err) {
      console.error("Failed to persist autosave preference:", err);
    }
  }, []);

  // When modal opens, check if an existing draft is available (without silently overwriting)
  useEffect(() => {
    if (isOpen) {
      try {
        const draftKey = getDraftStorageKey(isEdit, form);
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          const hasContent = Boolean(
            parsed.full_name ||
            parsed.first_name ||
            parsed.last_name ||
            parsed.email ||
            parsed.phone ||
            parsed.department ||
            parsed.position ||
            parsed.role
          );
          if (hasContent) {
            setAvailableDraft(parsed);
          } else {
            setAvailableDraft(null);
          }
        } else {
          setAvailableDraft(null);
        }
      } catch (err) {
        console.error("Failed to check employee draft:", err);
        setAvailableDraft(null);
      }
    } else if (!isOpen) {
      isDirtyRef.current = false;
      setAvailableDraft(null);
      setAutoSaveStatus("idle");
    }
  }, [isOpen, isEdit, form.employee_code, (form as any).id, form.email]);

  // Track field changes and trigger auto-save when user types
  useEffect(() => {
    if (!isOpen || !autoSaveEnabled || !isDirtyRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("saving");

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        const draftKey = getDraftStorageKey(isEdit, form);
        localStorage.setItem(draftKey, JSON.stringify(form));
        const now = new Date();
        setLastSavedAt(now);
        setAvailableDraft(null); // It's currently loaded in the active form
        setAutoSaveStatus("saved");

        if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
        statusTimerRef.current = setTimeout(() => setAutoSaveStatus("idle"), 3000);
      } catch (err) {
        console.error("Auto-save draft error:", err);
        setAutoSaveStatus("error");
      }
    }, 1000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [form, autoSaveEnabled, isOpen, isEdit]);

  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
  }, []);

  const restoreDraft = useCallback(() => {
    if (!availableDraft) return;
    setForm((prev) => ({ ...prev, ...availableDraft }));
    setLastSavedAt(new Date());
    setAvailableDraft(null);
    isDirtyRef.current = true;
  }, [availableDraft, setForm]);

  const clearDraft = useCallback(() => {
    try {
      const draftKey = getDraftStorageKey(isEdit, form);
      localStorage.removeItem(draftKey);
      setLastSavedAt(null);
      setAvailableDraft(null);
      setAutoSaveStatus("idle");
      isDirtyRef.current = false;
    } catch (err) {
      console.error("Failed to clear employee draft:", err);
    }
  }, [isEdit, form]);

  return {
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveStatus,
    lastSavedAt,
    availableDraft,
    restoreDraft,
    clearDraft,
    markDirty,
  };
}
