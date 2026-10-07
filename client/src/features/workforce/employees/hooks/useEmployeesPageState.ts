import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { isPrivacyPinEnabled } from "@/lib/privacyPin";
import { INITIAL_EMPLOYEE_FORM, getBranchCode, deriveBuHandle } from "../constants";

interface UseEmployeesPageStateParams {
  isSuperAdmin: boolean;
  userBranchId: string | null;
  targetBranch: string | null;
  branches: any[];
  setForm: (f: any) => void;
  setShowAddModal: (show: boolean) => void;
  setEditingEmployeeId: (id: string | null) => void;
  inviteUser: (email: string, first: string, last: string, role?: string) => Promise<boolean>;
}

export function useEmployeesPageState({
  isSuperAdmin,
  userBranchId,
  targetBranch,
  branches,
  setForm,
  setShowAddModal,
  setEditingEmployeeId,
  inviteUser,
}: UseEmployeesPageStateParams) {
  const { user } = useAuth();
  const [showSalary, setShowSalary] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [changeStatusEmployeeId, setChangeStatusEmployeeId] = useState<string>("");

  const handleOpenChangeStatus = useCallback((emp?: any) => {
    setChangeStatusEmployeeId(emp?.id || "");
    setShowChangeStatusModal(true);
  }, []);

  const handleToggleSalary = useCallback(() => {
    if (showSalary) {
      setShowSalary(false);
      return;
    }
    if (isPrivacyPinEnabled(user?.email)) {
      setShowPinModal(true);
    } else {
      setShowSalary(true);
    }
  }, [showSalary, user?.email]);

  const handleOpenAddModal = useCallback(() => {
    setEditingEmployeeId(null);
    const effectiveBranchId = !isSuperAdmin ? (userBranchId || targetBranch || "") : "";
    const branch = branches.find((b) => b.id === effectiveBranchId);
    const branchName = branch?.name || "";
    const code = branchName ? getBranchCode(branchName) : "";
    const handle = branchName ? deriveBuHandle(branchName, code) : "";

    setForm({
      ...INITIAL_EMPLOYEE_FORM,
      branch_id: effectiveBranchId,
      code_bu: code,
      bu_full_name: branchName,
      handle_bu: handle,
      site: effectiveBranchId && branchName ? `Main Office (${branchName})` : "",
      working_location: branch?.location || "",
      default_work_location_id: "",
      department: "",
      role: "",
      position: "",
    });
    setShowAddModal(true);
  }, [isSuperAdmin, userBranchId, targetBranch, branches, setForm, setShowAddModal, setEditingEmployeeId]);

  const handleInviteEmployee = useCallback(
    (e: any) => inviteUser(e.email, e.first_name, e.last_name, e.role),
    [inviteUser]
  );

  return {
    showSalary, setShowSalary,
    showPinModal, setShowPinModal,
    showImportModal, setShowImportModal,
    showChangeStatusModal, setShowChangeStatusModal,
    changeStatusEmployeeId, setChangeStatusEmployeeId,
    handleOpenChangeStatus,
    handleToggleSalary,
    handleOpenAddModal,
    handleInviteEmployee,
  };
}
