import { memo } from "react";
import type { MyEmployee, DirectReport } from "../types";
import { fmtDateTime } from "../profileUtils";
import { ProfileJobDetailsCard } from "./ProfileJobDetailsCard";
import { ProfileDirectReportsList } from "./ProfileDirectReportsList";

interface ProfileWorkInfoSidebarProps {
  role: { name: string; color: string } | null;
  roleLoading: boolean;
  employee: MyEmployee | null;
  employeeLoading: boolean;
  tenure: number | null;
  managerName: string | null;
  userCreatedAt?: string;
  userLastSignInAt?: string;
  directReports: DirectReport[];
  canViewEmployees: boolean;
  email?: string;
}

export const ProfileWorkInfoSidebar = memo(function ProfileWorkInfoSidebar({
  role,
  roleLoading,
  employee,
  employeeLoading,
  tenure,
  userCreatedAt,
  userLastSignInAt,
  directReports,
  canViewEmployees,
  email,
}: ProfileWorkInfoSidebarProps) {
  return (
    <div className="space-y-6">
      {/* ── CARD 1: Role & Job Details ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-[12px] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-shield-user-line text-[#253C7D] text-sm" />
              Role
            </label>
            <div className="shrink-0">
              {roleLoading ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                  <i className="ri-loader-4-line animate-spin" /> Loading...
                </span>
              ) : role ? (
                <span
                  className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full text-white shadow-2xs"
                  style={{ backgroundColor: role.color }}
                >
                  {role.name}
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">Standard User</span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Only a Super Admin can change your role, from the Admin Portal.
          </p>
        </div>

        <ProfileJobDetailsCard
          employee={employee}
          employeeLoading={employeeLoading}
          tenure={tenure}
          email={email}
        />
      </div>

      {/* ── CARD 2: Account Activity & Direct Reports ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
        <div>
          <label className="text-[12px] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <i className="ri-history-line text-[#253C7D] text-sm" />
            Account Activity
          </label>
          <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50 overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <span className="text-[12px] text-gray-500">Member Since</span>
              <span className="text-[13px] font-medium text-gray-900 text-right">
                {fmtDateTime(userCreatedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <span className="text-[12px] text-gray-500">Last Sign-in</span>
              <span className="text-[13px] font-medium text-gray-900 text-right">
                {fmtDateTime(userLastSignInAt)}
              </span>
            </div>
          </div>
        </div>

        <ProfileDirectReportsList directReports={directReports} canViewEmployees={canViewEmployees} />
      </div>
    </div>
  );
});
