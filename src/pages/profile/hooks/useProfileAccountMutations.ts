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
  phone: string;
}

export function useProfileAccountMutations({
  employee,
  setEmployee,
  displayName,
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

  const handleSaveName = useCallback(async () => {
    if (!displayName.trim()) {
      toast("Name required", "Display name can't be empty.", "error");
      return;
    }
    setSavingName(true);
    try {
      await updateProfile({ display_name: displayName.trim() });
      if (employee?.id) {
        const nameParts = displayName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        await supabase
          .from("employees")
          .update({ first_name: firstName, last_name: lastName })
          .eq("id", employee.id);
        invalidateMyEmployeeCache();
      }
      toast("Saved", "Your name has been updated.", "success");
    } catch (err: any) {
      toast("Failed", err.message || "Could not update name.", "error");
    } finally {
      setSavingName(false);
    }
  }, [displayName, employee?.id, updateProfile]);

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
