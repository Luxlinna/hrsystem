import type { MyEmployee } from "../types";
import { useProfileAvatarMutations } from "./useProfileAvatarMutations";
import { useProfileAccountMutations } from "./useProfileAccountMutations";

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
  const avatarMutations = useProfileAvatarMutations({ employee });
  const accountMutations = useProfileAccountMutations({
    employee,
    setEmployee,
    displayName,
    phone,
  });

  return {
    avatarUrl: avatarMutations.avatarUrl,
    avatarSrc: avatarMutations.avatarSrc,
    savingCrop: avatarMutations.savingCrop,
    removingAvatar: avatarMutations.removingAvatar,
    editMenuOpen: avatarMutations.editMenuOpen,
    setEditMenuOpen: avatarMutations.setEditMenuOpen,
    fileInputRef: avatarMutations.fileInputRef,
    handleAvatarSelect: avatarMutations.handleAvatarSelect,
    handleCropConfirm: avatarMutations.handleCropConfirm,
    handleEditAvatar: avatarMutations.handleEditAvatar,
    closeCropModal: avatarMutations.closeCropModal,
    handleRemoveAvatar: avatarMutations.handleRemoveAvatar,

    savingName: accountMutations.savingName,
    newPassword: accountMutations.newPassword,
    setNewPassword: accountMutations.setNewPassword,
    confirmPassword: accountMutations.confirmPassword,
    setConfirmPassword: accountMutations.setConfirmPassword,
    savingPassword: accountMutations.savingPassword,
    savingPhone: accountMutations.savingPhone,
    handleSavePhone: accountMutations.handleSavePhone,
    handleSaveName: accountMutations.handleSaveName,
    handleChangePassword: accountMutations.handleChangePassword,
  };
}
