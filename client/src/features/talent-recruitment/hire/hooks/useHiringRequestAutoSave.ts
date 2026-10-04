import { useState, useEffect, useRef, useCallback } from "react";
import type { NewHiringRequestFormState } from "../types";

const DRAFT_STORAGE_KEY = "hr_hiring_request_draft";
const AUTOSAVE_PREF_KEY = "hr_hiring_request_autosave";

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

  // When modal opens, check if an existing draft is available
  useEffect(() => {
    if (isOpen) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          const hasContent = Boolean(
            parsed.title?.trim() ||
            parsed.position?.trim() ||
            parsed.department?.trim() ||
            parsed.justification?.trim() ||
            parsed.jd_summary?.trim() ||
            parsed.job_description?.trim() ||
            parsed.jd_responsibilities?.trim() ||
            parsed.jd_requirements?.trim()
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
        console.error("Failed to check hiring request draft:", err);
        setAvailableDraft(null);
      }
    } else {
      isDirtyRef.current = false;
      setAvailableDraft(null);
      setAutoSaveStatus("idle");
    }
  }, [isOpen]);

  // Track field changes and trigger auto-save when user types
  useEffect(() => {
    if (!isOpen || !autoSaveEnabled || !isDirtyRef.current) return;

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
    }, 1000);

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
    } catch (err) {
      console.error("Failed to clear requisition draft:", err);
    }
  }, []);

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
