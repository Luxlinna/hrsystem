import { memo } from "react";
import { Link } from "react-router-dom";
import type { Employee } from "../../types";
import { getProfileStatusMeta } from "../../constants";
import { isPhoneSyntheticEmail } from "@/lib/phoneUtils";

interface ProfileHeaderProps {
  employee: Employee;
  canEdit: boolean;
  editing: boolean;
  hasBiometric?: boolean;
  uploadingAvatar: boolean;
  onToggleEditing: () => void;
  onUploadAvatar: (file: File) => void;
}

export const ProfileHeader = memo(function ProfileHeader({
  employee,
  canEdit,
  editing,
  hasBiometric = false,
  uploadingAvatar,
  onToggleEditing,
  onUploadAvatar,
}: ProfileHeaderProps) {
  const initials = `${employee?.first_name?.[0] || ""}${employee?.last_name?.[0] || ""}`;
  const statusMeta = getProfileStatusMeta(employee.status);

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[12px] text-gray-500">
        <Link to="/" className="hover:text-[#253C7D] transition-colors">
          Dashboard
        </Link>
        <i className="ri-arrow-right-s-line" />
        <Link to="/employees" className="hover:text-[#253C7D] transition-colors">
          Directory
        </Link>
        <i className="ri-arrow-right-s-line" />
        <span className="text-gray-900 font-medium">
          {employee.first_name} {employee.last_name}
        </span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 mb-6 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
          {/* Staff Identity Block: Photo -> Full Name + Position (below photo) -> Division & Department */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3 shrink-0 lg:pr-8 lg:border-r border-gray-100 w-full sm:w-auto">
            {/* 1. Photo of Staff */}
            <div className="relative">
              {employee.avatar_url ? (
                <img
                  src={employee.avatar_url}
                  alt={employee.first_name}
                  className="w-28 h-28 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-gray-200"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] flex items-center justify-center text-white text-3xl font-extrabold shadow-md">
                  {initials}
                </div>
              )}
              {canEdit && (
                <label
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#253C7D] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#1F336A] transition-colors shadow-sm"
                  title="Upload staff photo"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadAvatar(file);
                    }}
                  />
                  <i className="ri-camera-line text-white text-sm" />
                </label>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* 2. Full Name + Position (directly below photo) */}
            <div className="space-y-0.5">
              <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-sm font-bold text-[#253C7D]">
                {employee.role || "No Position Assigned"}
              </p>
            </div>

            {/* 3. Division / Department */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
              {employee.branches?.name && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200/60" title="Division / Business Unit">
                  <i className="ri-building-line text-gray-500" />
                  {employee.branches.name}
                </span>
              )}
              {employee.department && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/60" title="Department">
                  <i className="ri-community-line text-indigo-500" />
                  {employee.department}
                </span>
              )}
              {employee.work_locations?.name && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60" title="Assigned Work Site">
                  <i className="ri-map-pin-2-line text-emerald-500" />
                  {employee.work_locations.name}
                </span>
              )}
            </div>
          </div>

          {/* Details & Action Column */}
          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  title={statusMeta.description}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full w-fit cursor-default ${statusMeta.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                  {statusMeta.label}
                </span>
                <span className="text-[12px] text-gray-400 font-medium">
                  {statusMeta.description}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {canEdit && (
                  <button
                    onClick={onToggleEditing}
                    className="px-4 py-2 bg-[#253C7D] text-white text-[13px] font-semibold rounded-xl hover:bg-[#1F336A] transition-colors cursor-pointer shadow-xs"
                  >
                    <i className={`ri-${editing ? "close" : "edit"}-line mr-1.5`} />
                    {editing ? "Cancel" : "Edit Profile"}
                  </button>
                )}
                <Link
                  to="/org-chart"
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-[13px] font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
                >
                  <i className="ri-organization-chart mr-1.5 text-gray-500" />
                  Org Chart
                </Link>
              </div>
            </div>

            {/* Quick Contact & Credentials Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center shrink-0 text-sm font-bold">
                  <i className="ri-mail-line" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Email</span>
                  <p className="text-xs font-semibold text-gray-800 truncate select-all">
                    {employee.email && !isPhoneSyntheticEmail(employee.email) ? employee.email : "Not assigned"}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 text-sm font-bold">
                  <i className="ri-phone-line" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Phone</span>
                  <p className="text-xs font-semibold text-gray-800 truncate select-all">
                    {employee.phone || "—"}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 text-sm font-bold">
                  <i className="ri-fingerprint-line" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Biometrics</span>
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {employee.biometric_user_id ? `ID #${employee.biometric_user_id}` : hasBiometric ? "Biometric Only" : "Not Enrolled"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
