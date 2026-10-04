import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!profile.roleLoading && !profile.isSuperAdmin && activeTab === "security") {
      setActiveTab("overview");
    }
  }, [profile.roleLoading, profile.isSuperAdmin, activeTab]);

  const navItems: { id: ProfileTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "ri-macbook-line" },
    { id: "account", label: "Account Settings", icon: "ri-settings-3-line" },
    { id: "login_attempts", label: "Login Attempts", icon: "ri-lock-line" },
    ...(profile.isSuperAdmin ? [{ id: "security" as ProfileTab, label: "Security", icon: "ri-shield-check-line" }] : []),
  ];

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 min-h-screen bg-[#F0F3F8] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 overflow-x-hidden">
      {/* Top Page Title matching Screenshot 1 */}
      <div className="mb-4 sm:mb-5">
        <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
          My Profile
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-5 lg:gap-6 items-start w-full max-w-7xl min-w-0">
        {/* ── LEFT SIDEBAR / TOP BAR ON MOBILE ── */}
        <div className="w-full md:w-64 lg:w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 sm:p-6 flex flex-col items-center shrink-0">
          {/* Avatar with Super Admin Golden Frame & Photo Upload Button */}
          <div className="relative group cursor-pointer" onClick={() => profile.fileInputRef.current?.click()}>
            <GoldFramedAvatar
              avatarUrl={profile.avatarUrl}
              initials={profile.initials}
              size="lg"
              isSuperAdmin={profile.isSuperAdmin}
            />
            {/* Quick edit badge overlay */}
            <div
              className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#253C7D] hover:bg-[#1D3066] text-white flex items-center justify-center text-xs shadow-md border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-110"
              title="Upload photo"
            >
              <i className="ri-camera-fill text-xs" />
            </div>
            <input
              ref={profile.fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={profile.handleAvatarSelect}
            />
          </div>

          {/* User Name */}
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-3 text-center truncate max-w-full">
            {profile.displayName || "Yos Steven"}
          </h2>

          {/* Navigation Menu */}
          <nav className="w-full mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-[#253C7D] dark:text-sky-400 border border-slate-200/80 dark:border-slate-700 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <i className={`${item.icon} text-base shrink-0 ${isActive ? "text-[#253C7D] dark:text-sky-400" : "text-slate-400"}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <i className={`ri-arrow-right-s-line text-sm shrink-0 ${isActive ? "text-[#253C7D] dark:text-sky-400 font-bold" : "text-slate-300 dark:text-slate-600"}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── RIGHT MAIN PANEL ── */}
        <div className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 sm:p-6 min-h-[420px]">
          {activeTab === "overview" && (
            <ProfileEmployeeInfoCard
              employee={profile.employee}
              displayName={profile.displayName}
              avatarUrl={profile.avatarUrl}
              initials={profile.initials}
              managerName={profile.managerName}
              employeeLoading={profile.employeeLoading}
              onAvatarClick={() => profile.fileInputRef.current?.click()}
              isSuperAdmin={profile.isSuperAdmin}
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
              userRole={profile.role?.name || (profile.isSuperAdmin ? "Super Admin" : "Employee")}
              isSuperAdmin={profile.isSuperAdmin}
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
            <ProfileSecurityTab email={profile.user?.email} isSuperAdmin={profile.isSuperAdmin} />
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
