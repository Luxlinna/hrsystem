import { useState } from "react";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileAvatarSection } from "./components/ProfileAvatarSection";
import { ProfileAccountForm } from "./components/ProfileAccountForm";
import { ProfileProfessionalSection } from "./components/ProfileProfessionalSection";
import { ProfileWorkInfoSidebar } from "./components/ProfileWorkInfoSidebar";
import AvatarCropModal from "@/components/AvatarCropModal";
import { useProfile } from "./hooks/useProfile";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"candidate" | "account">("candidate");
  const profile = useProfile();

  const candidateId =
    profile.employee?.candidate_code ||
    (profile.employee?.candidate_id
      ? `CAN-2026-${profile.employee.candidate_id.slice(0, 6).toUpperCase()}`
      : null);

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#F8FAFC] font-sans">
      <ProfileHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        {/* ── LEFT: account & candidate master ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
            <ProfileAvatarSection
              avatarUrl={profile.avatarUrl}
              displayName={profile.displayName}
              email={profile.user?.email}
              initials={profile.initials}
              savingCrop={profile.savingCrop}
              removingAvatar={profile.removingAvatar}
              editMenuOpen={profile.editMenuOpen}
              setEditMenuOpen={profile.setEditMenuOpen}
              fileInputRef={profile.fileInputRef}
              onAvatarSelect={profile.handleAvatarSelect}
              onEditAvatar={profile.handleEditAvatar}
              onRemoveAvatar={profile.handleRemoveAvatar}
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

          {activeTab === "candidate" && (
            <ProfileProfessionalSection
              employee={profile.employee}
              location={profile.location}
              setLocation={profile.setLocation}
              education={profile.education}
              setEducation={profile.setEducation}
              workExperience={profile.workExperience}
              setWorkExperience={profile.setWorkExperience}
              skills={profile.skills}
              setSkills={profile.setSkills}
              languages={profile.languages}
              setLanguages={profile.setLanguages}
              expectedSalary={profile.expectedSalary}
              setExpectedSalary={profile.setExpectedSalary}
              noticePeriod={profile.noticePeriod}
              setNoticePeriod={profile.setNoticePeriod}
              resumeUrl={profile.resumeUrl}
              resumeName={profile.resumeName}
              savingProfessional={profile.savingProfessional}
              uploadingResume={profile.uploadingResume}
              onSaveProfessional={profile.handleSaveProfessional}
              onResumeUpload={profile.handleResumeUpload}
              onRemoveResume={profile.handleRemoveResume}
            />
          )}

          {activeTab === "account" && (
            <ProfileAccountForm
              displayName={profile.displayName}
              setDisplayName={profile.setDisplayName}
              savingName={profile.savingName}
              onSaveName={profile.handleSaveName}
              email={profile.user?.email}
              employee={profile.employee}
              phone={profile.phone}
              setPhone={profile.setPhone}
              savingPhone={profile.savingPhone}
              onSavePhone={profile.handleSavePhone}
              newPassword={profile.newPassword}
              setNewPassword={profile.setNewPassword}
              confirmPassword={profile.confirmPassword}
              setConfirmPassword={profile.setConfirmPassword}
              savingPassword={profile.savingPassword}
              onChangePassword={profile.handleChangePassword}
            />
          )}
        </div>

        {/* ── RIGHT: read-only work info sidebar ── */}
        <ProfileWorkInfoSidebar
          role={profile.role}
          roleLoading={profile.roleLoading}
          employee={profile.employee}
          employeeLoading={profile.employeeLoading}
          tenure={profile.tenure}
          managerName={profile.managerName}
          userCreatedAt={profile.user?.created_at}
          userLastSignInAt={profile.user?.last_sign_in_at}
          directReports={profile.directReports}
          canViewEmployees={profile.can("employees.read")}
          email={profile.user?.email}
        />
      </div>

      {profile.avatarSrc && (
        <AvatarCropModal
          imageSrc={profile.avatarSrc}
          onConfirm={profile.handleCropConfirm}
          onCancel={profile.closeCropModal}
          saving={profile.savingCrop}
        />
      )}
    </div>
  );
}
