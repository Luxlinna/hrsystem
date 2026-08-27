import { memo } from "react";
import type { AppAccess } from "../types";
import { initials } from "../unityUtils";

interface AppAccessTabProps {
  appAccesses: AppAccess[];
  onOpenGrant: () => void;
  onRevoke: (accessId: number, empName: string) => void;
}

export const AppAccessTab = memo(function AppAccessTab({
  appAccesses,
  onOpenGrant,
  onRevoke,
}: AppAccessTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-semibold text-gray-900">
          {appAccesses.length} Users with Access
        </p>
        <button
          onClick={onOpenGrant}
          className="px-3 py-1.5 bg-[#253C7D] text-white text-[11px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
        >
          <i className="ri-user-add-line" />
          <span>Grant Access</span>
        </button>
      </div>

      <div className="space-y-2">
        {appAccesses.map((access) => {
          const emp = access.employees;
          if (!emp) return null;
          const empName = `${emp.first_name} ${emp.last_name}`;

          return (
            <div
              key={access.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors bg-white shadow-2xs"
            >
              {emp.avatar_url ? (
                <img
                  src={emp.avatar_url}
                  alt={empName}
                  className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-100"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] font-bold text-sm shrink-0">
                  {initials(emp.first_name, emp.last_name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{empName}</p>
                <p className="text-[11px] text-gray-500 truncate">
                  {emp.role} &middot; {emp.department}
                </p>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                  access.access_level === "admin"
                    ? "bg-[#253C7D]/10 text-[#253C7D]"
                    : access.access_level === "viewer"
                    ? "bg-gray-100 text-gray-500"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {access.access_level}
              </span>
              <button
                onClick={() => onRevoke(access.id, empName)}
                title="Revoke access"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              >
                <i className="ri-user-unfollow-line text-sm" />
              </button>
            </div>
          );
        })}

        {appAccesses.length === 0 && (
          <div className="py-8 text-center">
            <i className="ri-user-line text-3xl text-gray-300 block mb-2" />
            <p className="text-[13px] text-gray-400">No users have access yet</p>
          </div>
        )}
      </div>
    </div>
  );
});
