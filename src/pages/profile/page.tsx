import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileAvatarSection } from "./components/ProfileAvatarSection";
import { ProfileAccountForm } from "./components/ProfileAccountForm";
import { ProfileWorkInfoSidebar } from "./components/ProfileWorkInfoSidebar";
import AvatarCropModal from "@/components/AvatarCropModal";
import { toast } from "@/components/Toast";
import { useProfile } from "./hooks/useProfile";

export default function Profile() {
  const {
    user,
    role,
    roleLoading,
    can,
    displayName,
    setDisplayName,
    employee,
    employeeLoading,
    managerName,
    directReports,
    phone,
    setPhone,
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
    tenure,
    initials,
    handleSavePhone,
    handleAvatarSelect,
    handleCropConfirm,
    handleEditAvatar,
    closeCropModal,
    handleRemoveAvatar,
    handleSaveName,
    handleChangePassword,
  } = useProfile();

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white font-sans">
      {/* Header */}
      <ProfileHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-5xl">
        {/* ── LEFT: account (editable) ── */}
        <div className="lg:col-span-2 space-y-10">
          {/* Avatar + name */}
          <ProfileAvatarSection
            avatarUrl={avatarUrl}
            displayName={displayName}
            email={user?.email}
            initials={initials}
            savingCrop={savingCrop}
            removingAvatar={removingAvatar}
            editMenuOpen={editMenuOpen}
            setEditMenuOpen={setEditMenuOpen}
            fileInputRef={fileInputRef}
            onAvatarSelect={handleAvatarSelect}
            onEditAvatar={handleEditAvatar}
            onRemoveAvatar={handleRemoveAvatar}
          />

          {/* Form fields: Display Name, Email, Phone, Password */}
          <ProfileAccountForm
            displayName={displayName}
            setDisplayName={setDisplayName}
            savingName={savingName}
            onSaveName={handleSaveName}
            email={user?.email}
            employee={employee}
            phone={phone}
            setPhone={setPhone}
            savingPhone={savingPhone}
            onSavePhone={handleSavePhone}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            savingPassword={savingPassword}
            onChangePassword={handleChangePassword}
          />
        </div>

        {/* ── RIGHT: work info (read only) ── */}
        <ProfileWorkInfoSidebar
          role={role}
          roleLoading={roleLoading}
          employee={employee}
          employeeLoading={employeeLoading}
          tenure={tenure}
          managerName={managerName}
          userCreatedAt={user?.created_at}
          userLastSignInAt={user?.last_sign_in_at}
          directReports={directReports}
          canViewEmployees={can("employees")}
          email={user?.email}
        />
      </div>

      {/* Crop modal for new photos */}
      <AvatarCropModal
        imageSrc={avatarSrc}
        saving={savingCrop}
        onCancel={closeCropModal}
        onConfirm={handleCropConfirm}
        onError={(msg) => toast("Crop failed", msg, "error")}
      />
    </div>
  );
}
