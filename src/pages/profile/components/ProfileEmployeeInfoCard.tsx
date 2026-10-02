import { memo } from "react";
import type { MyEmployee } from "../types";
import { GoldFramedAvatar } from "./GoldFramedAvatar";
import { getJobStatusBadge } from "@/pages/employees/constants";

interface ProfileEmployeeInfoCardProps {
  employee: MyEmployee | null;
  displayName: string;
  avatarUrl?: string | null;
  initials?: string;
  managerName: string | null;
  employeeLoading: boolean;
  onAvatarClick?: () => void;
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

  return (
    <div className="w-full">
      {/* Header Label */}
      <div className="pb-3 mb-6 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0284c7] dark:text-sky-400">
          EMPLOYEE INFO
        </h3>
      </div>

      {/* Main Info Card Body matching Image 1 */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 min-w-0">
        {/* Avatar with Golden Frame & Status Badge */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className={`relative group ${onAvatarClick ? "cursor-pointer" : ""}`}
            onClick={onAvatarClick}
            title={onAvatarClick ? "Change photo" : undefined}
          >
            <GoldFramedAvatar
              avatarUrl={avatarUrl || e?.avatar_url}
              initials={initials}
              size="md"
            />
            {onAvatarClick && (
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-[10px] shadow-sm border border-white dark:border-slate-900 transition-transform group-hover:scale-110">
                <i className="ri-camera-fill" />
              </div>
            )}
          </div>
          <span
            className={`mt-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-[2px] text-white whitespace-nowrap leading-tight ${statusBadge.jobColor}`}
          >
            {statusBadge.jobStatus}
          </span>
        </div>

        {/* Info Grid with Employee Details */}
        <div className="flex-1 min-w-0 w-full">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3 text-center sm:text-left truncate">
            {displayName || `${e?.first_name || ""} ${e?.last_name || ""}`.trim() || "Yos Steven"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-12 gap-y-4 text-xs">
            {/* Column 1 */}
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {employeeCode}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Employee Code
                </span>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {designation}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Designation
                </span>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase">
                  {department}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Department
                </span>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {supervisor}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Supervisor
                </span>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase">
                  {empType}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Employee Type
                </span>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase">
                  {contractType}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Contract Type
                </span>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs uppercase">
                  {site}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Site
                </span>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {joinDate}
                </p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                  Joining Date
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
