import { useState } from "react";
import { useProfile } from "./hooks/useProfile";
import { GoldFramedAvatar } from "./components/GoldFramedAvatar";
import { ProfileEmployeeInfoCard } from "./components/ProfileEmployeeInfoCard";
import { ProfileAccountForm } from "./components/ProfileAccountForm";
import { ProfileLoginAttemptsTab } from "./components/ProfileLoginAttemptsTab";
import { ProfileSecurityTab } from "./components/ProfileSecurityTab";
import AvatarCropModal from "@/components/AvatarCropModal";

type ProfileTab = "overview" | "account" | "login_attempts" | "security";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const profile = useProfile();

  const navItems: { id: ProfileTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "ri-macbook-line" },
    { id: "account", label: "Account Settings", icon: "ri-settings-3-line" },
    { id: "login_attempts", label: "Login Attempts", icon: "ri-lock-line" },
    { id: "security", label: "Security", icon: "ri-shield-check-line" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F0F3F8] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
      {/* Top Page Title matching Screenshot 1 */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          My Profile
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start w-full max-w-7xl">
        {/* ── LEFT SIDEBAR: Avatar, Name & Navigation ── */}
        <div className="w-full md:w-64 lg:w-72 bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-2xs p-6 flex flex-col items-center shrink-0">
          {/* Avatar with Golden Frame */}
          <div className="relative group cursor-pointer" onClick={profile.handleAvatarSelect}>
            <GoldFramedAvatar
              avatarUrl={profile.avatarUrl}
              initials={profile.initials}
              size="lg"
            />
            {/* Quick edit badge overlay */}
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-md border-2 border-white dark:border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="ri-camera-line" />
            </div>
            <input
              ref={profile.fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={profile.handleEditAvatar}
            />
          </div>

          {/* User Name */}
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-3 text-center">
            {profile.displayName || "Yos Steven"}
          </h2>

          {/* Navigation Menu */}
          <nav className="w-full mt-6 pt-2 space-y-0.5 border-t border-slate-100 dark:border-slate-800">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-[#253C7D] dark:text-sky-400 border-l-3 border-[#253C7D] dark:border-sky-400 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <i className={`${item.icon} text-sm ${isActive ? "text-[#253C7D] dark:text-sky-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── RIGHT MAIN PANEL ── */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-md border border-slate-200/80 dark:border-slate-800 shadow-2xs p-6 min-h-[420px]">
          {activeTab === "overview" && (
            <ProfileEmployeeInfoCard
              employee={profile.employee}
              displayName={profile.displayName}
              avatarUrl={profile.avatarUrl}
              initials={profile.initials}
              managerName={profile.managerName}
              employeeLoading={profile.employeeLoading}
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
              userRole={profile.role?.name || "Admin"}
            />
          )}

          {activeTab === "login_attempts" && (
            <ProfileLoginAttemptsTab
              userCreatedAt={profile.user?.created_at}
              userLastSignInAt={profile.user?.last_sign_in_at}
              email={profile.user?.email}
            />
          )}

          {activeTab === "security" && (
            <ProfileSecurityTab email={profile.user?.email} />
          )}
        </div>
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

