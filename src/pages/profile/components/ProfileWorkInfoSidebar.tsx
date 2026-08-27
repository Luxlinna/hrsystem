import { memo } from "react";
import { Link } from "react-router-dom";
import type { MyEmployee, DirectReport } from "../types";
import { STATUS_STYLES } from "../constants";
import { fmtDateTime } from "../profileUtils";

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
  managerName,
  userCreatedAt,
  userLastSignInAt,
  directReports,
  canViewEmployees,
  email,
}: ProfileWorkInfoSidebarProps) {
  return (
    <div className="space-y-8">
      {/* Role */}
      <div>
        <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
          Role
        </label>
        <div className="mt-1.5">
          {roleLoading ? (
            <p className="text-[13px] text-gray-400">Loading...</p>
          ) : role ? (
            <span
              className="inline-flex items-center text-[12px] font-semibold px-3 py-1.5 rounded-full text-white shadow-2xs"
              style={{ backgroundColor: role.color }}
            >
              {role.name}
            </span>
          ) : (
            <p className="text-[13px] text-gray-400">No role assigned yet — contact an admin.</p>
          )}
          <p className="text-[11px] text-gray-400 mt-2">
            Only a Super Admin can change your role, from the Admin Portal.
          </p>
        </div>
      </div>

      {/* Job details */}
      <div>
        <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
          Job Details
        </label>
        {employeeLoading ? (
          <p className="text-[13px] text-gray-400 mt-1.5">Loading...</p>
        ) : employee ? (
          <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-50 shadow-2xs">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] text-gray-500">Job Title</span>
              <span className="text-[13px] font-medium text-gray-900 text-right">
                {employee.role || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] text-gray-500">Department</span>
              <span className="text-[13px] font-medium text-gray-900 text-right">
                {employee.department || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] text-gray-500">Branch</span>
              <span className="text-[13px] font-medium text-gray-900 text-right">
                {employee.branches?.name || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] text-gray-500">Status</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                  STATUS_STYLES[employee.status] || "bg-gray-100 text-gray-500"
                }`}
              >
                {employee.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[12px] text-gray-500">Joined</span>
              <span className="text-[13px] font-medium text-gray-900 text-right">
                {new Date(employee.join_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {tenure !== null && (
                  <span className="text-gray-400">
                    {" "}
                    &middot; {tenure} yr{tenure !== 1 ? "s" : ""}
                  </span>
                )}
              </span>
            </div>
            {managerName && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[12px] text-gray-500">Reports To</span>
                <span className="text-[13px] font-medium text-gray-900 text-right">{managerName}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-gray-400 mt-1.5">
            We couldn't find an employee record matching your account email ({email}).
          </p>
        )}
      </div>

      {/* Account activity */}
      <div>
        <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
          Account Activity
        </label>
        <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-50 shadow-2xs">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[12px] text-gray-500">Member Since</span>
            <span className="text-[13px] font-medium text-gray-900 text-right">
              {fmtDateTime(userCreatedAt)}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[12px] text-gray-500">Last Sign-in</span>
            <span className="text-[13px] font-medium text-gray-900 text-right">
              {fmtDateTime(userLastSignInAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Direct reports */}
      {directReports.length > 0 && (
        <div>
          <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
            Direct Reports ({directReports.length})
          </label>
          <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-50 shadow-2xs">
            {directReports.map((r) => {
              const rInitials = `${r.first_name[0]}${r.last_name[0]}`.toUpperCase();
              const content = (
                <div className="flex items-center gap-3 px-4 py-3">
                  {r.avatar_url ? (
                    <img
                      src={r.avatar_url}
                      alt={r.first_name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-[11px] font-bold shrink-0">
                      {rInitials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 truncate">
                      {r.first_name} {r.last_name}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{r.role}</p>
                  </div>
                </div>
              );
              return canViewEmployees ? (
                <Link
                  key={r.id}
                  to={`/employees/${r.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  {content}
                </Link>
              ) : (
                <div key={r.id}>{content}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
