import { memo, useState } from "react";
import type { AppRole, DirectoryEmployee, NewUserState } from "../types";
import { AddUserAccountTypeBar } from "./AddUserAccountTypeBar";
import { AddUserInputFields } from "./AddUserInputFields";
import { AddUserPhoneSection } from "./AddUserPhoneSection";
import { AddUserFormActions } from "./AddUserFormActions";
import { useAddUserFormData, type BranchOption } from "../hooks/useAddUserFormData";
import { useAddUserFormHandlers } from "../hooks/useAddUserFormHandlers";

interface AddUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  newUser: NewUserState;
  setNewUser: React.Dispatch<React.SetStateAction<NewUserState>>;
  selectedEmployeeEmail: string;
  setSelectedEmployeeEmail: (email: string) => void;
  employees: DirectoryEmployee[];
  branches?: BranchOption[];
  filterBranch?: string;
  roles: AppRole[];
  savingUser: boolean;
  onSaveUser: () => void;
}

export const AddUserForm = memo(function AddUserForm({
  isOpen,
  onClose,
  newUser,
  setNewUser,
  selectedEmployeeEmail,
  setSelectedEmployeeEmail,
  employees,
  branches = [],
  filterBranch = "all",
  roles,
  savingUser,
  onSaveUser,
}: AddUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const accountType = newUser.accountType || (newUser.phone && !newUser.email ? "phone" : "email");

  const {
    filteredEmployeesForAutofill,
    selectedEmpObj,
    formBuRoles,
    formSiteRoles,
    formGlobalRoles,
  } = useAddUserFormData({
    employees,
    accountType,
    branches,
    filterBranch,
    roles,
    selectedEmployeeEmail,
    newUserEmployeeId: newUser.employee_id,
  });

  const {
    handleSelectEmployee,
    handleClearSelection,
    handleSwitchAccountType,
    generateRandomPassword,
  } = useAddUserFormHandlers({
    employees,
    roles,
    setNewUser,
    setSelectedEmployeeEmail,
    setShowPassword,
  });

  if (!isOpen) return null;

  const isSubmitDisabled =
    savingUser ||
    (accountType === "email" && !newUser.email?.trim()) ||
    (accountType === "phone" &&
      (!newUser.phone?.trim() || (!newUser.sendInvite && (newUser.password || "").length < 6)));

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">
            Provision User Account
          </h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Select an employee from the directory or manually assign login credentials and roles.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-lg" />
        </button>
      </div>

      <AddUserAccountTypeBar
        accountType={accountType}
        newUser={newUser}
        setNewUser={setNewUser}
        onSwitchAccountType={handleSwitchAccountType}
      />

      <AddUserInputFields
        accountType={accountType}
        newUser={newUser}
        setNewUser={setNewUser}
        filteredEmployees={filteredEmployeesForAutofill}
        selectedEmployeeEmail={selectedEmployeeEmail}
        selectedEmpObj={selectedEmpObj}
        formBuRoles={formBuRoles}
        formSiteRoles={formSiteRoles}
        formGlobalRoles={formGlobalRoles}
        onSelectEmployee={handleSelectEmployee}
        onClearSelection={handleClearSelection}
      />

      {accountType === "phone" && (
        <AddUserPhoneSection
          newUser={newUser}
          setNewUser={setNewUser}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onGeneratePassword={generateRandomPassword}
        />
      )}

      <AddUserFormActions
        savingUser={savingUser}
        accountType={accountType}
        newUser={newUser}
        isSubmitDisabled={isSubmitDisabled}
        onClose={onClose}
        onSaveUser={onSaveUser}
      />
    </div>
  );
});
