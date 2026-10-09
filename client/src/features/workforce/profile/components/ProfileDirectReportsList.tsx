import { memo } from "react";
import { Link } from "react-router-dom";
import type { DirectReport } from "../types";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

interface ProfileDirectReportsListProps {
  directReports: DirectReport[];
  canViewEmployees: boolean;
}

export const ProfileDirectReportsList = memo(function ProfileDirectReportsList({
  directReports,
  canViewEmployees,
}: ProfileDirectReportsListProps) {
  if (directReports.length === 0) return null;

  return (
    <div>
      <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
        Direct Reports ({directReports.length})
      </label>
      <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-50 shadow-2xs">
        {directReports.map((r) => {
          const rInitials = `${r.last_name?.[0] || ""}${r.first_name?.[0] || ""}`.toUpperCase() || "?";
          const fullName = formatKhmerFullName(r);
          const content = (
            <div className="flex items-center gap-3 px-4 py-3">
              {r.avatar_url ? (
                <img
                  src={r.avatar_url}
                  alt={fullName}
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-[11px] font-bold shrink-0">
                  {rInitials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-gray-900 truncate">
                  {fullName}
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
  );
});
