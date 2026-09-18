import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { Candidate } from "../../types";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import {
  HIRING_STEPS,
  type HiringStepId,
  type EditHiringFormData,
} from "./edit-hiring/types";
import { deriveBuHandle } from "@/pages/employees/constants";
import { useHiringModalData } from "./edit-hiring/useHiringModalData";
import { EditHiringModalHeader } from "./edit-hiring/EditHiringModalHeader";
import { EditHiringPersonalTab } from "./edit-hiring/EditHiringPersonalTab";
import { EditHiringOrgTab } from "./edit-hiring/EditHiringOrgTab";
import { EditHiringTermsTab } from "./edit-hiring/EditHiringTermsTab";
import { EditHiringCompTab } from "./edit-hiring/EditHiringCompTab";
import { EditHiringContactTab } from "./edit-hiring/EditHiringContactTab";
import { EditHiringModalFooter } from "./edit-hiring/EditHiringModalFooter";

interface EditHiringInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  onSaved: (updatedCandidate: Partial<Candidate>) => void;
}

export const EditHiringInfoModal: React.FC<EditHiringInfoModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<HiringStepId>("personal");
  const [saving, setSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const isDirtyRef = useRef<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<EditHiringFormData>({
    full_name: candidate.full_name || "",
    kh_name: candidate.kh_name || "",
    gender: candidate.gender || "",
    date_of_birth: candidate.date_of_birth || "",
    marital_status: candidate.marital_status || "",
    national_id_number: candidate.national_id_number || "",

    code_bu: candidate.code_bu || "",
    bu_full_name: candidate.bu_full_name || "",
    handle_bu: candidate.handle_bu || "",
    division: candidate.division || "",
    department: candidate.department || "",
    position: candidate.position || candidate.job_title || "",
    site: candidate.site || "",
    working_location: candidate.working_location || candidate.location || "",

    working_hour: candidate.working_hour || "",
    total_working_days: candidate.total_working_days || "",
    employment_type: candidate.employment_type || "Full Time",
    start_date: candidate.start_date || "",
    line_manager: candidate.line_manager || "",
    contract_type: candidate.contract_type || "FDC",
    fdc_end_date: candidate.fdc_end_date || "",
    hiring_status: candidate.hiring_status || "probation",

    basic_salary: candidate.basic_salary ? String(candidate.basic_salary) : candidate.expected_salary ? String(candidate.expected_salary) : "",
    tax_method: candidate.tax_method || "Resident",
    allowance: candidate.allowance || "",
    bank_account_number: candidate.bank_account_number || "",
    nssf_number: candidate.nssf_number || "",

    email: candidate.email || "",
    phone: candidate.phone || "",
    current_address: candidate.current_address || "",
    emergency_contact_name: candidate.emergency_contact_name || "",
    emergency_phone_number: candidate.emergency_phone_number || "",
  });

  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const candidateRef = useRef(candidate);
  candidateRef.current = candidate;
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const {
    cleanBranches,
    currentBranch,
    currentBranchName,
    workSites,
    currentSiteSelectValue,
    getBranchCode,
    buManagers,
    buCeos,
  } = useHiringModalData(isOpen, formData);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: candidate.full_name || "",
        kh_name: candidate.kh_name || "",
        gender: candidate.gender || "",
        date_of_birth: candidate.date_of_birth || "",
        marital_status: candidate.marital_status || "",
        national_id_number: candidate.national_id_number || "",

        code_bu: candidate.code_bu || "",
        bu_full_name: candidate.bu_full_name || "",
        handle_bu: candidate.handle_bu || "",
        division: candidate.division || "",
        department: candidate.department || "",
        position: candidate.position || candidate.job_title || "",
        site: candidate.site || "",
        working_location: candidate.working_location || candidate.location || "",

        working_hour: candidate.working_hour || "",
        total_working_days: candidate.total_working_days || "",
        employment_type: candidate.employment_type || "Full Time",
        start_date: candidate.start_date || "",
        line_manager: candidate.line_manager || "",
        contract_type: candidate.contract_type || "FDC",
        fdc_end_date: candidate.fdc_end_date || "",
        hiring_status: candidate.hiring_status || "probation",

        basic_salary: candidate.basic_salary ? String(candidate.basic_salary) : candidate.expected_salary ? String(candidate.expected_salary) : "",
        tax_method: candidate.tax_method || "Resident",
        allowance: candidate.allowance || "",
        bank_account_number: candidate.bank_account_number || "",
        nssf_number: candidate.nssf_number || "",

        email: candidate.email || "",
        phone: candidate.phone || "",
        current_address: candidate.current_address || "",
        emergency_contact_name: candidate.emergency_contact_name || "",
        emergency_phone_number: candidate.emergency_phone_number || "",
      });
      setActiveTab("personal");
      isDirtyRef.current = false;
      setAutoSaveStatus("idle");
    }
  }, [isOpen, candidate]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const handleSelectBranch = (branchId: string) => {
    isDirtyRef.current = true;
    if (!branchId) {
      setFormData((prev) => ({
        ...prev,
        code_bu: "",
        bu_full_name: "",
        handle_bu: "",
        site: "",
      }));
      return;
    }
    const branch = cleanBranches.find((b) => b.id === branchId);
    if (branch) {
      const code = getBranchCode(branch.name);
      const branchWorkSites = workSites.filter((wl) => wl.branch_id === branch.id);
      const matchingSub = branchWorkSites.find(
        (s) => formData.site && s.name.toLowerCase() === formData.site.toLowerCase()
      );

      const newSite = matchingSub ? matchingSub.name : `Main Office (${branch.name})`;
      const newLocation = matchingSub ? (matchingSub.description || matchingSub.name) : (branch.location || "Phnom Penh, Cambodia");

      setFormData((prev) => ({
        ...prev,
        code_bu: code,
        bu_full_name: branch.name,
        handle_bu: deriveBuHandle(branch.name, code),
        site: newSite,
        working_location: newLocation,
      }));
    }
  };

  const handleSelectSite = (siteIdOrVal: string) => {
    isDirtyRef.current = true;
    if (!siteIdOrVal) {
      const mainOfficeLabel = currentBranch ? `Main Office (${currentBranch.name})` : "Main Office";
      const loc = currentBranch?.location || "Phnom Penh, Cambodia";
      setFormData((prev) => ({
        ...prev,
        site: mainOfficeLabel,
        working_location: loc,
      }));
      return;
    }

    const targetSite = workSites.find((s) => s.id === siteIdOrVal || s.name === siteIdOrVal);
    if (targetSite) {
      let loc = targetSite.description || targetSite.name;
      const lower = targetSite.name.toLowerCase();
      if (lower.includes("kampong thom") || lower.includes("kampongthom")) loc = "Kampong Thom";
      else if (lower.includes("battambang") || lower.includes("btb")) loc = "Battambang";
      else if (lower.includes("siem reap")) loc = "Siem Reap";
      else if (lower.includes("poipet")) loc = "Poipet";

      setFormData((prev) => ({
        ...prev,
        site: targetSite.name,
        working_location: loc,
      }));
    }
  };

  const handleChange = (field: keyof EditHiringFormData, value: string) => {
    isDirtyRef.current = true;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const filledCount = useMemo(() => {
    let count = 0;
    const values = Object.values(formData);
    for (const val of values) {
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        count++;
      }
    }
    return count;
  }, [formData]);

  const currentStepIndex = HIRING_STEPS.findIndex((s) => s.id === activeTab);

  const saveHiringInfo = useCallback(
    async (isManual: boolean = false) => {
      const currentForm = formDataRef.current;
      const currentCand = candidateRef.current;

      if (isManual) {
        if (!currentForm.full_name.trim()) {
          toast("Validation Error", "Full Name is required.", "error");
          setActiveTab("personal");
          return false;
        }
        if (!currentForm.email.trim()) {
          toast("Validation Error", "Email is required.", "error");
          setActiveTab("contact");
          return false;
        }
        setSaving(true);
      } else {
        if (!isDirtyRef.current) return false;
        setAutoSaveStatus("saving");
      }

      try {
        const updatePayload: Record<string, any> = {
          full_name: currentForm.full_name.trim(),
          kh_name: currentForm.kh_name.trim() || null,
          gender: currentForm.gender || null,
          date_of_birth: currentForm.date_of_birth || null,
          marital_status: currentForm.marital_status || null,
          national_id_number: currentForm.national_id_number.trim() || null,

          code_bu: currentForm.code_bu.trim() || null,
          bu_full_name: currentForm.bu_full_name.trim() || null,
          handle_bu: currentForm.handle_bu.trim() || null,
          division: currentForm.division.trim() || null,
          department: currentForm.department.trim() || null,
          position: currentForm.position.trim() || null,
          site: currentForm.site.trim() || null,
          working_location: currentForm.working_location.trim() || null,

          working_hour: currentForm.working_hour.trim() || null,
          total_working_days: currentForm.total_working_days.trim() || null,
          employment_type: currentForm.employment_type || "Full Time",
          start_date: currentForm.start_date || null,
          line_manager: currentForm.line_manager.trim() || null,
          contract_type: currentForm.contract_type || "FDC",
          fdc_end_date: currentForm.fdc_end_date || null,
          hiring_status: currentForm.hiring_status || "probation",

          basic_salary: currentForm.basic_salary ? parseFloat(currentForm.basic_salary) : null,
          tax_method: currentForm.tax_method || "Resident",
          allowance: currentForm.allowance.trim() || null,
          bank_account_number: currentForm.bank_account_number.trim() || null,
          nssf_number: currentForm.nssf_number.trim() || null,

          email: currentForm.email.trim(),
          phone: currentForm.phone.trim() || null,
          current_address: currentForm.current_address.trim() || null,
          emergency_contact_name: currentForm.emergency_contact_name.trim() || null,
          emergency_phone_number: currentForm.emergency_phone_number.trim() || null,
        };

        const { error } = await supabase
          .from("candidates")
          .update(updatePayload)
          .eq("id", currentCand.id);

        if (error) throw error;

        isDirtyRef.current = false;
        onSavedRef.current(updatePayload);
        setLastSavedAt(new Date());

        if (isManual) {
          toast("Hiring Information Saved", "All 33 fields updated successfully.", "success");
          onClose();
        } else {
          setAutoSaveStatus("saved");
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
          statusTimerRef.current = setTimeout(() => setAutoSaveStatus("idle"), 3000);
        }
        return true;
      } catch (err: any) {
        console.error("Save failed:", err);
        if (isManual) {
          toast("Save Failed", err.message || "Could not update hiring information.", "error");
        } else {
          setAutoSaveStatus("error");
        }
        return false;
      } finally {
        if (isManual) setSaving(false);
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen || !autoSaveEnabled) return;
    if (!isDirtyRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveHiringInfo(false);
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, autoSaveEnabled, isOpen, saveHiringInfo]);

  const handleTabChange = async (targetTab: HiringStepId) => {
    if (autoSaveEnabled && isDirtyRef.current) {
      await saveHiringInfo(false);
    }
    setActiveTab(targetTab);
  };

  const goToNextStep = async () => {
    if (currentStepIndex < HIRING_STEPS.length - 1) {
      if (autoSaveEnabled && isDirtyRef.current) {
        await saveHiringInfo(false);
      }
      setActiveTab(HIRING_STEPS[currentStepIndex + 1].id);
    }
  };

  const goToPrevStep = async () => {
    if (currentStepIndex > 0) {
      if (autoSaveEnabled && isDirtyRef.current) {
        await saveHiringInfo(false);
      }
      setActiveTab(HIRING_STEPS[currentStepIndex - 1].id);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveHiringInfo(true);
  };

  const handleCloseModal = async () => {
    if (isDirtyRef.current) {
      await saveHiringInfo(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        <EditHiringModalHeader
          candidate={candidate}
          filledCount={filledCount}
          autoSaveStatus={autoSaveStatus}
          autoSaveEnabled={autoSaveEnabled}
          onToggleAutoSave={() => {
            const nextState = !autoSaveEnabled;
            setAutoSaveEnabled(nextState);
            if (nextState && isDirtyRef.current) saveHiringInfo(false);
          }}
          onClose={handleCloseModal}
          activeTab={activeTab}
          onSelectTab={handleTabChange}
          currentStepIndex={currentStepIndex}
        />

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "personal" && (
            <EditHiringPersonalTab
              candidate={candidate}
              formData={formData}
              onChange={handleChange}
            />
          )}

          {activeTab === "org" && (
            <EditHiringOrgTab
              formData={formData}
              onChange={handleChange}
              cleanBranches={cleanBranches}
              currentBranch={currentBranch}
              currentBranchName={currentBranchName}
              workSites={workSites}
              currentSiteSelectValue={currentSiteSelectValue}
              onSelectBranch={handleSelectBranch}
              onSelectSite={handleSelectSite}
            />
          )}

          {activeTab === "terms" && (
            <EditHiringTermsTab
              formData={formData}
              onChange={handleChange}
              buManagers={buManagers}
              buCeos={buCeos}
            />
          )}

          {activeTab === "compensation" && (
            <EditHiringCompTab
              formData={formData}
              onChange={handleChange}
            />
          )}

          {activeTab === "contact" && (
            <EditHiringContactTab
              formData={formData}
              onChange={handleChange}
            />
          )}

          <EditHiringModalFooter
            currentStepIndex={currentStepIndex}
            autoSaveEnabled={autoSaveEnabled}
            lastSavedAt={lastSavedAt}
            saving={saving}
            onPrevStep={goToPrevStep}
            onNextStep={goToNextStep}
            onClose={handleCloseModal}
          />
        </form>
      </div>
    </div>
  );
};
