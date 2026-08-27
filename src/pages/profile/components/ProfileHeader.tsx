import { memo } from "react";

export const ProfileHeader = memo(function ProfileHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">My Profile</h1>
      <p className="text-[13px] text-gray-500 mt-1">Manage your personal account details</p>
    </div>
  );
});
