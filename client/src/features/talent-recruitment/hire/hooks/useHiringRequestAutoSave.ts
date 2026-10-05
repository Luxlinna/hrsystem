import { useState, useEffect, useRef, useCallback } from "react";
import type { NewHiringRequestFormState } from "../types";

const DRAFT_STORAGE_KEY = "hr_hiring_request_draft";
const AUTOSAVE_PREF_KEY = "hr_hiring_request_autosave";

function hasMeaningfulContent(f: NewHiringRequestFormState): boolean {
  if (!f) return false;
  return Boolean(
    f.title?.trim() ||
    f.position?.trim() ||
    f.department?.trim() ||
    f.division?.trim() ||
    f.justification?.trim() ||
    f.jd_summary?.trim() ||
    f.job_description?.trim() ||
    f.jd_responsibilities?.trim() ||
    f.jd_requirements?.trim() ||
    f.jd_qualifications?.trim() ||
    f.jd_reporting_line?.trim() ||
    f.salary_min?.trim() ||
    f.salary_max?.trim() ||
    f.target_joining_date?.trim() ||
    f.employee_type?.trim() ||
    f.employment_type?.trim() ||
    f.employee_level?.trim() ||
    f.contract_type?.trim()
  );
}

export function useHiringRequestAutoSave(
  isOpen: boolean,
  form: NewHiringRequestFormState,
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>,
  isEditing: boolean = false
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

  const isHydratingRef = useRef<boolean>(false);
  const lastSavedPayloadRef = useRef<string>("");
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

  // Auto-hydrate existing draft directly into form state when modal opens ONLY for new requests
  useEffect(() => {
    if (isOpen && !isEditing) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (hasMeaningfulContent(parsed)) {
            isHydratingRef.current = true;
            lastSavedPayloadRef.current = JSON.stringify(parsed);
            setForm((prev) => ({ ...prev, ...parsed }));
            setLastSavedAt(new Date());
            setAutoSaveStatus("saved");
            setTimeout(() => {
              isHydratingRef.current = false;
            }, 300);
          }
        }
      } catch (err) {
        console.error("Failed to restore hiring request draft:", err);
      }
    } else if (!isOpen) {
      isHydratingRef.current = false;
      lastSavedPayloadRef.current = "";
      setAvailableDraft(null);
      setAutoSaveStatus("idle");
    }
  }, [isOpen, isEditing, setForm]);

  // Track field changes and trigger auto-save when user types (only for new requests)
  useEffect(() => {
    if (!isOpen || isEditing || !autoSaveEnabled) return;
    if (isHydratingRef.current) return;
    if (!hasMeaningfulContent(form)) return;

    const currentPayload = JSON.stringify(form);
    if (lastSavedPayloadRef.current === currentPayload) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("saving");

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        let merged = { ...form };
        const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (stored) {
          const prevStored = JSON.parse(stored);
          if (prevStored && typeof prevStored === "object") {
            merged = { ...prevStored, ...form };
          }
        }
        const stringified = JSON.stringify(merged);
        localStorage.setItem(DRAFT_STORAGE_KEY, stringified);
        lastSavedPayloadRef.current = stringified;
        setLastSavedAt(new Date());
        setAvailableDraft(null);
        setAutoSaveStatus("saved");

        if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
        statusTimerRef.current = setTimeout(() => setAutoSaveStatus("idle"), 3000);
      } catch (err) {
        console.error("Auto-save requisition draft error:", err);
        setAutoSaveStatus("error");
      }
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [form, autoSaveEnabled, isOpen, isEditing]);

  const saveDraftManually = useCallback(() => {
    if (!hasMeaningfulContent(form)) return false;
    try {
      let merged = { ...form };
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        const prevStored = JSON.parse(stored);
        if (prevStored && typeof prevStored === "object") {
          merged = { ...prevStored, ...form };
        }
      }
      const stringified = JSON.stringify(merged);
      localStorage.setItem(DRAFT_STORAGE_KEY, stringified);
      lastSavedPayloadRef.current = stringified;
      setLastSavedAt(new Date());
      setAvailableDraft(null);
      setAutoSaveStatus("saved");
      return true;
    } catch {
      setAutoSaveStatus("error");
      return false;
    }
  }, [form]);

  const restoreDraft = useCallback(() => {
    if (!availableDraft) return;
    setForm((prev) => ({ ...prev, ...availableDraft }));
    setLastSavedAt(new Date());
    setAvailableDraft(null);
  }, [availableDraft, setForm]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      lastSavedPayloadRef.current = "";
      setLastSavedAt(null);
      setAvailableDraft(null);
      setAutoSaveStatus("idle");
      setForm((prev) => ({
        ...prev,
        title: "", position: "", department: "", division: "", justification: "",
        jd_summary: "", job_description: "", jd_responsibilities: "", jd_requirements: "",
        jd_qualifications: "", jd_reporting_line: "", salary_min: "", salary_max: "", target_joining_date: "",
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
    saveDraftManually,
  };
}
