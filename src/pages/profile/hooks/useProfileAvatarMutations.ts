import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { invalidateMyEmployeeCache } from "@/hooks/useMyEmployee";
import { toast } from "@/components/Toast";
import { uploadMediaToS3 } from "@/lib/s3-storage";
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
        let publicUrl = "";
        try {
          const s3File = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          const s3Item = await uploadMediaToS3(s3File, `avatars/${user.id}`);
          publicUrl = s3Item.url;
        } catch (s3Err) {
          console.warn("AWS S3 upload failed, falling back to Supabase:", s3Err);
          const path = `${user.id}/avatar.jpg`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(path, blob, { upsert: true, cacheControl: "3600" });
          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from("avatars").getPublicUrl(path);
          publicUrl = `${data.publicUrl}?t=${Date.now()}`;
        }

        await updateProfile({ avatar_url: publicUrl });

        if (employee?.id) {
          await supabase.from("employees").update({ avatar_url: publicUrl }).eq("id", employee.id);
          invalidateMyEmployeeCache();
        }
        toast("Photo updated", "Your profile photo has been saved to AWS S3.", "success");
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
      const blob = await res.blob();
      setAvatarSrc(URL.createObjectURL(blob));
    } catch {
      toast("Error", "Could not load existing photo for editing.", "error");
    }
  }, [user, avatarUrl]);

  const handleRemoveAvatar = useCallback(async () => {
    if (!user) return;
    setRemovingAvatar(true);
    try {
      const { data: files } = await supabase.storage.from("avatars").list(user.id);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(paths);
      }

      await updateProfile({ avatar_url: "" });

      if (employee?.id) {
        await supabase.from("employees").update({ avatar_url: null }).eq("id", employee.id);
        invalidateMyEmployeeCache();
      }
      toast("Photo removed", "Your profile photo has been reset to default.", "success");
    } catch (err: any) {
      toast("Error", err.message || "Could not remove photo.", "error");
    } finally {
      setRemovingAvatar(false);
    }
  }, [user, employee?.id, updateProfile]);

  return {
    avatarSrc,
    setAvatarSrc,
    savingCrop,
    removingAvatar,
    editMenuOpen,
    setEditMenuOpen,
    fileInputRef,
    avatarUrl,
    handleAvatarSelect,
    handleCropConfirm,
    handleEditAvatar,
    handleRemoveAvatar,
  };
}
