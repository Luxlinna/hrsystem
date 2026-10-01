import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { invalidateMyEmployeeCache } from "@/hooks/useMyEmployee";
import { toast } from "@/components/Toast";
import type { MyEmployee } from "../types";

interface UseProfileAccountMutationsProps {
  employee: MyEmployee | null;
  setEmployee: React.Dispatch<React.SetStateAction<MyEmployee | null>>;
  displayName: string;
  setDisplayName?: React.Dispatch<React.SetStateAction<string>>;
  phone: string;
}

export function useProfileAccountMutations({
  employee,
  setEmployee,
  displayName,
  setDisplayName,
  phone,
}: UseProfileAccountMutationsProps) {
  const { updateProfile, updatePassword } = useAuth();

  const [savingName, setSavingName] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  const handleSavePhone = useCallback(async () => {
    if (!employee) return;
    setSavingPhone(true);
    const { error } = await supabase
      .from("employees")
      .update({ phone: phone.trim() || null })
      .eq("id", employee.id);
    setSavingPhone(false);
    if (error) {
      toast("Failed", error.message || "Could not update phone number.", "error");
      return;
    }
    setEmployee((prev) => (prev ? { ...prev, phone: phone.trim() || null } : prev));
    toast("Saved", "Your phone number has been updated.", "success");
  }, [employee, phone, setEmployee]);

  const handleSaveName = useCallback(async (payload?: { firstName?: string; lastName?: string; username?: string }) => {
    const fName = payload?.firstName !== undefined ? payload.firstName.trim() : (employee?.first_name || "");
    const lName = payload?.lastName !== undefined ? payload.lastName.trim() : (employee?.last_name || "");
    const empCode = payload?.username !== undefined ? payload.username.trim() : (employee?.employee_code || "");
    
    const combined = `${fName} ${lName}`.trim() || displayName.trim();
    if (!combined) {
      toast("Name required", "Please enter a valid first and last name.", "error");
      return;
    }

    setSavingName(true);
    try {
      await updateProfile({ display_name: combined });
      if (setDisplayName) {
        setDisplayName(combined);
      }

      if (employee?.id) {
        const empUpdates: Record<string, any> = {
          first_name: fName,
          last_name: lName,
        };
        if (empCode) {
          empUpdates.employee_code = empCode;
        }

        const { error } = await supabase
          .from("employees")
          .update(empUpdates)
          .eq("id", employee.id);

        if (error) throw error;

        setEmployee((prev) => (prev ? {
          ...prev,
          first_name: fName,
          last_name: lName,
          employee_code: empCode || prev.employee_code,
        } : prev));

        invalidateMyEmployeeCache();
      }

      toast("Saved", "Account settings have been updated successfully.", "success");
    } catch (err: any) {
      toast("Failed", err.message || "Could not update account settings.", "error");
    } finally {
      setSavingName(false);
    }
  }, [displayName, employee, updateProfile, setDisplayName, setEmployee]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 8) {
      toast("Too short", "Password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("Mismatch", "Passwords don't match.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast("Password changed", "Your password has been updated.", "success");
    } catch (err: any) {
      toast("Failed", err.message || "Could not change password.", "error");
    } finally {
      setSavingPassword(false);
    }
  }, [newPassword, confirmPassword, updatePassword]);

  return {
    savingName,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    savingPassword,
    savingPhone,
    handleSavePhone,
    handleSaveName,
    handleChangePassword,
  };
}
