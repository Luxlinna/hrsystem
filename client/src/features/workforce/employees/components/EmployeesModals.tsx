import React from "react";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { CreateChangeStatusModal } from "./CreateChangeStatusModal";
import { SetUpPhoneAccountModal } from "./SetUpPhoneAccountModal";
import { ImportEmployeesModal } from "./ImportEmployeesModal";
import { PrivacyPinModal } from "@/components/PrivacyPinModal";

interface EmployeesModalsProps {
  showAddModal: boolean;
  editingEmployeeId: string | null;
  form: any;
  setForm: (f: any) => void;
  branches: any[];
  managers: any[];
  submitting: boolean;
  isSuperAdmin: boolean;
  onCloseAddModal: () => void;
  onAddEmployee: (e: React.FormEvent) => void;

  showChangeStatusModal: boolean;
  changeStatusEmployeeId: string;
  onCloseChangeStatus: () => void;
  employees: any[];
  depts: string[];
  divisions?: string[];
  positions: string[];
  onLoadEmployees: () => void;

  phoneAccountEmployee: any | null;
  roles: any[];
  onClosePhoneAccount: () => void;
  onSetUpPhoneUser: (data: {
    employeeId: string;
    phone: string;
    password?: string;
    displayName: string;
    roleId?: string | number | null;
    sendInvite?: boolean;
  }) => Promise<boolean | string>;

  showImportModal: boolean;
  actorName: string;
  roleName: string;
  onCloseImport: () => void;

  showPinModal: boolean;
  onClosePinModal: () => void;
  onPinSuccess: () => void;
  userEmail?: string;
}

export const EmployeesModals: React.FC<EmployeesModalsProps> = ({
  showAddModal,
  editingEmployeeId,
  form,
  setForm,
  branches,
  managers,
  submitting,
  isSuperAdmin,
  onCloseAddModal,
  onAddEmployee,
  showChangeStatusModal,
  changeStatusEmployeeId,
  onCloseChangeStatus,
  employees,
  depts,
  divisions = [],
  positions,
  onLoadEmployees,
  phoneAccountEmployee,
  roles,
  onClosePhoneAccount,
  onSetUpPhoneUser,
  showImportModal,
  actorName,
  roleName,
  onCloseImport,
  showPinModal,
  onClosePinModal,
  onPinSuccess,
  userEmail,
}) => {
  return (
    <>
      <AddEmployeeModal
        isOpen={showAddModal}
        isEdit={Boolean(editingEmployeeId)}
        form={form}
        setForm={setForm}
        branches={branches}
        managers={managers}
        submitting={submitting}
        isSuperAdmin={isSuperAdmin}
        onClose={onCloseAddModal}
        onSubmit={onAddEmployee}
        departments={depts}
        divisions={divisions}
        positions={positions}
      />

      <CreateChangeStatusModal
        isOpen={showChangeStatusModal}
        onClose={onCloseChangeStatus}
        employees={employees}
        branches={branches}
        divisions={divisions}
        departments={depts}
        positions={positions}
        preselectedEmployeeId={changeStatusEmployeeId}
        onSuccess={onLoadEmployees}
      />

      <SetUpPhoneAccountModal
        employee={phoneAccountEmployee}
        roles={roles}
        isOpen={Boolean(phoneAccountEmployee)}
        onClose={onClosePhoneAccount}
        onSubmit={onSetUpPhoneUser}
      />

      <ImportEmployeesModal
        isOpen={showImportModal}
        branches={branches}
        actorName={actorName}
        roleName={roleName}
        onClose={onCloseImport}
        onSuccess={onLoadEmployees}
      />

      <PrivacyPinModal
        isOpen={showPinModal}
        onClose={onClosePinModal}
        onSuccess={onPinSuccess}
        userEmail={userEmail}
        title="Privacy PIN Required"
        description="Enter your Privacy PIN code to reveal masked employee salaries."
      />
    </>
  );
};
