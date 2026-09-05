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
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={employee.first_name}
                className="w-24 h-24 rounded-2xl object-cover border border-gray-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#253C7D] flex items-center justify-center text-white text-3xl font-bold">
                {initials}
              </div>
            )}
            {canEdit && (
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#253C7D] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#1F336A] transition-colors">
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
              <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                {employee.first_name} {employee.last_name}
              </h1>
              <span
                title={statusMeta.description}
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full w-fit cursor-default ${statusMeta.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
            </div>
            <p className="text-[14px] text-gray-600 mt-1">{employee.role}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{statusMeta.description}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-[12px] text-gray-500">
              <span className="flex items-center gap-1">
                <i className="ri-building-line" />
                {employee.department}
              </span>
              <span className="flex items-center gap-1">
                <i className="ri-building-line" />
                {employee.branches?.name || "Headquarters"}
              </span>
              {employee.work_locations?.name && (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium text-[11px]">
                  <i className="ri-map-pin-2-line" />
                  {employee.work_locations.name}
                </span>
              )}
              {employee.email && !isPhoneSyntheticEmail(employee.email) ? (
                <span className="flex items-center gap-1">
                  <i className="ri-mail-line" />
                  {employee.email}
                </span>
              ) : hasBiometric ? (
                <span
                  className="flex items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded-md font-medium text-[11px]"
                  title="Biometric fingerprint machine only; cannot log into web system"
                >
                  <i className="ri-fingerprint-line text-slate-500" />
                  Biometric Only
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <i className="ri-phone-line" />
                {employee.phone || "—"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            {canEdit && (
              <button
                onClick={onToggleEditing}
                className="px-4 py-2 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors cursor-pointer"
              >
                <i className={`ri-${editing ? "close" : "edit"}-line mr-1`} />
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            )}
            <Link
              to="/org-chart"
              className="px-4 py-2 border border-gray-200 text-gray-700 text-[13px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              <i className="ri-organization-chart mr-1" />
              Org Chart
            </Link>
          </div>
        </div>
      </div>
    </>
  );
});
