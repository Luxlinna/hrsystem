import { useState } from "react";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileAvatarSection } from "./components/ProfileAvatarSection";
import { ProfileAccountForm } from "./components/ProfileAccountForm";
import { ProfileProfessionalSection } from "./components/ProfileProfessionalSection";
import { ProfileWorkInfoSidebar } from "./components/ProfileWorkInfoSidebar";
import AvatarCropModal from "@/components/AvatarCropModal";
import { toast } from "@/components/Toast";
import { useProfile } from "./hooks/useProfile";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"candidate" | "account">("candidate");

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

    location,
    setLocation,
    education,
    setEducation,
    workExperience,
    setWorkExperience,
    skills,
    setSkills,
    languages,
    setLanguages,
    expectedSalary,
    setExpectedSalary,
    noticePeriod,
    setNoticePeriod,
    resumeUrl,
    resumeName,
    savingProfessional,
    uploadingResume,
    handleSaveProfessional,
    handleResumeUpload,
    handleRemoveResume,
  } = useProfile();

  const candidateId = employee?.candidate_code || (employee?.candidate_id ? `CAN-2026-${employee.candidate_id.slice(0, 6).toUpperCase()}` : null);

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#F8FAFC] font-sans">
      {/* Header */}
      <ProfileHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        {/* ── LEFT: account & candidate master ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Avatar + name */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
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

            {/* Segmented Tab Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/70 mt-6">
              <button
                type="button"
                onClick={() => setActiveTab("candidate")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === "candidate"
                    ? "bg-white text-[#253C7D] shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <i className="ri-profile-line text-[15px]"></i>
                <span>Candidate Master & CV</span>
                {candidateId && (
                  <span className="text-[10px] font-mono font-bold bg-blue-50 text-[#253C7D] px-2 py-0.5 rounded-md border border-blue-200/60 ml-1">
                    {candidateId}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("account")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                  activeTab === "account"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <i className="ri-shield-keyhole-line text-[15px]"></i>
                <span>Account & Security</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Candidate Master & CV */}
          {activeTab === "candidate" && (
            <ProfileProfessionalSection
              employee={employee}
              location={location}
              setLocation={setLocation}
              education={education}
              setEducation={setEducation}
              workExperience={workExperience}
              setWorkExperience={setWorkExperience}
              skills={skills}
              setSkills={setSkills}
              languages={languages}
              setLanguages={setLanguages}
              expectedSalary={expectedSalary}
              setExpectedSalary={setExpectedSalary}
              noticePeriod={noticePeriod}
              setNoticePeriod={setNoticePeriod}
              resumeUrl={resumeUrl}
              resumeName={resumeName}
              savingProfessional={savingProfessional}
              uploadingResume={uploadingResume}
              onSaveProfessional={handleSaveProfessional}
              onResumeUpload={handleResumeUpload}
              onRemoveResume={handleRemoveResume}
            />
          )}

          {/* Tab 2: Account & Security Form */}
          {activeTab === "account" && (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
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
          )}
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
