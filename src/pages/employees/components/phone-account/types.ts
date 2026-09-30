import type { Employee, AppRole } from "../../types";

export interface SetUpPhoneAccountModalProps {
  employee: Employee | null;
  roles: AppRole[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employeeId: string;
    phone: string;
    password?: string;
    displayName: string;
    roleId?: string | number | null;
    sendInvite?: boolean;
  }) => Promise<boolean | string>;
}

export interface SuccessData {
  phone: string;
  name: string;
  password?: string;
  inviteLink?: string;
}
