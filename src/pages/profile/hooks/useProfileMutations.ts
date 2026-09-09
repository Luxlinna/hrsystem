import type { MyEmployee } from "../types";
import { useProfileAvatarMutations } from "./useProfileAvatarMutations";
import { useProfileAccountMutations } from "./useProfileAccountMutations";
import { useProfileProfessionalMutations } from "./useProfileProfessionalMutations";

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
  const professionalMutations = useProfileProfessionalMutations({
    employee,
    setEmployee,
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

    location: professionalMutations.location,
    setLocation: professionalMutations.setLocation,
    education: professionalMutations.education,
    setEducation: professionalMutations.setEducation,
    workExperience: professionalMutations.workExperience,
    setWorkExperience: professionalMutations.setWorkExperience,
    skills: professionalMutations.skills,
    setSkills: professionalMutations.setSkills,
    languages: professionalMutations.languages,
    setLanguages: professionalMutations.setLanguages,
    expectedSalary: professionalMutations.expectedSalary,
    setExpectedSalary: professionalMutations.setExpectedSalary,
    noticePeriod: professionalMutations.noticePeriod,
    setNoticePeriod: professionalMutations.setNoticePeriod,
    resumeUrl: professionalMutations.resumeUrl,
    resumeName: professionalMutations.resumeName,
    savingProfessional: professionalMutations.savingProfessional,
    uploadingResume: professionalMutations.uploadingResume,
    handleSaveProfessional: professionalMutations.handleSaveProfessional,
    handleResumeUpload: professionalMutations.handleResumeUpload,
    handleRemoveResume: professionalMutations.handleRemoveResume,
  };
}
