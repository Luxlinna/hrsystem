import { memo } from "react";
import type { MyEmployee } from "../types";
import { GoldFramedAvatar } from "./GoldFramedAvatar";
import { getJobStatusBadge } from "@/features/workforce/employees/constants";

interface ProfileEmployeeInfoCardProps {
  employee: MyEmployee | null;
  displayName: string;
  avatarUrl?: string | null;
  initials?: string;
  managerName: string | null;
  employeeLoading: boolean;
  onAvatarClick?: () => void;
  isSuperAdmin?: boolean;
}

const formatDate = (d?: string | null) => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  } catch {
    return d;
  }
};

export const ProfileEmployeeInfoCard = memo(function ProfileEmployeeInfoCard({
  employee: e,
  displayName,
  avatarUrl,
  initials,
  managerName,
  employeeLoading,
  onAvatarClick,
  isSuperAdmin = false,
}: ProfileEmployeeInfoCardProps) {
  const statusBadge = getJobStatusBadge(e?.status);
  const employeeCode = e?.employee_code || "1";
  const supervisor = managerName || "Unknown";
  const site = e?.work_locations?.name || e?.site || e?.branches?.name || "FPHQ";
  const designation = e?.position || e?.role || "Executive Director";
  const empType = e?.employment_type || "FULL-TIME";
  const joinDate = formatDate(e?.join_date || e?.start_date || "2016-10-19");
  const department = e?.department || "OFFICE OF EXECUTIVE DIRECTOR";
  const contractType = e?.contract_type || "PERMANENT (UDC)";

  if (employeeLoading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <i className="ri-loader-4-line animate-spin text-base" /> Loading employee profile...
      </div>
    );
  }

  const infoFields = [
    { label: "Employee Code", value: employeeCode, icon: "ri-hashtag" },
    { label: "Designation", value: designation, icon: "ri-briefcase-line" },
    { label: "Department", value: department, icon: "ri-building-line" },
    { label: "Supervisor", value: supervisor, icon: "ri-user-star-line" },
    { label: "Employee Type", value: empType, icon: "ri-time-line" },
    { label: "Contract Type", value: contractType, icon: "ri-file-text-line" },
    { label: "Work Site", value: site, icon: "ri-map-pin-line" },
    { label: "Joining Date", value: joinDate, icon: "ri-calendar-line" },
  ];

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 mb-4 sm:mb-5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0284c7] dark:text-sky-400 flex items-center gap-1.5">
          <i className="ri-id-card-line text-sm" />
          EMPLOYEE INFO
        </h3>
        <span
          className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full text-white whitespace-nowrap shadow-2xs ${statusBadge.jobColor}`}
        >
          {statusBadge.jobStatus}
        </span>
      </div>

      {/* Main Info Card Body */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 min-w-0">
        {/* Desktop Golden Avatar (Hidden on mobile to eliminate duplication) */}
        <div className="hidden sm:flex flex-col items-center shrink-0">
          <div
            className={`relative group ${onAvatarClick ? "cursor-pointer" : ""}`}
            onClick={onAvatarClick}
            title={onAvatarClick ? "Change photo" : undefined}
          >
            <GoldFramedAvatar
              avatarUrl={avatarUrl || e?.avatar_url}
              initials={initials}
              size="md"
              isSuperAdmin={isSuperAdmin}
            />
            {onAvatarClick && (
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-[10px] shadow-sm border border-white dark:border-slate-900 transition-transform group-hover:scale-110">
                <i className="ri-camera-fill" />
              </div>
            )}
          </div>
        </div>

        {/* 2-Column / 3-Column Info Card Grid */}
        <div className="flex-1 min-w-0 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {infoFields.map((f) => (
              <div
                key={f.label}
                className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-center transition-colors hover:border-slate-200 dark:hover:border-slate-700 shadow-2xs"
              >
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 mb-1">
                  <i className={`${f.icon} text-xs text-sky-600 dark:text-sky-400`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                    {f.label}
                  </span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-[13px] leading-tight truncate" title={String(f.value)}>
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
