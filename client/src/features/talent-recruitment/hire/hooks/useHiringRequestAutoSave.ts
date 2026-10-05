import { useState, useEffect, useRef, useCallback } from "react";
import type { NewHiringRequestFormState } from "../types";

const DRAFT_STORAGE_KEY = "hr_hiring_request_draft";
const AUTOSAVE_PREF_KEY = "hr_hiring_request_autosave";

function hasMeaningfulContent(f: NewHiringRequestFormState): boolean {
  return Boolean(
    f.title?.trim() ||
    f.position?.trim() ||
    f.justification?.trim() ||
    f.jd_summary?.trim() ||
    f.jd_responsibilities?.trim() ||
    f.jd_requirements?.trim() ||
    f.salary_min?.trim() ||
    f.salary_max?.trim() ||
    f.target_joining_date?.trim()
  );
}

export function useHiringRequestAutoSave(
  isOpen: boolean,
  form: NewHiringRequestFormState,
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>
) {
  const [autoSaveEnabled, setAutoSaveEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(AUTOSAVE_PREF_KEY);
      return stored !== null ? stored === "true" : true;
    } catch {
      return true;
    }
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [availableDraft, setAvailableDraft] = useState<NewHiringRequestFormState | null>(null);

  const isDirtyRef = useRef<boolean>(false);
  const hasHydratedRef = useRef<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setAutoSaveEnabled = useCallback((enabled: boolean) => {
    setAutoSaveEnabledState(enabled);
    try {
      localStorage.setItem(AUTOSAVE_PREF_KEY, String(enabled));
    } catch (err) {
      console.error("Failed to persist requisition autosave preference:", err);
    }
  }, []);

  // When modal opens, auto-hydrate existing draft directly into form state
  useEffect(() => {
    if (isOpen) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (hasMeaningfulContent(parsed)) {
            // Auto-hydrate saved draft immediately into the form
            setForm((prev) => ({ ...prev, ...parsed }));
            setLastSavedAt(new Date());
            setAutoSaveStatus("saved");
            hasHydratedRef.current = true;
          }
        }
      } catch (err) {
        console.error("Failed to restore hiring request draft:", err);
      }
    } else {
      isDirtyRef.current = false;
      hasHydratedRef.current = false;
      setAvailableDraft(null);
      setAutoSaveStatus("idle");
    }
  }, [isOpen, setForm]);

  // Track field changes and trigger auto-save when user types
  useEffect(() => {
    if (!isOpen || !autoSaveEnabled) return;

    // Don't auto-save if form is completely empty
    if (!hasMeaningfulContent(form)) return;

    // Skip first mount if we just opened without user edits
    if (!isDirtyRef.current && !hasHydratedRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("saving");

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
        const now = new Date();
        setLastSavedAt(now);
        setAvailableDraft(null);
        setAutoSaveStatus("saved");

        if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
        statusTimerRef.current = setTimeout(() => setAutoSaveStatus("idle"), 3000);
      } catch (err) {
        console.error("Auto-save requisition draft error:", err);
        setAutoSaveStatus("error");
      }
    }, 800);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [form, autoSaveEnabled, isOpen]);

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
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setLastSavedAt(null);
      setAvailableDraft(null);
      setAutoSaveStatus("idle");
      isDirtyRef.current = false;
      hasHydratedRef.current = false;
      // Reset form to empty template
      setForm((prev) => ({
        ...prev,
        title: "",
        position: "",
        department: "",
        division: "",
        justification: "",
        jd_summary: "",
        jd_responsibilities: "",
        jd_requirements: "",
        jd_qualifications: "",
        jd_reporting_line: "",
        salary_min: "",
        salary_max: "",
        target_joining_date: "",
      }));
    } catch (err) {
      console.error("Failed to clear requisition draft:", err);
    }
  }, [setForm]);

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
