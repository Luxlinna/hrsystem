import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { invalidateMyEmployeeCache } from "@/hooks/useMyEmployee";
import { toast } from "@/components/Toast";
import type { MyEmployee } from "../types";

interface UseProfileMutationsProps {
  employee: MyEmployee | null;
  setEmployee: React.Dispatch<React.SetStateAction<MyEmployee | null>>;
  displayName: string;
  phone: string;
}

export function useProfileMutations({
  employee,
  setEmployee,
  displayName,
  phone,
}: UseProfileMutationsProps) {
  const { user, updateProfile, updatePassword } = useAuth();

  const [savingName, setSavingName] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [savingCrop, setSavingCrop] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

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

  const handleAvatarSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;
      if (!file.type.startsWith("image/")) {
        toast("Invalid file", "Please choose an image file.", "error");
        e.target.value = "";
        return;
      }
      setAvatarSrc(URL.createObjectURL(file));
      e.target.value = "";
    },
    [user]
  );

  const handleCropConfirm = useCallback(
    async (blob: Blob) => {
      if (!user) return;
      setSavingCrop(true);
      try {
        const path = `${user.id}/avatar.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { upsert: true, cacheControl: "3600" });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
        await updateProfile({ avatar_url: publicUrl });

        if (employee?.id) {
          await supabase.from("employees").update({ avatar_url: publicUrl }).eq("id", employee.id);
          invalidateMyEmployeeCache();
        }
        toast("Photo updated", "Your profile photo has been changed.", "success");
      } catch (err: any) {
        toast("Upload failed", err.message || "Could not upload photo.", "error");
      } finally {
        setSavingCrop(false);
        if (avatarSrc) URL.revokeObjectURL(avatarSrc);
        setAvatarSrc(null);
      }
    },
    [user, employee?.id, updateProfile, avatarSrc]
  );

  const handleEditAvatar = useCallback(async () => {
    if (!user || !avatarUrl) return;
    try {
      const res = await fetch(avatarUrl);
      if (!res.ok) throw new Error("Could not load your photo for editing.");
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) throw new Error("The current photo is not a valid image.");
      setAvatarSrc(URL.createObjectURL(blob));
    } catch (err: any) {
      toast("Failed", err.message || "Could not load your photo for editing.", "error");
    }
  }, [user, avatarUrl]);

  const closeCropModal = useCallback(() => {
    if (avatarSrc) URL.revokeObjectURL(avatarSrc);
    setAvatarSrc(null);
  }, [avatarSrc]);

  const handleRemoveAvatar = useCallback(async () => {
    if (!user) return;
    setRemovingAvatar(true);
    try {
      const { data: files, error: listError } = await supabase.storage.from("avatars").list(user.id);
      if (listError) throw listError;
      const paths = (files || [])
        .filter((f) => !f.name.startsWith("."))
        .map((f) => `${user.id}/${f.name}`);
      if (paths.length > 0) {
        const { error: removeError } = await supabase.storage.from("avatars").remove(paths);
        if (removeError) throw removeError;
      }
      await updateProfile({ avatar_url: "" });
      if (employee?.id) {
        await supabase.from("employees").update({ avatar_url: null }).eq("id", employee.id);
        invalidateMyEmployeeCache();
      }
      toast("Photo removed", "Your profile photo has been removed.", "success");
    } catch (err: any) {
      toast("Failed", err.message || "Could not remove photo.", "error");
    } finally {
      setRemovingAvatar(false);
    }
  }, [user, employee?.id, updateProfile]);

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
    avatarUrl,
    avatarSrc,
    savingCrop,
    removingAvatar,
    editMenuOpen,
    setEditMenuOpen,
    fileInputRef,
    savingName,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    savingPassword,
    savingPhone,
    handleSavePhone,
    handleAvatarSelect,
    handleCropConfirm,
    handleEditAvatar,
    closeCropModal,
    handleRemoveAvatar,
    handleSaveName,
    handleChangePassword,
  };
}
