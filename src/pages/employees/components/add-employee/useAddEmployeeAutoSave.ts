import { useState, useEffect, useRef, useCallback } from "react";
import type { EmployeeFormState } from "../../types";

export function useAddEmployeeAutoSave(
  isOpen: boolean,
  form: EmployeeFormState,
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormState>>
) {
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("hr_add_employee_autosave");
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const isDirtyRef = useRef<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-load draft from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const savedDraft = localStorage.getItem("hr_add_employee_draft");
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setForm((prev) => {
            if (!prev.full_name && !prev.first_name && (parsed.full_name || parsed.first_name || parsed.email || parsed.phone)) {
              setLastSavedAt(new Date());
              return { ...prev, ...parsed };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Failed to restore draft:", err);
      }
    }
  }, [isOpen, setForm]);

  // Debounced Auto-Save Draft
  useEffect(() => {
    if (!isOpen || !autoSaveEnabled || !isDirtyRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        setAutoSaveStatus("saving");
        localStorage.setItem("hr_add_employee_draft", JSON.stringify(form));
        setLastSavedAt(new Date());
        isDirtyRef.current = false;
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
  }, [form, autoSaveEnabled, isOpen]);

  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
  }, []);

  return {
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveStatus,
    lastSavedAt,
    markDirty,
  };
}
