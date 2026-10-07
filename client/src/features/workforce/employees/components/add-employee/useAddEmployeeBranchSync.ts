import { useEffect, useCallback } from "react";
import type { EmployeeFormState } from "../../types";

interface BranchSyncProps {
  isOpen: boolean;
  isSuperAdmin?: boolean;
  targetBranch?: string | null;
  userBranchId?: string | null;
  form: EmployeeFormState;
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormState>>;
  cleanBranches: Array<{ id: string; name: string; location?: string }>;
  workSites: Array<{ id: string; name: string; description: string | null; branch_id?: string | null; is_default?: boolean; city?: string | null; province?: string | null }>;
  currentBranch?: { id: string; name: string; location?: string };
  getBranchCode: (name: string) => string;
  deriveBuHandle: (name: string, code: string) => string;
  onFieldTouch?: () => void;
}

export function useAddEmployeeBranchSync({
  isOpen,
  isSuperAdmin = true,
  targetBranch,
  userBranchId,
  form,
  setForm,
  cleanBranches,
  workSites,
  currentBranch,
  getBranchCode,
  deriveBuHandle,
  onFieldTouch,
}: BranchSyncProps) {
  const handleSelectBranch = useCallback(
    (branchId: string) => {
      onFieldTouch?.();
      const branch = cleanBranches.find((b) => b.id === branchId);
      if (branch) {
        const code = getBranchCode(branch.name);
        const handle = deriveBuHandle(branch.name, code);
        const defaultSite =
          workSites.find((w) => w.branch_id === branch.id && w.is_default) ||
          workSites.find((w) => w.branch_id === branch.id) ||
          workSites.find((w) => w.is_default);

        setForm((prev) => ({
          ...prev,
          branch_id: branch.id,
          code_bu: code,
          bu_full_name: branch.name,
          handle_bu: handle,
          site: defaultSite ? defaultSite.name : (prev.site || ""),
          working_location: defaultSite
            ? (defaultSite.city || defaultSite.province || defaultSite.description || branch.location || "Phnom Penh")
            : (branch.location || "Phnom Penh"),
          default_work_location_id: defaultSite ? defaultSite.id : (prev.default_work_location_id || ""),
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          branch_id: "",
          code_bu: "",
          bu_full_name: "",
          handle_bu: "",
          site: "",
          default_work_location_id: "",
        }));
      }
    },
    [cleanBranches, workSites, getBranchCode, deriveBuHandle, setForm, onFieldTouch]
  );

  useEffect(() => {
    if (isOpen && !isSuperAdmin) {
      const defaultBranch = targetBranch || userBranchId || "";
      if (defaultBranch && form.branch_id !== defaultBranch) {
        handleSelectBranch(defaultBranch);
      }
    }
  }, [isOpen, isSuperAdmin, targetBranch, userBranchId, form.branch_id, handleSelectBranch]);

  useEffect(() => {
    if (!isOpen || !cleanBranches.length) return;
    const branchId = form.branch_id || (!isSuperAdmin ? (targetBranch || userBranchId) : "");
    if (!branchId) return;

    const branch = cleanBranches.find((b) => b.id === branchId);
    if (branch) {
      const code = getBranchCode(branch.name);
      const handle = deriveBuHandle(branch.name, code);
      const defaultSite =
        workSites.find((w) => w.branch_id === branch.id && w.is_default) ||
        workSites.find((w) => w.branch_id === branch.id) ||
        workSites.find((w) => w.is_default);

      setForm((prev) => {
        if (
          prev.bu_full_name &&
          prev.handle_bu &&
          prev.code_bu &&
          prev.branch_id === branch.id &&
          (prev.default_work_location_id || prev.site)
        ) {
          return prev;
        }

        return {
          ...prev,
          branch_id: branch.id,
          code_bu: prev.code_bu || code,
          bu_full_name: prev.bu_full_name || branch.name,
          handle_bu: prev.handle_bu || handle,
          site: prev.site || (defaultSite ? defaultSite.name : ""),
          default_work_location_id: prev.default_work_location_id || (defaultSite ? defaultSite.id : ""),
          working_location: prev.working_location || (defaultSite ? (defaultSite.city || defaultSite.province || defaultSite.description || branch.location || "Phnom Penh") : (branch.location || "Phnom Penh")),
        };
      });
    }
  }, [isOpen, isSuperAdmin, cleanBranches, workSites, form.branch_id, targetBranch, userBranchId, getBranchCode, deriveBuHandle, setForm]);

  const handleSelectSite = useCallback(
    (siteIdOrVal: string) => {
      onFieldTouch?.();
      if (!siteIdOrVal) {
        setForm((prev) => ({
          ...prev,
          default_work_location_id: "",
          site: "",
        }));
        return;
      }

      const targetSite = workSites.find((w) => w.id === siteIdOrVal || w.name === siteIdOrVal);
      if (targetSite) {
        let loc = targetSite.city || targetSite.province || targetSite.description || targetSite.name;
        const lower = (targetSite.name || "").toLowerCase();
        if (lower.includes("kampong thom") || lower.includes("kampongthom")) loc = "Kampong Thom";
        else if (lower.includes("battambang") || lower.includes("btb")) loc = "Battambang";
        else if (lower.includes("siem reap")) loc = "Siem Reap";
        else if (lower.includes("poipet")) loc = "Poipet";

        setForm((prev) => ({
          ...prev,
          default_work_location_id: targetSite.id,
          site: targetSite.name,
          working_location: loc,
        }));
      }
    },
    [workSites, setForm, onFieldTouch]
  );

  return {
    handleSelectBranch,
    handleSelectSite,
  };
}
