import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { invalidateMyEmployeeCache } from "@/hooks/useMyEmployee";
import { toast } from "@/components/Toast";
import type { MyEmployee } from "../types";

interface UseProfileAvatarMutationsProps {
  employee: MyEmployee | null;
}

export function useProfileAvatarMutations({ employee }: UseProfileAvatarMutationsProps) {
  const { user, updateProfile } = useAuth();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [savingCrop, setSavingCrop] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

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

  return {
    avatarUrl,
    avatarSrc,
    savingCrop,
    removingAvatar,
    editMenuOpen,
    setEditMenuOpen,
    fileInputRef,
    handleAvatarSelect,
    handleCropConfirm,
    handleEditAvatar,
    closeCropModal,
    handleRemoveAvatar,
  };
}
