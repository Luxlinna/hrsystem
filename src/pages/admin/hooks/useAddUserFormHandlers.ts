import { useCallback } from "react";
import type { AppRole, DirectoryEmployee, NewUserState } from "../types";
import { isPhoneSyntheticEmail } from "@/lib/phoneUtils";

interface UseAddUserFormHandlersParams {
  employees: DirectoryEmployee[];
  roles: AppRole[];
  setNewUser: React.Dispatch<React.SetStateAction<NewUserState>>;
  setSelectedEmployeeEmail: (email: string) => void;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useAddUserFormHandlers({
  employees,
  roles,
  setNewUser,
  setSelectedEmployeeEmail,
  setShowPassword,
}: UseAddUserFormHandlersParams) {
  const handleSelectEmployee = useCallback((emp: DirectoryEmployee) => {
    setSelectedEmployeeEmail(emp.email || emp.phone || emp.id);
    const matchingRole = roles.find(
      (role) => role.name.trim().toLowerCase() === (emp.role || "").trim().toLowerCase()
    );

    setNewUser((p) => {
      const activeType = p.accountType || (p.phone && !p.email ? "phone" : "email");
      return {
        ...p,
        accountType: activeType,
        email: activeType === "email" ? (emp.email || "") : (p.email || ""),
        phone: activeType === "phone" ? (emp.phone || "") : (p.phone || ""),
        employee_id: emp.id,
        display_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || p.display_name,
        role_id: matchingRole ? String(matchingRole.id) : p.role_id,
      };
    });
  }, [roles, setNewUser, setSelectedEmployeeEmail]);

  const handleClearSelection = useCallback(() => {
    setSelectedEmployeeEmail("");
    setNewUser((p) => ({
      ...p,
      email: "",
      phone: "",
      password: "",
      employee_id: undefined,
      display_name: "",
      role_id: "",
    }));
  }, [setNewUser, setSelectedEmployeeEmail]);

  const handleSwitchAccountType = useCallback((type: "email" | "phone") => {
    setNewUser((p) => {
      let updatedEmail = p.email;
      let updatedPhone = p.phone;
      let updatedEmpId = p.employee_id;

      if (type === "phone") {
        if (!p.phone || p.phone.replace(/\D/g, "").length < 6) {
          const emp = employees.find((e) => e.id === p.employee_id);
          if (emp?.phone && emp.phone.replace(/\D/g, "").length >= 6) {
            updatedPhone = emp.phone;
          } else {
            updatedPhone = "";
            updatedEmpId = undefined;
            setSelectedEmployeeEmail("");
          }
        }
      } else {
        if (!p.email || !p.email.includes("@") || isPhoneSyntheticEmail(p.email)) {
          const emp = employees.find((e) => e.id === p.employee_id);
          if (emp?.email && emp.email.includes("@") && !isPhoneSyntheticEmail(emp.email)) {
            updatedEmail = emp.email;
          } else {
            updatedEmail = "";
            updatedEmpId = undefined;
            setSelectedEmployeeEmail("");
          }
        }
      }

      return {
        ...p,
        accountType: type,
        email: updatedEmail,
        phone: updatedPhone,
        employee_id: updatedEmpId,
      };
    });
  }, [employees, setNewUser, setSelectedEmployeeEmail]);

  const generateRandomPassword = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser((p) => ({ ...p, password: `Staff#${rand}` }));
    setShowPassword(true);
  }, [setNewUser, setShowPassword]);

  return {
    handleSelectEmployee,
    handleClearSelection,
    handleSwitchAccountType,
    generateRandomPassword,
  };
}
